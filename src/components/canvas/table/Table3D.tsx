'use client'

/**
 * Table3D — il mondo dietro la home: in alto l'aria dello studio, al centro il
 * banco da lavoro con il fascicolo del portfolio e il Game Boy di Porto
 * Vecchio, sotto il piano l'ombra tra le gambe del tavolo, dove sta il resto
 * del sito.
 *
 * E' un <Canvas> fisso dietro tutta la pagina (portale su body, z-index -1).
 * La camera segue lo scroll rispetto al tavolo della sezione Progetti: scende
 * dall'aria, si ferma sul banco quando la sezione e' al centro, poi passa
 * sotto il piano. Frameloop "demand": disegna solo quando la camera o un
 * oggetto si muove. I clic arrivano dalla pagina (eventSource = body).
 * Le fasi (chiuso, scivola, si apre...) le decide PortfolioSection.
 */

import { Suspense, useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, N8AO, DepthOfField, Vignette, Noise, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import * as THREE from 'three'
import { loadImage } from './textures'
import { Bench, FLOOR_Y } from './Bench'
import { Folder3D, FW, FD } from './Folder3D'
import { Console3D } from './Console3D'
import styles from './Table3D.module.css'

export type TablePhase = 'closed' | 'sliding' | 'opening' | 'open' | 'closing' | 'returning' | 'list'
export type ScreenRect = { top: number; left: number; width: number; height: number }
export type TableApi = { screenRect: () => ScreenRect | null }

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
  /** il riquadro del tavolo nella sezione Progetti: da li' si capisce dove siamo */
  stage: RefObject<HTMLDivElement | null>
}

const damp = THREE.MathUtils.damp
const EPS = 0.0005
const TEX = '/progetti/tex'

type Images = { logo: HTMLImageElement | null; paper: HTMLImageElement | null; metal: HTMLImageElement | null }

/* ── Camera: una gru sola, dall'aria al banco e sotto il piano ── */

const smooth = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Un punto chiave della discesa: u = dove sta il tavolo rispetto al centro dello schermo (in schermate) */
type Key = { u: number; pos: THREE.Vector3; look: THREE.Vector3; fov: number; free: number }

/** Da u al parametro della curva (i punti chiave sono in ordine di u decrescente) */
function curveParam(keys: Key[], u: number) {
  if (u >= keys[0].u) return 0
  const n = keys.length
  if (u <= keys[n - 1].u) return 1
  for (let i = 0; i < n - 1; i++) {
    const a = keys[i], b = keys[i + 1]
    if (u <= a.u && u >= b.u) {
      const f = smooth((a.u - u) / (a.u - b.u))
      return (i + f) / (n - 1)
    }
  }
  return 1
}

function Rig({ phase, mobile, stage, look }: {
  phase: TablePhase; mobile: boolean; stage: Props['stage']; look: MutableRefObject<THREE.Vector3>
}) {
  const { camera, size, invalidate } = useThree()
  const mouse = useRef(new THREE.Vector2())
  const tmp = useRef({ pos: new THREE.Vector3(), lk: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3() })
  useEffect(() => { invalidate() }, [phase, mobile, size, invalidate])
  // lo scroll muove la gru, il mouse la sposta appena: si ridisegna solo allora
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
    const aspect = size.width / Math.max(1, size.height)
    const r = stage.current?.getBoundingClientRect()
    const vh = window.innerHeight
    // u: quanto il tavolo della sezione e' sotto (+) o sopra (-) il centro dello schermo, in schermate
    const u = r ? (r.top + r.height / 2 - vh / 2) / vh : 3
    const stageAspect = r && r.height > 0 ? r.width / r.height : aspect

    // al banco: l'inquadratura di lavoro, a misura del riquadro della sezione
    let work: THREE.Vector3, workLook: THREE.Vector3
    if (mobile) {
      const k = Math.max(1, 0.62 / stageAspect) * (aspect < stageAspect ? stageAspect / aspect : 1)
      work = V(0, 7.6 * k, 4.6 * k); workLook = V(0, 0, 0.35)
    } else {
      const k = Math.max(1, 2.15 / stageAspect) * (r ? vh / r.height : 1) * 0.92
      work = V(0.1, 5.4 * k, 4.9 * k); workLook = V(0.15, 0, 0.25)
    }

    // la discesa: aria, gru che gira di lato, avvicinamento, banco, bordo, sotto il piano
    const keys: Key[] = [
      { u: 2.6, pos: V(0, 34, 16), look: V(0, 31, -20), fov: 38, free: 0.5 },
      { u: 1.3, pos: V(3.2, 19, 16), look: V(1, 6, -4), fov: 35, free: 0.4 },
      { u: 0.5, pos: work.clone().lerp(V(1.6, 10, 10), 0.6), look: workLook.clone().lerp(V(0.4, 0.4, 0), 0.5), fov: 32, free: 0.25 },
      { u: 0, pos: work, look: workLook, fov: 30, free: 0.1 },
      { u: -0.3, pos: work, look: workLook, fov: 30, free: 0.1 },
      { u: -0.95, pos: V(0.8, 1.6, 13), look: V(0, -2.4, 0), fov: 33, free: 0.3 },
      { u: -1.7, pos: V(0.5, FLOOR_Y + 3.6, 17), look: V(0, FLOOR_Y + 3.2, 0), fov: 36, free: 0.45 },
      { u: -5.5, pos: V(6, FLOOR_Y + 3.3, 15), look: V(3.5, FLOOR_Y + 3, 0), fov: 36, free: 0.45 },
    ]

    const t = tmp.current
    let fov = 30, free = 0.1, roll = 0
    const top = !mobile && phase !== 'closed' && phase !== 'returning' && phase !== 'list'
    if (top) {
      // dall'alto, con il fascicolo aperto (2 × larghezza) che sta tutto nell'inquadratura
      const tt = Math.tan(THREE.MathUtils.degToRad(30 / 2)) * 2
      const h = Math.max((FD + 0.4) / tt, (FW * 2 + 0.5) / aspect / tt)
      t.pos.set(0, h, 0.001); t.lk.set(0, 0, 0); free = 0
    } else {
      const c = curveParam(keys, u)
      const posCurve = new THREE.CatmullRomCurve3(keys.map((k) => k.pos), false, 'centripetal')
      const lookCurve = new THREE.CatmullRomCurve3(keys.map((k) => k.look), false, 'centripetal')
      posCurve.getPoint(c, t.pos); lookCurve.getPoint(c, t.lk)
      const f = c * (keys.length - 1), i = Math.min(keys.length - 2, Math.floor(f)), w = f - i
      fov = keys[i].fov + (keys[i + 1].fov - keys[i].fov) * w
      free = keys[i].free + (keys[i + 1].free - keys[i].free) * w
      // in discesa la gru si inclina appena, poi si raddrizza sul banco
      roll = Math.sin(Math.PI * clamp01((u - 0.2) / 2.2)) * 0.035
    }

    // il mouse sposta la camera di poco, di lato e in alto (meno sul banco)
    t.right.set(1, 0, 0).applyQuaternion(cam.quaternion)
    t.up.set(0, 1, 0).applyQuaternion(cam.quaternion)
    t.pos.addScaledVector(t.right, mouse.current.x * free).addScaledVector(t.up, -mouse.current.y * free * 0.6)

    let moving = false
    for (const ax of ['x', 'y', 'z'] as const) {
      cam.position[ax] = damp(cam.position[ax], t.pos[ax], 4, dt)
      look.current[ax] = damp(look.current[ax], t.lk[ax], 4, dt)
      if (Math.abs(cam.position[ax] - t.pos[ax]) > EPS) moving = true
    }
    const nf = damp(cam.fov, fov, 4, dt)
    if (Math.abs(nf - cam.fov) > 0.001) { cam.fov = nf; cam.updateProjectionMatrix(); moving = true }
    cam.lookAt(look.current)
    cam.rotateZ(roll)
    if (moving) invalidate()
  })
  return null
}

/** Messa a fuoco come in una foto: dove guarda la camera, o sulla console quando e' in mano */
function Focus({ grab, dof, look }: { grab: boolean; dof: MutableRefObject<DepthOfFieldEffect | null>; look: MutableRefObject<THREE.Vector3> }) {
  const want = useRef(new THREE.Vector3())
  useFrame(({ camera }) => {
    const e = dof.current
    if (!e) return
    if (grab) want.current.copy(camera.position).lerp(new THREE.Vector3(0.25, 0, 0.7), 0.6)
    else want.current.copy(look.current)
    e.target?.copy(want.current)
  })
  return null
}

/** Gli oggetti del tavolo: si caricano quando ci si avvicina alla sezione */
function Table(props: Props & { images: Images }) {
  const { phase, grab, mobile } = props
  const [hFolder, setHFolder] = useState(false)
  const [hConsole, setHConsole] = useState(false)
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
        api={props.api}
      />
    </>
  )
}

function World(props: Props & { images: Images | null }) {
  const { grab, mobile } = props
  const dof = useRef<DepthOfFieldEffect | null>(null)
  const look = useRef(new THREE.Vector3(0, 31, -20))

  return (
    <>
      <Rig phase={props.phase} mobile={mobile} stage={props.stage} look={look} />
      <fog attach="fog" args={['#2a1f17', 28, 80]} />

      {/* luce e sfondo: lo studio fotografico (HDR CC0 di Poly Haven), sfocato come un cielo caldo,
          piu' una lampada da banco calda che fa l'ombra del tavolo sul pavimento */}
      <Suspense fallback={null}>
        <Environment files={`${TEX}/studio.hdr`} environmentIntensity={1.35} background backgroundBlurriness={0.45} backgroundIntensity={0.55} />
      </Suspense>
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[-8, 15, 5]}
        intensity={3.2}
        color="#fff1df"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-far={50}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[5, 4, 4]} intensity={0.45} color="#dfe8ff" />

      {props.images && <Suspense fallback={null}><Table {...props} images={props.images} /></Suspense>}

      {/* come in un render: occlusione negli angoli, messa a fuoco, grana, vignettatura */}
      <Focus grab={grab} dof={dof} look={look} />
      <EffectComposer multisampling={mobile ? 0 : 4}>
        <N8AO aoRadius={0.5} distanceFalloff={0.5} intensity={3.5} quality={mobile ? 'low' : 'medium'} halfRes={mobile} />
        <DepthOfField ref={dof} target={[0.3, 0, 0.3]} worldFocusRange={6} bokehScale={mobile ? 1.5 : 2.5} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.25} darkness={0.55} />
        <Noise opacity={0.035} />
      </EffectComposer>
    </>
  )
}

export default function Table3D(props: Props) {
  // Il tavolo (texture, logo, font) si carica solo avvicinandosi alla sezione:
  // in cima alla pagina basta l'aria dello studio
  const [near, setNear] = useState(false)
  useEffect(() => {
    if (near) return
    const check = () => {
      const r = props.stage.current?.getBoundingClientRect()
      if (r && r.top < window.innerHeight * 2.5) setNear(true)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
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
        camera={{ fov: 30, position: [0, 34, 14], near: 0.1, far: 200 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
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
