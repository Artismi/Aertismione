'use client'

/**
 * SmoothScroll — lo scorrimento della home con inerzia (Lenis): la pagina
 * scivola, e la camera del mondo 3D, che segue lo scroll, si muove come su
 * una gru invece che a scatti di rotella.
 *
 * Si ferma quando Porto Vecchio e' aperto a tutto schermo; dentro le finestre
 * (dialog) lo scroll resta quello normale.
 */

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useStore } from '@/stores/useStore'

export function SmoothScroll() {
  const gameOpen = useStore((s) => s.gameOpen)

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      anchors: { offset: -60 },
      stopInertiaOnNavigate: true,
      prevent: (node) => Boolean(node.closest?.('[role="dialog"], [data-lenis-prevent]')),
    })
    ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    return () => {
      lenis.destroy()
      delete (window as unknown as { __lenis?: Lenis }).__lenis
    }
  }, [])

  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis
    if (!lenis) return
    if (gameOpen) lenis.stop()
    else lenis.start()
  }, [gameOpen])

  return null
}
