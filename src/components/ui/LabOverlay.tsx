'use client'

/**
 * LabOverlay — overlay fullscreen stile CRT vintage.
 * Appare al click sul Terminal (hotspot LAB).
 * Placeholder per tool sperimentale futuro.
 */

import { useEffect, useState } from 'react'
import { useStore } from '@/stores/useStore'
import { SECTION_TO_EXIT } from '@/lib/cinematicTransitions'
import { LAB } from '@/config/content'
import styles from './LabOverlay.module.css'

/* Typing effect hook */
function useTypingLines(lines: string[], active: boolean) {
  const [displayed, setDisplayed] = useState<string[]>([])

  useEffect(() => {
    if (!active) { setDisplayed([]); return }

    let lineIdx  = 0
    let charIdx  = 0
    let current  = ''
    let rafId: ReturnType<typeof setTimeout>

    const tick = () => {
      if (lineIdx >= lines.length) return

      current += lines[lineIdx][charIdx] ?? ''
      charIdx++

      if (charIdx >= lines[lineIdx].length) {
        setDisplayed(prev => [...prev, current])
        current  = ''
        charIdx  = 0
        lineIdx++
        rafId = setTimeout(tick, 320)
      } else {
        setDisplayed(prev => [...prev.slice(0, lineIdx), current])
        rafId = setTimeout(tick, 42)
      }
    }

    rafId = setTimeout(tick, 600)
    return () => clearTimeout(rafId)
  }, [active, lines])

  return displayed
}

export function LabOverlay() {
  const activeOverlay       = useStore(s => s.activeOverlay)
  const setCinematicPlaying = useStore(s => s.setCinematicPlaying)
  const setActiveOverlay    = useStore(s => s.setActiveOverlay)

  const isOpen = activeOverlay === 'lab'
  const lines  = useTypingLines(LAB.bootLines, isOpen)

  const handleClose = () => {
    setActiveOverlay(null)
    const exitSeq = SECTION_TO_EXIT['lab']
    if (exitSeq) setCinematicPlaying(exitSeq)
  }

  if (!isOpen) return null

  return (
    <div className={styles.container}>
      <div className={styles.bezel}>
        <div className={styles.screen}>
          {/* Scanlines overlay */}
          <div className={styles.scanlines} aria-hidden />

          {/* Header */}
          <div className={styles.header}>
            <span className={styles.prompt}>{LAB.prompt}&nbsp;</span>
            <button className={styles.exitBtn} onClick={handleClose}>
              [{LAB.exitLabel}]
            </button>
          </div>

          {/* ASCII title */}
          <pre className={styles.ascii} aria-hidden>
{LAB.asciiTitle}
          </pre>

          {/* Boot lines con typing effect */}
          <div className={styles.terminal}>
            {lines.map((line, i) => (
              <div key={i} className={styles.line}>
                <span className={styles.caret}>&gt;&nbsp;</span>
                <span>{line}</span>
              </div>
            ))}
            {/* Blink cursor */}
            <span className={styles.cursor}>█</span>
          </div>

          {/* Placeholder futuro tool */}
          {/* <ExperimentalTool /> */}
        </div>
      </div>
    </div>
  )
}
