'use client'

import { useEffect, useRef } from 'react'
import styles from './CustomCursor.module.css'

/**
 * L'anello che segue il cursore. Il punto lo disegna il sistema (--cursor-dot in
 * globals.css): un'immagine di cursore non aspetta la pagina, quindi resta
 * attaccata al mouse anche quando il 3D la tiene occupata.
 */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Solo su dispositivi con mouse preciso
    if (window.matchMedia('(pointer: coarse)').matches) return

    const ring = ringRef.current
    if (!ring) return

    let rafId: number
    let mouseX = -200
    let mouseY = -200
    let ringX = -200
    let ringY = -200
    let shown = false
    let last = performance.now()

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mouseX = e.clientX
      mouseY = e.clientY
      if (!shown) {
        shown = true
        ringX = mouseX
        ringY = mouseY
        ring.style.opacity = '1'
      }
    }

    // Hover state: classList diretta, zero re-render React
    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      ring.classList.toggle(styles.ringHovered, !!el.closest?.('a, button'))
    }

    // l'anello rincorre il punto: sul tempo vero, cosi' con un fotogramma perso non scatta
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const k = 1 - Math.exp(-dt * 13)
      ringX += (mouseX - ringX) * k
      ringY += (mouseY - ringY) * k
      ring.style.transform = `translate3d(${(ringX - 20).toFixed(2)}px,${(ringY - 20).toFixed(2)}px,0)`
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mouseover', onOver)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return <div ref={ringRef} className={styles.ring} />
}
