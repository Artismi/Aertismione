'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './Preloader.module.css'
import { useStore } from '@/stores/useStore'

// ── CONFIG — keep low for perf ────────────────────────────────────────────────
const COLS = 14
const ROWS = 10
const TOTAL = COLS * ROWS   // 140 cubes

// 3 independent wave centres (normalised 0-1)
const CENTERS = [
  { cx: 0.22, cy: 0.30, speed: 1.1, amp: 1.0 },
  { cx: 0.75, cy: 0.65, speed: 0.8, amp: 0.90 },
  { cx: 0.50, cy: 0.80, speed: 0.6, amp: 0.75 },
]

// Per-cube random salt — built once, never changes
const SALTS = Array.from({ length: TOTAL }, () => Math.random() * Math.PI * 2)

// ── MatrixGrid — pure rAF, no React re-renders ────────────────────────────────
function MatrixGrid() {
  const cellRefs = useRef<(HTMLDivElement | null)[]>([])
  const started  = useRef(Date.now())
  const rafRef   = useRef<number | null>(null)

  const tick = useCallback(() => {
    const t = (Date.now() - started.current) / 1000

    for (let idx = 0; idx < TOTAL; idx++) {
      const el = cellRefs.current[idx]
      if (!el) continue

      const nx = (idx % COLS) / (COLS - 1)
      const ny = Math.floor(idx / COLS) / (ROWS - 1)

      // Sum of sinusoidal ripples from 3 centres
      let wave = 0
      for (const c of CENTERS) {
        const dx   = nx - c.cx
        const dy   = ny - c.cy
        const dist = Math.sqrt(dx * dx + dy * dy) * 2.8
        wave += Math.sin(dist * 5.5 - t * c.speed * 4.2) * c.amp / (1 + dist * 0.5)
      }
      wave = wave / 3 + Math.sin(t * 1.8 + SALTS[idx]) * 0.10

      const norm    = (wave + 1) / 2            // 0..1
      const scale   = 0.90 + norm * 0.10        // Extremely subdued movement for performance
      const opacity = 0.15 + norm * 0.65        // Main visual indicator is now opacity

      // Single transform call — purely planar scaling avoids massive 3D box-shadow repaints causing lag
      el.style.transform = `scale3d(${scale.toFixed(3)},${scale.toFixed(3)},1)`
      el.style.opacity   = opacity.toFixed(3)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [tick])

  return (
    <div className={styles.grid}>
      {Array.from({ length: TOTAL }).map((_, i) => (
        <div
          key={i}
          className={styles.cube}
          ref={el => { cellRefs.current[i] = el }}
        />
      ))}
    </div>
  )
}

// ── Smooth counter — always ticks up, never lags at the end ──────────────────
function useSmoothedProgress(realProgress: number) {
  const [display, setDisplay] = useState(0)
  const fakeRef  = useRef(0)     // independent "fake" tick
  const realRef  = useRef(0)

  useEffect(() => { realRef.current = realProgress }, [realProgress])

  useEffect(() => {
    const id = setInterval(() => {
      const real = realRef.current
      if (real >= 100) {
        // Loading done → rush to 100
        fakeRef.current = Math.min(100, fakeRef.current + 8)
      } else {
        // Always advance independently, pause at 95 to wait for real load
        fakeRef.current = Math.min(95, fakeRef.current + 3.0)
      }
      setDisplay(Math.floor(fakeRef.current))
    }, 35)
    return () => clearInterval(id)
  }, [])

  return display
}

// ── Preloader ─────────────────────────────────────────────────────────────────
export function Preloader() {
  const isLoaded        = useStore((s) => s.isLoaded)
  const loadingProgress = useStore((s) => s.loadingProgress)
  const [show, setShow] = useState(true)
  const displayNum      = useSmoothedProgress(loadingProgress)

  useEffect(() => {
    if (isLoaded) {
      const t = setTimeout(() => setShow(false), 700)
      return () => clearTimeout(t)
    }
  }, [isLoaded])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.overlay}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Grid behind everything */}
          <MatrixGrid />

          {/* HUD in strict foreground */}
          <div className={styles.hud}>
            <span className={styles.brandName}>Artismi</span>
            <div className={styles.counter}>
              <span className={styles.counterNum}>{displayNum}</span>
              <span className={styles.counterPct}>%</span>
            </div>
          </div>

          {/* Bottom progress strip */}
          <div
            className={styles.progressFill}
            style={{ width: `${displayNum}%` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
