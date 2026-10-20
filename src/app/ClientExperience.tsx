'use client'

/**
 * ClientExperience — il ponte tra la pagina e il mondo 3D della home.
 *
 * Il mondo (logo, banco, fascicolo, Game Boy) e' uno solo e sta in Table3D,
 * dietro tutta la pagina. Qui restano solo:
 * - ScrollSync: lo scroll e le posizioni delle sezioni nello store;
 * - LoadingSync: l'avanzamento dei caricamenti 3D per il Preloader.
 *
 * Prima qui c'era una seconda scena 3D (il logo), disegnata di continuo sopra
 * la prima: due mondi separati, e il doppio del lavoro per la scheda grafica.
 */

import { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { useStore } from '../stores/useStore'

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

    // Lo scroll aggiorna scrollY al massimo una volta per fotogramma.
    // L'evento scroll puo' arrivare anche 120 volte al secondo: scrivere nello
    // store a ogni evento faceva ridisegnare mezzo sito a ripetizione.
    let scrollRaf: number | null = null
    const updateScroll = () => {
      if (scrollRaf !== null) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null
        setScrollY(window.scrollY)
      })
    }

    updateSections()
    updateScroll()

    window.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('resize', updateSections, { passive: true })
    return () => {
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf)
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


export default function ClientExperience() {
  return (
    <>
      <LoadingSync />
      <ScrollSync />
    </>
  )
}
