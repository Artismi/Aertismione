'use client'

import { useEffect, useRef } from 'react'
import styles from './CustomCursor.module.css'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Solo su dispositivi con mouse preciso
    if (window.matchMedia('(pointer: coarse)').matches) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let rafId: number
    let mouseX = -200
    let mouseY = -200
    let ringX = -200
    let ringY = -200
    let shown = false

    // Aggiorna posizione cursore senza React state
    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      // Dot segue istantaneamente — zero latenza
      dot.style.transform = `translate(${mouseX - 4}px,${mouseY - 4}px)`
      if (!shown) {
        shown = true
        dot.style.opacity = '1'
        ring.style.opacity = '1'
      }
    }

    // Hover state: classList diretta, zero re-render React
    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      const isInteractive = el.tagName === 'A' || el.tagName === 'BUTTON'
        || !!el.closest('a') || !!el.closest('button')
      dot.classList.toggle(styles.dotHovered, isInteractive)
      ring.classList.toggle(styles.ringHovered, isInteractive)
    }

    // RAF loop: solo il ring lerpa — dot già aggiornato in onMove
    const tick = () => {
      ringX += (mouseX - ringX) * 0.18
      ringY += (mouseY - ringY) * 0.18
      ring.style.transform = `translate(${ringX - 20}px,${ringY - 20}px)`
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className={styles.dot} />
      <div ref={ringRef} className={styles.ring} />
    </>
  )
}
