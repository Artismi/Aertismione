'use client'

/**
 * HologramCamera — la pagina del QR.
 *
 * Appena si apre chiede la fotocamera. Se la si concede, l'immagine della
 * fotocamera riempie lo schermo e sopra galleggia il logo con lo stesso
 * shader della home. Se la si rifiuta, o la fotocamera non c'e', si torna
 * al sito: niente pagine intermedie.
 *
 * Non usa Quick Look o Scene Viewer perche' non eseguono shader: il vetro
 * del logo esiste solo se lo disegna il nostro WebGL.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, Environment, Float, Lightformer, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { AR } from '@/config/content'
import { createLogoGlass, createLogoEdges, applyLogoHologram } from '@/components/canvas/logoHologram'
import { causticsVertexShader, causticsFragmentShader } from '@/components/canvas/CausticsPlane'
import styles from './ar.module.css'

/** Il file AR e' largo 0,4 unita'; cosi' ha la stessa grandezza del logo in home. */
const SITE_SCALE = 7.2
const SITE_WIDTH = 0.4 * SITE_SCALE
/** Opacita' del contorno: quella che LogoModel usa in cima alla home. */
const EDGE_OPACITY = 0.32
/** Vetro piu' coprente che in home: sul fondo scuro della stanza deve restare bianco, non grigio. */
const GLASS = { edgeAlpha: 0.9, faceAlpha: 1, color: '#ffe2ec', emissive: '#f2b3cb' }

/**
 * L'ambiente della home, da riflettere: la piscina rosa di CausticsPlane
 * stesa tutt'intorno al logo, piu' due pannelli bianchi per i riflessi netti
 * che in home da' l'ambiente "studio". Dentro <Environment> non si vede: il
 * logo la riflette e basta.
 */
function HomeAmbience() {
  const uniforms = useMemo(() => ({
    u_time:  { value: 0 },
    u_fade:  { value: 1 },
    u_white: { value: 0 },
    u_res:   { value: new THREE.Vector2(2, 1) },
  }), [])

  useFrame((_, delta) => { uniforms.u_time.value += delta })

  return (
    <>
      <mesh scale={20}>
        <sphereGeometry args={[1, 48, 24]} />
        <shaderMaterial
          side={THREE.BackSide}
          uniforms={uniforms}
          vertexShader={causticsVertexShader}
          fragmentShader={causticsFragmentShader}
        />
      </mesh>
      <Lightformer form="rect" intensity={3} position={[0, 5, 4]} scale={[8, 2, 1]} />
      <Lightformer form="rect" intensity={1.5} position={[-6, 1, 3]} rotation-y={Math.PI / 3} scale={[3, 6, 1]} />
    </>
  )
}

function Hologram({ spin }: { spin: React.RefObject<number> }) {
  const { scene } = useGLTF(AR.model)
  const { viewport } = useThree()
  const rotatingRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  const glass = useMemo(() => createLogoGlass(GLASS), [])

  useEffect(() => {
    const edges = createLogoEdges()
    // Come in home a pagina ferma: e' il contorno a far leggere le lettere.
    edges.uniforms.u_opacity.value = EDGE_OPACITY
    return applyLogoHologram(scene, glass, edges)
  }, [scene, glass])

  useFrame((_, delta) => {
    if (!rotatingRef.current) return
    // Lo stesso dondolio della home, piu' quanto lo si e' girato col dito.
    timeRef.current += delta * 0.4
    rotatingRef.current.rotation.y = Math.sin(timeRef.current) * (Math.PI / 6) + spin.current
  })

  // Sul telefono in verticale il logo della home non ci starebbe: si stringe fino all'88% della larghezza.
  const fit = Math.min(1, (viewport.width * 0.88) / SITE_WIDTH)

  return (
    <group scale={fit}>
      <Center>
        <Float speed={3} rotationIntensity={0} floatIntensity={0.3}>
          <group ref={rotatingRef}>
            <primitive object={scene} scale={SITE_SCALE} />
          </group>
        </Float>
      </Center>

      {/* Le luci di LogoModel, nella stessa posizione. */}
      <pointLight position={[0, 4, 3]} intensity={18} color="#ffffff" />
      <pointLight position={[0, 0, -4]} intensity={12} color="#e8f4ff" />
      <pointLight position={[-3, 1, 2]} intensity={8} color="#fce4f0" />
      <pointLight position={[3, -2, 1]} intensity={5} color="#f0e8ff" />
    </group>
  )
}

export function HologramCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [live, setLive] = useState(false)
  const spin = useRef(0)
  const drag = useRef<number | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    // replace, non push: col tasto indietro non si ritorna alla richiesta.
    const leave = () => window.location.replace(AR.fallback)

    if (!navigator.mediaDevices?.getUserMedia) {
      leave()
      return
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(async (s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        stream = s
        const video = videoRef.current
        if (!video) return
        video.srcObject = s
        await video.play().catch(() => {})
        setLive(true)
      })
      .catch(leave)

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <main
      className={styles.root}
      onPointerDown={(e) => { drag.current = e.clientX }}
      onPointerMove={(e) => {
        if (drag.current === null) return
        spin.current += (e.clientX - drag.current) * 0.01
        drag.current = e.clientX
      }}
      onPointerUp={() => { drag.current = null }}
      onPointerCancel={() => { drag.current = null }}
    >
      <video ref={videoRef} className={styles.video} playsInline muted autoPlay />

      {live ? (
        <>
          <Canvas
            className={styles.canvas}
            camera={{ position: [0, 0, 6], fov: 35 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              {/* frames Infinity: la piscina si muove, e con lei i riflessi. */}
              <Environment frames={Infinity} resolution={128}>
                <HomeAmbience />
              </Environment>
              <Hologram spin={spin} />
            </Suspense>
          </Canvas>
          <a href={AR.fallback} className={styles.close} aria-label={AR.close}>×</a>
        </>
      ) : (
        <p className={styles.asking}>{AR.asking}</p>
      )}
    </main>
  )
}
