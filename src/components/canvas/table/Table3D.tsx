'use client'

/**
 * Table3D — il mondo dietro la home: in alto l'aria dello studio, al centro il
 * banco da lavoro con il fascicolo del portfolio e il Game Boy di Porto
 * Vecchio; superato il bordo, lo sfondo e il resto del sito.
 *
 * E' un <Canvas> fisso dietro tutta la pagina (portale su body, z-index -1).
 * La camera guarda il banco in prospettiva, dritta (bordo orizzontale), e lo
 * fa seguire al riquadro della sezione Progetti: il banco sale dritto da sotto
 * con lo scroll, si ferma al centro con la sezione, poi esce in alto come il
 * resto della pagina. Sopra e sotto c'e' solo lo sfondo rosa. Frameloop "demand": disegna solo quando la camera o un
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
import { Bench } from './Bench'
import { Folder3D, FW, FD } from './Folder3D'
import { Console3D } from './Console3D'
import { WorldBackdrop } from './WorldBackdrop'
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

/* ── Camera: il banco in prospettiva, inquadrato dritto; sale da sotto con lo scroll ── */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function Rig({ phase, mobile, stage, look }: {
  phase: TablePhase; mobile: boolean; stage: Props['stage']; look: MutableRefObject<THREE.Vector3>
}) {
  const { camera, size, invalidate } = useThree()
  const mouse = useRef(new THREE.Vector2())
  const v = useRef({ pos: new THREE.Vector3(), lk: new THREE.Vector3(), up: new THREE.Vector3(), fwd: new THREE.Vector3(), right: new THREE.Vector3() })
  useEffect(() => { invalidate() }, [phase, mobile, size, invalidate])
  // lo scroll muove il banco, il mouse lo sposta appena: si ridisegna solo allora
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

    // l'inquadratura di lavoro, in prospettiva e dritta (camera e punto guardato
    // sulla stessa x: il bordo del banco resta orizzontale), a misura del riquadro
    if (mobile) {
      const k = Math.max(1, 0.62 / stageAspect) * (aspect < stageAspect ? stageAspect / aspect : 1)
      t.pos.copy(V(0, 7.6 * k, 4.6 * k)); t.lk.copy(V(0, 0, 0.35))
    } else {
      const k = Math.max(1, 2.15 / stageAspect) * (r ? vh / r.height : 1) * 0.92
      t.pos.copy(V(0.15, 5.4 * k, 4.9 * k)); t.lk.copy(V(0.15, 0, 0.25))
    }

    const top = !mobile && phase !== 'closed' && phase !== 'returning' && phase !== 'list'
    if (top) {
      // dall'alto, con il fascicolo aperto (2 × larghezza) che sta tutto nell'inquadratura
      const tt = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 2
      const h = Math.max((FD + 0.4) / tt, (FW * 2 + 0.5) / aspect / tt)
      t.pos.set(0, h, 0.001); t.lk.set(0, 0, 0)
    } else if (r) {
      // il banco segue il riquadro della sezione: si sposta la camera lungo il suo
      // «alto» e la sua «destra», senza girarla. Riquadro sotto il centro = banco sotto.
      t.fwd.subVectors(t.lk, t.pos)
      const dist = t.fwd.length()
      t.fwd.normalize()
      t.right.crossVectors(t.fwd, V(0, 1, 0)).normalize()
      t.up.crossVectors(t.right, t.fwd).normalize()
      const viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))
      const dy = ((r.top + r.height / 2) - vh / 2) / vh * viewH
      const dx = ((r.left + r.width / 2) - vw / 2) / vw * viewH * aspect
      // il mouse sposta di pochissimo, solo per dare profondita'
      const sx = -dx + mouse.current.x * 0.08, sy = dy - mouse.current.y * 0.05
      t.pos.addScaledVector(t.right, sx).addScaledVector(t.up, sy)
      t.lk.addScaledVector(t.right, sx).addScaledVector(t.up, sy)
    }

    let moving = false
    // seguendo lo scroll si va quasi alla lettera (lo scroll e' gia' morbido); le aperture sono smorzate
    const k = top || phase === 'returning' || phase === 'closing' ? 5 : 14
    for (const ax of ['x', 'y', 'z'] as const) {
      cam.position[ax] = damp(cam.position[ax], t.pos[ax], k, dt)
      look.current[ax] = damp(look.current[ax], t.lk[ax], k, dt)
      if (Math.abs(cam.position[ax] - t.pos[ax]) > EPS) moving = true
    }
    cam.up.set(0, 1, 0)
    cam.lookAt(look.current)
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
  const look = useRef(new THREE.Vector3(0, 0, 0))

  return (
    <>
      <Rig phase={props.phase} mobile={mobile} stage={props.stage} look={look} />

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
        {/* il fondale: la piscina rosata, dietro al tavolo e alle cose che ha sopra */}
        <WorldBackdrop />
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
        camera={{ fov: 30, position: [0.15, 40, 30], near: 0.1, far: 200 }}
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
