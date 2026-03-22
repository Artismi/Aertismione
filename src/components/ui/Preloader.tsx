'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import styles from './Preloader.module.css'

export function Preloader() {
  const [done, setDone] = useState(false)
  const progressRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Safety: dismiss after 3.5s no matter what
    const safetyTimer = setTimeout(() => setDone(true), 3500)

    const el = progressRef.current
    if (!el) {
      const fallback = setTimeout(() => setDone(true), 1800)
      return () => { clearTimeout(safetyTimer); clearTimeout(fallback) }
    }

    let rafId: number
    let start: number | null = null
    const duration = 1400

    const tick = (ts: number) => {
      if (!start) start = ts
      const t = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      el.textContent = String(Math.round(eased * 100))
      if (t < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        clearTimeout(safetyTimer)
        setTimeout(() => setDone(true), 300)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafId); clearTimeout(safetyTimer) }
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className={styles.overlay}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className={styles.content}>
            <div className={styles.brand}>
              <span className={styles.studio}>Artismi Design Studio</span>
            </div>

            <div className={styles.jellyContainer}>
              <div className={styles.jellyBlock} />
              <div className={styles.jellyBlock} />
            </div>

            <div className={styles.progressCounter}>
              <span ref={progressRef}>0</span>
              <span className={styles.percent}>%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
