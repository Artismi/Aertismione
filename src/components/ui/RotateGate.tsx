'use client'

/**
 * RotateGate — schermata che chiede di girare il telefono.
 *
 * Il sito e' costruito per essere guardato in largo: in verticale il telefono
 * taglia la scena. Qui, finche' il dispositivo e' in verticale, compare una
 * schermata in stile terminale che invita a ruotarlo.
 *
 * Nota onesta sul "blocco": il web non puo' forzare l'orientamento. L'API
 * screen.orientation.lock() esiste solo dentro il fullscreen e su iPhone non
 * e' supportata affatto. Quindi proviamo il blocco dove il browser lo permette,
 * e per tutti gli altri resta l'invito — con una via d'uscita per chi ha la
 * rotazione bloccata nelle impostazioni del telefono.
 */

import { useEffect, useState, useCallback } from 'react'
import styles from './RotateGate.module.css'

const SKIP_KEY = 'artismi:ruota-ignorato'

export function RotateGate() {
  const [needsRotate, setNeedsRotate] = useState(false)
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SKIP_KEY)) setSkipped(true)
    } catch { /* niente sessionStorage: pazienza */ }

    // Solo telefoni e tablet: su desktop la finestra stretta non c'entra nulla.
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    const portrait = window.matchMedia('(orientation: portrait)')

    const apply = () => setNeedsRotate(isTouch && portrait.matches)
    apply()

    portrait.addEventListener('change', apply)
    window.addEventListener('resize', apply)
    return () => {
      portrait.removeEventListener('change', apply)
      window.removeEventListener('resize', apply)
    }
  }, [])

  /** Tentativo di blocco vero, dove il browser lo consente (Android/Chrome). */
  const tryLock = useCallback(async () => {
    try {
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>
      }
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()

      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>
      }
      await orientation?.lock?.('landscape')
    } catch {
      /* non supportato: resta l'invito a ruotare a mano */
    }
  }, [])

  const skip = useCallback(() => {
    setSkipped(true)
    try { sessionStorage.setItem(SKIP_KEY, '1') } catch { /* ignora */ }
  }, [])

  if (!needsRotate || skipped) return null

  return (
    <div className={styles.gate} role="dialog" aria-label="Ruota il dispositivo">
      <div className={styles.scanlines} aria-hidden="true" />

      <div className={styles.console}>
        <p className={styles.head}>ARTISMI DESIGN STUDIO</p>

        <p className={styles.line}>&gt; orientamento rilevato: VERTICALE</p>
        <p className={styles.line}>&gt; la scena richiede larghezza</p>

        <div className={styles.phone} aria-hidden="true">
          <span className={styles.phoneBody} />
        </div>

        <p className={styles.call}>
          RUOTA IL TELEFONO<span className={styles.cursor} />
        </p>

        <button type="button" className={styles.lockBtn} onClick={tryLock}>
          [ blocca in orizzontale ]
        </button>

        <button type="button" className={styles.skipBtn} onClick={skip}>
          continua comunque in verticale
        </button>
      </div>
    </div>
  )
}
