'use client'

/**
 * ClientExperience — Il layer 3D completo con scroll-driven camera.
 *
 * Architettura:
 * - La scena 3D è FIXED, occupa tutto lo schermo (z-index: 0)
 * - L'utente scrolla la pagina normalmente (scroll nativo Next.js)
 * - La camera 3D segue il scroll virtuale:
 *     scrollY=0    → Logo in primo piano (position y=0)
 *     scrollY=1600 → Avatar+Pavimento (position y=-18)
 * - Le sezioni DOM (Servizi, Chi Sono) sono overlay position:fixed
 *   che appaiono tramite opacity quando la camera è nel range giusto.
 *
 * Lo scroll nativo del browser è usato per determinare la posizione
 * nell'esperienza, con lerp fluido per la camera.
 */

import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { Html, useProgress, useGLTF } from '@react-three/drei'
import { HeroStage } from '../components/canvas/HeroStage'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../stores/useStore'
import type { AvatarTarget } from '../components/canvas/AvatarParticles'
import { usePathname } from 'next/navigation'

// ─── Preload all models immediately ───────────────────────────────────────────
useGLTF.preload('/models/logo.glb')
useGLTF.preload('/models/avatar.glb')
useGLTF.preload('/models/Nave.glb')
useGLTF.preload('/models/Background_v2.glb')
// ──────────────────────────────────────────────────────────────────────────────

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div style={{
        fontFamily: 'monospace',
        fontSize: '0.7rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: '#888880',
      }}>
        {progress.toFixed(0)}%
      </div>
    </Html>
  )
}

/**
 * ScrollSync — reads window.scrollY every frame and syncs it to the store.
 * We use the *native* page scroll so that Next.js sections work naturally.
 * The camera then interprets this as vertical movement through the 3D world.
 *
 * Mapping:
 *   window.scrollY = 0     → camera at y=2 (logo)
 *   window.scrollY = 2000  → camera at y=-16 (avatar floor)
 */
function ScrollSync() {
  const setScrollY = useStore((s) => s.setScrollY)
  const setAboutSectionTop = useStore((s) => s.setAboutSectionTop)
  const setContactSectionTop = useStore((s) => s.setContactSectionTop)

  useEffect(() => {
    // Le posizioni delle sezioni cambiano solo al resize, non ad ogni scroll
    const updateSections = () => {
      const aboutEl = document.getElementById('chi-sono')
      if (aboutEl) setAboutSectionTop(aboutEl.offsetTop)
      const contactEl = document.getElementById('contatti')
      if (contactEl) setContactSectionTop(contactEl.offsetTop)
    }

    // Lo scroll aggiorna solo scrollY — nessun DOM query
    const updateScroll = () => setScrollY(window.scrollY)

    updateSections()
    updateScroll()

    window.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('resize', updateSections, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateScroll)
      window.removeEventListener('resize', updateSections)
    }
  }, [setScrollY, setAboutSectionTop, setContactSectionTop])

  return null
}

/**
 * LoadingSync — listens to Three.js DefaultLoadingManager via useProgress
 * and syncs it to the global store for the Preloader.
 */
function LoadingSync() {
  const { progress, active } = useProgress()
  const setIsLoaded = useStore((s) => s.setIsLoaded)
  const setLoadingProgress = useStore((s) => s.setLoadingProgress)

  useEffect(() => {
    setLoadingProgress(progress)
    // Consider it loaded only if it's no longer active and progress is 100
    if (!active && progress === 100) {
      const timer = setTimeout(() => setIsLoaded(true), 600)
      return () => clearTimeout(timer)
    }
  }, [progress, active, setIsLoaded, setLoadingProgress])

  return null
}


/**
 * ResponsiveCamera — adjusts vertical FOV to maintain consistent visual proportions
 * across viewport aspect ratios (landscape desktop vs portrait mobile).
 *
 * Strategy: preserve the horizontal angular coverage of the desktop reference
 * (vFOV=35 at 16:9). On portrait screens the vFOV is increased so the scene
 * "zooms out" uniformly — the logo and background keep the same ratio with the
 * viewport frame regardless of device orientation.
 */
function ResponsiveCamera() {
  const { camera, size } = useThree()

  useEffect(() => {
    const aspect = size.width / size.height
    const BASE_FOV = 35
    const REF_ASPECT = 16 / 9

    let fov: number
    if (aspect >= REF_ASPECT) {
      // Landscape / wide desktop: use the designed FOV unchanged
      fov = BASE_FOV
    } else {
      // Portrait / narrow: maintain the same horizontal angular coverage
      // as the desktop reference so proportions stay consistent.
      const hFov = 2 * Math.atan(Math.tan((BASE_FOV * Math.PI / 180) / 2) * REF_ASPECT)
      fov = Math.min(
        2 * Math.atan(Math.tan(hFov / 2) / aspect) * (180 / Math.PI),
        65 // cap to limit fisheye distortion on very narrow screens
      )
    }

    ;(camera as any).fov = fov
    ;(camera as any).updateProjectionMatrix()
  }, [camera, size.width, size.height])

  return null
}

/**
 * CameraRig — smooth lerp of the camera following scrollY.
 * scrollY 0 → camera at y=2 (looking at logo)
 * scrollY increases → camera descends
 * scrollY ~2000px → camera at y=-16 (avatar + floor level)
 */
/**
 * Scroll → 3D camera mapping:
 *
 *  scrollY=0     → y= 2   (logo at eye level)
 *  scrollY=6000  → y=-33  (avatar+floor at eye level)
 *
 * 6000px total matches the DOM page height:
 *   Hero: 200vh, Visione: ~120vh, Servizi: ~130vh,
 *   Portfolio: 60vh, Chi Sono: 100vh → ~610vh total ≈ 5800-6200px
 */
function CameraRig() {
  const scrollY = useStore((s) => s.scrollY)
  const aboutSectionTop = useStore((s) => s.aboutSectionTop)
  const { camera } = useThree()

  useFrame((_, delta) => {
    const landingPoint = aboutSectionTop || 4500
    const contactPoint = (useStore.getState() as any).contactSectionTop || (landingPoint + 1200)

    // --- DEFINIZIONE ZONE DI SCROLL ---
    const transitionStart = landingPoint - 1800 // Inizio camera anticipato
    const transitionEnd = landingPoint - 100 

    // t per la transizione (da logo a landing)
    const t = Math.max(0, Math.min((scrollY - transitionStart) / (transitionEnd - transitionStart), 1))

    // Parametri LANDED ricalibrati per centraggio perfetto (Verticale + Fluidità)
    const LANDED_Y = -36.5             // Via di mezzo per centraggio millimetrico
    const LANDED_Z = 17.0              
    const LANDED_ROT_X = -0.15         

    let targetY = -t * 36.5
    let targetZ = 6 + t * 11.0
    let targetRotX = -t * 0.15

    // --- GESTIONE DINAMICA: LEGAME "SOLIDALE" 1:1 IMMEDIATO ---
    if (scrollY > transitionEnd) {
      targetZ = LANDED_Z
      targetRotX = LANDED_ROT_X
      
      // Nessuna pausa: il movimento diventa solidale istantaneamente
      const exitStart = transitionEnd 
      
      // Risalita perfettamente sincronizzata 1:1 con lo scroll del DOM
      // 0.013 è il fattore calcolato per "incollare" il 3D ai pixel a Z=17
      const exitProgress = scrollY - exitStart
      targetY = LANDED_Y - (exitProgress * 0.013) 
    }

    // Reattività estrema (lerp 20) per eliminare ogni micro-ritardo (Lag Zero)
    const lerpFactor = Math.min(1, delta * 20)
    camera.position.y += (targetY - camera.position.y) * lerpFactor
    camera.position.z += (targetZ - camera.position.z) * lerpFactor
    camera.position.x += (0 - camera.position.x) * lerpFactor
    camera.rotation.x += (targetRotX - camera.rotation.x) * lerpFactor
    camera.rotation.y = 0
    camera.rotation.z = 0
  })

  return null
}

function Scene({ isHome }: { isHome: boolean }) {
  const noop = (_: AvatarTarget[]) => { }

  return (
    <>
      <LoadingSync />
      <ScrollSync />
      <ResponsiveCamera />
      <CameraRig />
      {/* Turn off heavy physics/updates when not home */}
      {isHome && <HeroStage onTrackedPoints={noop} />}
    </>
  )
}

export default function ClientExperience() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: isHome ? 'block' : 'none' // completely hide it from DOM flow
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 35 }}
        dpr={[1, 1.5]} /* Cap rendering quality to save GPU */
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={isHome ? 'always' : 'demand'}
      >
        <Suspense fallback={null}>
          <Scene isHome={isHome} />
        </Suspense>
      </Canvas>
    </div>
  )
}
