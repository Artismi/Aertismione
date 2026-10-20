'use client'

/**
 * Chapters — l'indice editoriale della home: i capitoli della discesa sul
 * bordo destro, in testo micro, con una linea che si riempie; in basso il
 * numero del capitolo in corso, enorme e mezzo trasparente, come sui poster.
 *
 * Il capitolo in corso e' la sezione che sta al centro dello schermo.
 * Niente stato React a ogni scroll: si aggiorna solo quando il capitolo cambia.
 */

import { useEffect, useRef, useState } from 'react'
import { CHAPTERS } from '@/config/content'
import styles from './Chapters.module.css'

export function Chapters() {
  const [current, setCurrent] = useState(0)
  const fillRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf: number | null = null
    const update = () => {
      raf = null
      const mid = window.innerHeight / 2
      let idx = 0
      CHAPTERS.forEach((c, i) => {
        const el = document.getElementById(c.id)
        if (el && el.getBoundingClientRect().top <= mid) idx = i
      })
      setCurrent((p) => (p === idx ? p : idx))
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${max > 0 ? window.scrollY / max : 0})`
    }
    const onScroll = () => { if (raf === null) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const num = (i: number) => String(i + 1).padStart(2, '0')

  return (
    <>
      <nav className={styles.rail} aria-label="Capitoli">
        <span className={styles.track} aria-hidden="true"><span ref={fillRef} className={styles.fill} /></span>
        <ol className={styles.list}>
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <a href={`#${c.id}`} className={styles.item} data-on={i === current ? 'true' : undefined}>
                <span className={styles.num}>{num(i)}</span>
                <span className={styles.label}>{c.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.big} aria-hidden="true">
        <span key={current} className={styles.bigNum}>{num(current)}</span>
        <span className={styles.bigLabel}>✦ {CHAPTERS[current].label}</span>
      </div>
    </>
  )
}
