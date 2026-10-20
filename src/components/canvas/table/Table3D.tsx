'use client'

/**
 * Table3D — il tavolo dei Progetti in 3D: un banco da lavoro con sopra il
 * fascicolo del portfolio e il Game Boy pieghevole di Porto Vecchio, con luci,
 * ombre e materiali da render.
 *
 * Gira in un suo <Canvas> solo dentro la sezione, con frameloop "demand":
 * disegna solo quando qualcosa si muove, a riposo non costa niente.
 * Le fasi (chiuso, scivola, si apre...) le decide PortfolioSection; qui ogni
 * oggetto insegue la sua posizione con uno smorzamento.
 */

import { Suspense, useEffect, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, N8AO, DepthOfField, Vignette, Noise, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import * as THREE from 'three'
import { loadImage } from './textures'
import { Bench } from './Bench'
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
}

const damp = THREE.MathUtils.damp
const EPS = 0.0005
const TEX = '/progetti/tex'

type Images = { logo: HTMLImageElement | null; paper: HTMLImageElement | null; metal: HTMLImageElement | null }

/* ── Camera: banco in prospettiva, poi dall'alto sul fascicolo aperto ── */

function Rig({ phase, mobile }: { phase: TablePhase; mobile: boolean }) {
  const { camera, size, invalidate } = useThree()
  const look = useRef(new THREE.Vector3(0.3, 0, 0.3))
  useEffect(() => { invalidate() }, [phase, mobile, size, invalidate])

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / Math.max(1, size.height)
    const top = !mobile && phase !== 'closed' && phase !== 'returning' && phase !== 'list'
    let to: THREE.Vector3, lk: THREE.Vector3
    if (top) {
      // dall'alto, con il fascicolo aperto (2 × larghezza) che sta tutto nell'inquadratura
      const t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 2
      const h = Math.max((FD + 0.4) / t, (FW * 2 + 0.5) / aspect / t)
      to = new THREE.Vector3(0, h, 0.001); lk = new THREE.Vector3(0, 0, 0)
    } else if (mobile) {
      const k = Math.max(1, 0.62 / aspect)
      to = new THREE.Vector3(0, 7.6 * k, 4.6 * k); lk = new THREE.Vector3(0, 0, 0.35)
    } else {
      const k = Math.max(1, 2.15 / aspect)
      to = new THREE.Vector3(0.1, 5.4 * k, 4.9 * k); lk = new THREE.Vector3(0.15, 0, 0.25)
    }
    let moving = false
    for (const ax of ['x', 'y', 'z'] as const) {
      camera.position[ax] = damp(camera.position[ax], to[ax], 5, dt)
      look.current[ax] = damp(look.current[ax], lk[ax], 5, dt)
      if (Math.abs(camera.position[ax] - to[ax]) > EPS) moving = true
    }
    camera.lookAt(look.current)
    if (moving) invalidate()
  })
  return null
}

/** Messa a fuoco come in una foto: sul banco, o sulla console quando e' in mano */
function Focus({ grab, dof }: { grab: boolean; dof: MutableRefObject<DepthOfFieldEffect | null> }) {
  const want = useRef(new THREE.Vector3(0.3, 0, 0.3))
  useFrame(({ camera }) => {
    const e = dof.current
    if (!e) return
    if (grab) want.current.copy(camera.position).lerp(new THREE.Vector3(0.25, 0, 0.7), 0.6)
    else want.current.set(0.3, 0, 0.3)
    e.target?.copy(want.current)
  })
  return null
}

function Scene(props: Props & { images: Images }) {
  const { phase, grab, mobile } = props
  const [hFolder, setHFolder] = useState(false)
  const [hConsole, setHConsole] = useState(false)
  const gl = useThree((s) => s.gl)
  const dof = useRef<DepthOfFieldEffect | null>(null)
  // rugosita' fotografiche (CC0): carta, metallo spazzolato, plastica
  const [paperRough, metalRough, plasticRough] = useLoader(THREE.TextureLoader, [
    `${TEX}/paper_rough.webp`, `${TEX}/metal_rough.webp`, `${TEX}/plastic_rough.webp`,
  ])

  useEffect(() => {
    gl.domElement.style.cursor = hFolder || hConsole ? 'pointer' : ''
  }, [gl, hFolder, hConsole])

  return (
    <>
      <Rig phase={phase} mobile={mobile} />

      {/* luce: lo studio fotografico (HDR CC0 di Poly Haven) piu' una lampada da banco calda */}
      <Environment files={`${TEX}/studio.hdr`} environmentIntensity={1.35} />
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[-4, 7.5, 2.5]}
        intensity={3.2}
        color="#fff1df"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[5, 4, 4]} intensity={0.45} color="#dfe8ff" />
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

      {/* come in un render: occlusione negli angoli, messa a fuoco, grana, vignettatura */}
      <Focus grab={grab} dof={dof} />
      <EffectComposer multisampling={mobile ? 0 : 4}>
        <N8AO aoRadius={0.5} distanceFalloff={0.5} intensity={3.5} quality={mobile ? 'low' : 'medium'} halfRes={mobile} />
        <DepthOfField ref={dof} target={[0.3, 0, 0.3]} worldFocusRange={5} bokehScale={mobile ? 1.5 : 2.5} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.25} darkness={0.55} />
        <Noise opacity={0.035} />
      </EffectComposer>
    </>
  )
}

export default function Table3D(props: Props) {
  // Le scritte sono disegnate con i font del sito e il logo: si aspetta che siano pronti
  const [images, setImages] = useState<Images | null>(null)
  useEffect(() => {
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
  }, [])

  return (
    <Canvas
      className={styles.canvas}
      frameloop="demand"
      shadows="soft"
      dpr={[1, 1.5]}
      camera={{ fov: 30, position: [0.1, 5.4, 4.9], near: 0.1, far: 60 }}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#2a1f17']} />
      {images && <Suspense fallback={null}><Scene {...props} images={images} /></Suspense>}
    </Canvas>
  )
}
