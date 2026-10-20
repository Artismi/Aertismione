'use client'

/**
 * GameOverlay — Porto Vecchio a tutto schermo, dentro il sito.
 *
 * Il gioco resta sul suo sito (PROGETTI.game.url) e qui entra in un iframe,
 * montato solo quando il gamepad viene preso in mano: prima di quel momento
 * il portfolio non scarica niente del gioco.
 *
 * L'overlay nasce dal rettangolo del gamepad (clip-path) e si allarga fino a
 * riempire lo schermo. Mentre e' aperto: pagina ferma, 3D in pausa, musica
 * del sito in pausa (riprende alla chiusura).
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/stores/useStore'
import { PROGETTI } from '@/config/content'
import styles from './GameOverlay.module.css'

export type Rect = { top: number; left: number; width: number; height: number }

const EXPAND_MS = 620

function clipFrom(r: Rect) {
  const vw = window.innerWidth, vh = window.innerHeight
  const top = Math.min(Math.max(0, r.top), vh - 1)
  const left = Math.min(Math.max(0, r.left), vw - 1)
  const right = Math.min(Math.max(0, vw - r.left - r.width), vw - left - 1)
  const bottom = Math.min(Math.max(0, vh - r.top - r.height), vh - top - 1)
  return `inset(${top}px ${right}px ${bottom}px ${left}px round 8px)`
}

export function GameOverlay({ from, onClose }: { from: Rect; onClose: () => void }) {
  const game = PROGETTI.game
  const rootRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [phase, setPhase] = useState<'expand' | 'open' | 'closing'>('expand')
  const [loaded, setLoaded] = useState(false)
  const setGameOpen = useStore((s) => s.setGameOpen)

  // Apertura: dal gamepad a tutto schermo
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    el.style.clipPath = clipFrom(from)
    // due frame: il browser deve disegnare la partenza prima della transizione
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.clipPath = 'inset(0px 0px 0px 0px round 0px)'
    }))
    const t = window.setTimeout(() => setPhase('open'), EXPAND_MS)
    return () => { cancelAnimationFrame(raf); window.clearTimeout(t) }
  }, [from])

  // Pagina ferma, 3D e musica in pausa finche' si gioca
  useEffect(() => {
    setGameOpen(true)
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    const prevPadding = html.style.paddingRight
    // la barra di scorrimento sparisce: compensiamo, cosi' la pagina sotto non salta
    const scrollbar = window.innerWidth - html.clientWidth
    html.style.overflow = 'hidden'
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`
    const paused: HTMLAudioElement[] = []
    document.querySelectorAll('audio').forEach((a) => {
      if (!a.paused) { a.pause(); paused.push(a) }
    })
    return () => {
      setGameOpen(false)
      html.style.overflow = prevOverflow
      html.style.paddingRight = prevPadding
      paused.forEach((a) => { a.play().catch(() => { /* serve un gesto */ }) })
    }
  }, [setGameOpen])

  // I tasti arrivano al gioco solo se l'iframe ha il fuoco
  useEffect(() => {
    if (phase === 'open' && loaded) frameRef.current?.focus()
  }, [phase, loaded])

  function close() {
    if (phase === 'closing') return
    const el = rootRef.current
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    setPhase('closing')
    if (el) el.style.clipPath = clipFrom(from)
    window.setTimeout(onClose, EXPAND_MS)
  }

  // Esc chiude solo quando il fuoco e' sul sito: dentro il gioco Esc e' del gioco
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function fullscreen() {
    const el = rootRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else el.requestFullscreen?.().catch(() => {})
  }

  // Portale su body: dentro la sezione (z-index 1) finirebbe sotto la navbar
  return createPortal(
    <div
      ref={rootRef}
      className={styles.overlay}
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label={game.title}
    >
      <div className={styles.loading} data-hidden={loaded ? 'true' : undefined} aria-hidden={loaded}>
        <span className={styles.loadingTitle}>{game.title}</span>
        <span className={styles.loadingText}>{game.loading}</span>
      </div>

      <iframe
        ref={frameRef}
        className={styles.frame}
        data-loaded={loaded ? 'true' : undefined}
        src={game.url}
        title={game.title}
        allow="fullscreen; autoplay; gamepad"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />

      <div className={styles.controls}>
        <button type="button" className={styles.btn} onClick={fullscreen} aria-label="Schermo intero" title="Schermo intero">
          ⛶
        </button>
        <button type="button" className={styles.btn} onClick={close} aria-label={game.close} title={game.close}>
          ✕
        </button>
      </div>
    </div>,
    document.body,
  )
}
