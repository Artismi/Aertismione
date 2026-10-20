'use client'

/**
 * Table3D — il mondo della home, uno solo: il logo di vetro sospeso in aria e,
 * piu' giu', il banco da lavoro con il fascicolo del portfolio e il Game Boy di
 * Porto Vecchio, tutto dentro la piscina rosa.
 *
 * E' un <Canvas> fisso dietro tutta la pagina (portale su body, z-index -1).
 * Il mondo scorre con la pagina (vedi Rig): il logo sta nella prima schermata,
 * il banco nel riquadro della sezione Progetti, e ognuno entra ed esce con la
 * sua sezione. Lo sfondo rosa e la luce sono gli stessi per tutto.
 * Frameloop "demand": disegna solo quando la camera o un
 * oggetto si muove. I clic arrivano dalla pagina (eventSource = body).
 * Le fasi (chiuso, scivola, si apre...) le decide PortfolioSection.
 * Il tabellone della bilia lo disegna PortfolioSection su un canvas 2D: qui
 * diventa la stampa dentro il fascicolo, e il mouse viene riportato sul tabellone.
 */

import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, N8AO, Vignette, Noise, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type EffectComposer as Composer } from 'postprocessing'
import * as THREE from 'three'
import { loadImage } from './textures'
import { Bench } from './Bench'
import { Folder3D, FW, FD, BW, BD, BOARD_Y, MOBILE_Z } from './Folder3D'
import { Console3D } from './Console3D'
import { WorldBackdrop } from './WorldBackdrop'
import { LogoModel } from '../LogoModel'
import styles from './Table3D.module.css'

export type TablePhase = 'closed' | 'sliding' | 'opening' | 'open' | 'closing' | 'returning' | 'list'
/** u, v tra 0 e 1 sul tabellone (v = 0 in alto); inside = il punto cade sul fascicolo */
export type BoardPoint = { u: number; v: number; inside: boolean }
export type TableApi = {
  /** dal punto sullo schermo al punto sul tabellone, anche fuori (per tirare la fionda) */
  toBoard: (clientX: number, clientY: number) => BoardPoint | null
  /** il canvas del tabellone e' stato ridisegnato */
  refresh: () => void
}

type Props = {
  phase: TablePhase
  grab: boolean
  mobile: boolean
  thumbs: string[]
  count: number
  folderLabel: string
  folderHint: string
  game: { title: string; hint: string; screen: string }
  onFolder: () => void
  onConsole: () => void
  api: MutableRefObject<TableApi | null>
  /** il canvas 2D su cui PortfolioSection disegna il tabellone */
  board: RefObject<HTMLCanvasElement | null>
  /** il riquadro del tavolo nella sezione Progetti: da li' si capisce dove siamo */
  stage: RefObject<HTMLDivElement | null>
}

const damp = THREE.MathUtils.damp
const EPS = 0.0005
const TEX = '/progetti/tex'

type Images = { logo: HTMLImageElement | null; paper: HTMLImageElement | null; metal: HTMLImageElement | null }

/* ── Camera: il mondo scorre con la pagina ── */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** dove sta il logo nella prima schermata, in frazione dell'altezza dello schermo */
const LOGO_AT = 0.45

/**
 * La camera guarda il banco sempre dalla stessa angolazione e scorre con la
 * pagina, lungo il suo «alto»: il mondo e' fermo rispetto alla pagina, come se
 * fosse disegnato sotto. Il banco sta nel riquadro della sezione Progetti e il
 * logo in cima, all'altezza della prima schermata: ognuno entra ed esce con la
 * sua sezione e non compare altrove. Il logo e' nello stesso spazio del banco,
 * girato verso la camera.
 */
function Rig({ phase, mobile, stage, look, logo }: {
  phase: TablePhase; mobile: boolean; stage: Props['stage']; look: MutableRefObject<THREE.Vector3>
  logo: RefObject<THREE.Group | null>
}) {
  const { camera, size, invalidate } = useThree()
  const mouse = useRef(new THREE.Vector2())
  const v = useRef({
    pos: new THREE.Vector3(), lk: new THREE.Vector3(), up: new THREE.Vector3(), fwd: new THREE.Vector3(),
    right: new THREE.Vector3(), m: new THREE.Matrix4(), camUp: new THREE.Vector3(0, 1, 0),
  })
  useEffect(() => { invalidate() }, [phase, mobile, size, invalidate])
  // lo scroll muove il mondo, il mouse lo sposta appena: si ridisegna solo allora
  useEffect(() => {
    const on = () => invalidate()
    const move = (e: PointerEvent) => {
      mouse.current.set(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1)
      invalidate()
    }
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('pointermove', move, { passive: true })
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('pointermove', move) }
  }, [invalidate])

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera
    const vw = size.width, vh = size.height, aspect = vw / Math.max(1, vh)
    const r = stage.current?.getBoundingClientRect()
    const stageAspect = r && r.height > 0 ? r.width / r.height : aspect
    const t = v.current

    // l'inquadratura di lavoro, in prospettiva e dritta, a misura del riquadro
    if (mobile) {
      const k = Math.max(1, 0.62 / stageAspect) * (aspect < stageAspect ? stageAspect / aspect : 1)
      t.pos.set(0, 7.6 * k, 4.6 * k); t.lk.set(0, 0, 0.35)
    } else {
      const k = Math.max(1, 2.15 / stageAspect) * (r ? vh / r.height : 1) * 0.92
      t.pos.set(0.15, 5.4 * k, 4.9 * k); t.lk.set(0.15, 0, 0.25)
    }
    t.fwd.subVectors(t.lk, t.pos)
    const dist = t.fwd.length()
    t.fwd.normalize()
    t.right.crossVectors(t.fwd, V(0, 1, 0)).normalize()
    t.up.crossVectors(t.right, t.fwd).normalize()
    // quanto e' alto lo schermo, nel mondo, alla distanza del banco
    const viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))

    if (r) {
      // il logo: in cima alla pagina, nello stesso spazio del banco, girato verso la camera
      const g = logo.current
      if (g) {
        const fromStage = ((r.top + r.height / 2) - (vh * LOGO_AT - window.scrollY)) / vh * viewH
        g.position.copy(t.lk).addScaledVector(t.up, fromStage).addScaledVector(t.right, -((r.left + r.width / 2) - vw / 2) / vh * viewH)
        g.quaternion.setFromRotationMatrix(t.m.lookAt(t.pos, t.lk, t.up))
      }
    }

    const top = phase !== 'closed' && phase !== 'returning' && phase !== 'list'
    if (top && mobile) {
      // da telefono il fascicolo aperto si guarda girato di 90°: il lato lungo in
      // verticale, cosi' riempie lo schermo (in alto c'e' la pagina di sinistra)
      const tt = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 2
      const h = Math.max((FW * 2 + 0.4) / tt, (FD + 0.25) / aspect / tt)
      t.pos.set(0, h, MOBILE_Z); t.lk.set(0, 0, MOBILE_Z)
    } else if (top) {
      // dall'alto, con il fascicolo aperto (2 × larghezza) che sta tutto nell'inquadratura
      const tt = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 2
      const h = Math.max((FD + 0.4) / tt, (FW * 2 + 0.5) / aspect / tt)
      t.pos.set(0, h, 0.001); t.lk.set(0, 0, 0)
    } else if (r) {
      // il banco segue il riquadro della sezione: si sposta la camera lungo il suo
      // «alto» e la sua «destra», senza girarla. Riquadro sotto il centro = banco sotto.
      const dy = ((r.top + r.height / 2) - vh / 2) / vh * viewH
      const dx = ((r.left + r.width / 2) - vw / 2) / vw * viewH * aspect
      // il mouse sposta di pochissimo, solo per dare profondita'
      const sx = -dx + mouse.current.x * 0.08, sy = dy - mouse.current.y * 0.05
      t.pos.addScaledVector(t.right, sx).addScaledVector(t.up, sy)
      t.lk.addScaledVector(t.right, sx).addScaledVector(t.up, sy)
    }

    let moving = false
    // seguendo lo scroll si va quasi alla lettera (lo scroll e' gia' morbido); le aperture sono smorzate
    const k = top || phase === 'returning' ? 5 : 16
    for (const ax of ['x', 'y', 'z'] as const) {
      cam.position[ax] = damp(cam.position[ax], t.pos[ax], k, dt)
      look.current[ax] = damp(look.current[ax], t.lk[ax], k, dt)
      // si ridisegna finche' arrivano sia la camera sia il punto guardato
      if (Math.abs(cam.position[ax] - t.pos[ax]) > EPS || Math.abs(look.current[ax] - t.lk[ax]) > EPS) moving = true
    }
    // l'«alto» della camera gira piano verso quello voluto (da telefono, col fascicolo aperto, -x)
    const wantUp = top && mobile ? V(-1, 0, 0) : V(0, 1, 0)
    for (const ax of ['x', 'y', 'z'] as const) t.camUp[ax] = damp(t.camUp[ax], wantUp[ax], k, dt)
    if (t.camUp.distanceTo(wantUp) > EPS) moving = true
    cam.up.copy(t.camUp).normalize()
    cam.lookAt(look.current)
    if (moving) invalidate()
  })
  return null
}

/**
 * Il tabellone: il canvas della bilia diventa la stampa della tavola stesa sul
 * fascicolo aperto, e il mouse si riporta dallo schermo al piano della tavola.
 */
function useBoard(board: Props['board'], api: Props['api'], mobile: boolean) {
  const { camera, gl, invalidate } = useThree()
  const tex = useMemo(() => {
    const c = board.current
    if (!c) return null
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [board])
  useEffect(() => () => { tex?.dispose() }, [tex])

  useEffect(() => {
    const ray = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BOARD_Y)
    const hit = new THREE.Vector3(), ndc = new THREE.Vector2()
    const center = mobile ? MOBILE_Z : 0
    api.current = {
      toBoard: (cx, cy) => {
        const r = gl.domElement.getBoundingClientRect()
        ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1)
        ray.setFromCamera(ndc, camera)
        if (!ray.ray.intersectPlane(plane, hit)) return null
        // da aperto il tabellone e' centrato in x = 0, z = center
        const u = hit.x / BW + 0.5, v = (hit.z - center) / BD + 0.5
        return { u, v, inside: u >= 0 && u <= 1 && v >= 0 && v <= 1 }
      },
      refresh: () => {
        if (!tex) return
        tex.needsUpdate = true
        invalidate()
      },
    }
    return () => { api.current = null }
  }, [api, camera, gl, invalidate, tex, mobile])

  return tex
}

/** Gli oggetti del tavolo: si caricano quando ci si avvicina alla sezione */
function Table(props: Props & { images: Images }) {
  const { phase, grab, mobile } = props
  const [hFolder, setHFolder] = useState(false)
  const [hConsole, setHConsole] = useState(false)
  const board = useBoard(props.board, props.api, mobile)
  // rugosita' fotografiche (CC0): carta, metallo spazzolato, plastica
  const [paperRough, metalRough, plasticRough] = useLoader(THREE.TextureLoader, [
    `${TEX}/paper_rough.webp`, `${TEX}/metal_rough.webp`, `${TEX}/plastic_rough.webp`,
  ])

  // il puntatore passa dalla pagina: la manina la mettiamo sul body
  useEffect(() => {
    document.body.style.cursor = hFolder || hConsole ? 'pointer' : ''
    return () => { document.body.style.cursor = '' }
  }, [hFolder, hConsole])

  return (
    <>
      <Bench mobile={mobile} metal={props.images.metal} metalRough={metalRough} />

      <Folder3D
        phase={phase}
        mobile={mobile}
        hovered={hFolder}
        thumbs={props.thumbs}
        count={props.count}
        label={props.folderLabel}
        logo={props.images.logo}
        paper={props.images.paper}
        paperRough={paperRough}
        metalRough={metalRough}
        board={board}
        onPointer={setHFolder}
        onClick={props.onFolder}
      />
      <Console3D
        phase={phase}
        mobile={mobile}
        grab={grab}
        hovered={hConsole}
        game={props.game}
        logo={props.images.logo}
        plasticRough={plasticRough}
        metalRough={metalRough}
        onPointer={setHConsole}
        onClick={props.onConsole}
      />
    </>
  )
}

/* ── Risparmio: il lavoro pesante solo quando serve ── */

/**
 * Per gran parte della pagina il mondo e' solo il fondale rosa: banco e logo
 * sono fuori schermo. Allora il banco non si disegna e l'occlusione (N8AO) si
 * ferma, tanto il fondale copre tutto. L'ombra del sole si ricalcola solo
 * quando qualcosa sul banco si muove, non a ogni fotogramma.
 */
function Budget({ stage, table, composer }: {
  stage: RefObject<HTMLDivElement | null>
  table: RefObject<THREE.Group | null>
  composer: RefObject<Composer | null>
}) {
  const gl = useThree((s) => s.gl)
  const was = useRef<boolean | null>(null)
  const sig = useRef(0)

  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => { gl.shadowMap.autoUpdate = true }
  }, [gl])

  // dopo le animazioni (priorita' 0), prima del composer (1)
  useFrame(() => {
    const vh = window.innerHeight
    const r = stage.current?.getBoundingClientRect()
    const onTable = !!r && r.bottom > -60 && r.top < vh + 60
    const onLogo = window.scrollY < vh * 1.3
    const g = table.current
    if (g) g.visible = onTable
    composer.current?.passes.forEach((p) => {
      if ('configuration' in p) p.enabled = onTable || onLogo // N8AOPostPass
    })

    if (!onTable || !g) { was.current = onTable; return }
    g.updateMatrixWorld()
    let k = 0
    g.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh || !o.castShadow) return
      const m = o.matrixWorld.elements
      k += m[12] * 1.31 + m[13] * 1.73 + m[14] * 2.11 + m[0] * 0.37 + m[1] * 0.53 + m[2] * 0.71 + m[4] * 0.97 + m[6] * 1.19 + m[9] * 1.43
    })
    if (was.current !== onTable || Math.abs(k - sig.current) > 1e-5) gl.shadowMap.needsUpdate = true
    sig.current = k
    was.current = onTable
  }, 0.5)
  return null
}

function World(props: Props & { images: Images | null }) {
  const { mobile } = props
  const look = useRef(new THREE.Vector3(0, 0, 0))
  const logo = useRef<THREE.Group>(null)
  const table = useRef<THREE.Group>(null)
  const composer = useRef<Composer>(null)

  return (
    <>
      <Rig phase={props.phase} mobile={mobile} stage={props.stage} look={look} logo={logo} />

      {/* luce: lo studio fotografico (HDR CC0 di Poly Haven) e una lampada da banco calda
          che fa l'ombra del tavolo sul pavimento */}
      <Suspense fallback={null}>
        <Environment files={`${TEX}/studio.hdr`} environmentIntensity={1.35} />
      </Suspense>
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[-8, 15, 5]}
        intensity={3.2}
        color="#fff1df"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-far={50}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[5, 4, 4]} intensity={0.45} color="#dfe8ff" />

      {/* il logo di vetro, in cima al mondo (Rig lo mette all'altezza della prima schermata):
          si carica subito, e' la prima cosa che si vede */}
      <group ref={logo}>
        <Suspense fallback={null}>
          <LogoModel inWorld scale={mobile ? 0.75 : 1} />
        </Suspense>
      </group>

      <group ref={table}>
        {props.images && <Suspense fallback={null}><Table {...props} images={props.images} /></Suspense>}
      </group>
      <Budget stage={props.stage} table={table} composer={composer} />

      {/* come in un render: occlusione negli angoli, grana, vignettatura */}
      {/* niente messa a fuoco: costava piu' di tutto il resto e faceva scattare lo scroll */}
      <EffectComposer ref={composer} multisampling={mobile ? 0 : 2}>
        <N8AO aoRadius={0.5} distanceFalloff={0.5} intensity={3.5} quality={mobile ? 'low' : 'medium'} halfRes />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.25} darkness={0.55} />
        <Noise opacity={0.035} />
        {/* il fondale: la piscina rosata, dietro al tavolo e alle cose che ha sopra */}
        <WorldBackdrop />
      </EffectComposer>
    </>
  )
}

export default function Table3D(props: Props) {
  // Il banco (texture, scritte, font) si carica avvicinandosi alla sezione, o
  // appena la pagina e' pronta: in cima basta il logo nell'aria
  const [near, setNear] = useState(false)
  useEffect(() => {
    if (near) return
    const check = () => {
      const r = props.stage.current?.getBoundingClientRect()
      if (r && r.top < window.innerHeight * 2.5) setNear(true)
    }
    check()
    // la camera vede il banco gia' dalla seconda sezione: lo si carica comunque appena la pagina e' ferma
    const idle = window.setTimeout(() => setNear(true), 2500)
    window.addEventListener('scroll', check, { passive: true })
    return () => { window.clearTimeout(idle); window.removeEventListener('scroll', check) }
  }, [near, props.stage])

  // Le scritte sono disegnate con i font del sito e il logo: si aspetta che siano pronti
  const [images, setImages] = useState<Images | null>(null)
  useEffect(() => {
    if (!near) return
    let alive = true
    Promise.all([
      document.fonts.ready,
      loadImage('/artismi-logo.png'),
      loadImage(`${TEX}/paper_color.webp`),
      loadImage(`${TEX}/metal_color.webp`),
    ]).then(([, logo, paper, metal]) => {
      if (alive) setImages({ logo, paper, metal })
    })
    return () => { alive = false }
  }, [near])

  return createPortal(
    <div className={styles.world} aria-hidden="true">
      <Canvas
        frameloop="demand"
        shadows="soft"
        dpr={[1, 1.5]}
        camera={{ fov: 30, position: [0.15, 40, 30], near: 0.1, far: 200 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        // la plastica trasparente del Game Boy ridisegna la scena dietro di se':
        // a meta' risoluzione, sotto un guscio satinato non si vede la differenza
        onCreated={({ gl }) => { gl.transmissionResolutionScale = 0.5 }}
        eventSource={document.body}
        eventPrefix="client"
      >
        <color attach="background" args={['#2a1f17']} />
        <World {...props} images={images} />
      </Canvas>
    </div>,
    document.body,
  )
}
