'use client'

/**
 * GameBoy — Porto Vecchio dentro il Game Boy del banco.
 *
 * Il gioco gira in un riquadro incorniciato dalla plastica rosa della console:
 * in alto la tesa del Game Boy, con la lucina, il nome e due tasti di gomma
 * (schermo intero, esci). Niente barra del sito: si e' dentro la console.
 *
 * Caricamento: da computer il gioco parte gia' in sottofondo, poco dopo
 * l'apertura della home, nascosto fuori schermo. Viene dal suo sito
 * (PROGETTI.game.url): un'origine diversa, quindi il browser lo fa girare in un
 * processo suo e la pagina resta fluida; fuori schermo il browser non lo
 * disegna, quindi non costa niente. Prendendo in mano il Game Boy e' gia' al
 * menu. Da telefono (meno memoria) parte quando si prende la console, dal sito
 * stesso (PROGETTI.game.path), con i file gia' in cache.
 *
 * Il gioco dice a che punto e' con postMessage ('carico', 'pronto'): finche'
 * il menu non e' disegnato si vede un caricamento solo, quello del sito.
 *
 * `from`: il rettangolo dello schermo della console da cui nasce; null =
 * ancora nascosto. `page`: la pagina /porto-vecchio, gia' aperto e fermo.
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/stores/useStore'
import { PROGETTI } from '@/config/content'
import styles from './GameBoy.module.css'
import pre from './Preloader.module.css'
import { MatrixGrid } from './Preloader'

export type Rect = { top: number; left: number; width: number; height: number }

const EXPAND_MS = 700

function clipFrom(r: Rect) {
  const vw = window.innerWidth, vh = window.innerHeight
  const top = Math.min(Math.max(0, r.top), vh - 1)
  const left = Math.min(Math.max(0, r.left), vw - 1)
  const right = Math.min(Math.max(0, vw - r.left - r.width), vw - left - 1)
  const bottom = Math.min(Math.max(0, vh - r.top - r.height), vh - top - 1)
  return `inset(${top}px ${right}px ${bottom}px ${left}px round 10px)`
}

/** Da computer il gioco si scalda in anticipo, in un processo suo */
export function gameWarmable() {
  if (typeof window === 'undefined') return false
  const net = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return !net?.saveData && window.matchMedia('(min-width: 900px) and (pointer: fine)').matches
}

export function GameBoy({ from, onClose, page = false, warm = false }: {
  from: Rect | null
  onClose: () => void
  page?: boolean
  /** il gioco viene dal suo sito, in un processo suo (da computer) */
  warm?: boolean
}) {
  const game = PROGETTI.game
  const rootRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const open = page || from !== null
  const [phase, setPhase] = useState<'wait' | 'expand' | 'open' | 'closing'>(page ? 'open' : 'wait')
  const [loaded, setLoaded] = useState(false)
  const [ready, setReady] = useState(false)
  const [pct, setPct] = useState(0)
  const real = useRef(0)
  const talks = useRef(false)
  const setGameOpen = useStore((s) => s.setGameOpen)

  // a che punto e' il gioco: lo dice lui
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.source !== frameRef.current?.contentWindow || !e.data || typeof e.data.pv !== 'string') return
      talks.current = true
      if (typeof e.data.p === 'number') real.current = Math.max(real.current, e.data.p)
      if (e.data.pv === 'pronto') setReady(true)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  // un gioco che non parla: basta la pagina caricata. E se il messaggio non arriva, dopo un po' si mostra.
  // Il menu si disegna solo quando si vede (fuori schermo il browser non disegna): l'attesa conta da li'
  useEffect(() => {
    if (!loaded || !open) return
    const t = window.setTimeout(() => setReady(true), talks.current ? 20000 : 300)
    return () => window.clearTimeout(t)
  }, [loaded, open])

  // il contatore segue il caricamento vero e non sta mai fermo; gira solo quando si vede
  useEffect(() => {
    if (!open) return
    const id = window.setInterval(() => setPct((p) => {
      if (ready) return Math.min(100, p + 8)
      return Math.min(97, Math.max(p + (90 - p) * 0.03, real.current * 100))
    }), 40)
    return () => window.clearInterval(id)
  }, [open, ready])
  const shown = ready && pct >= 100

  // apertura: dallo schermo della console a tutta pagina
  useEffect(() => {
    const el = rootRef.current
    if (!el || !from || page) return
    setPhase('expand')
    el.style.transition = 'none'
    el.style.clipPath = clipFrom(from)
    void el.offsetWidth
    el.style.transition = ''
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.clipPath = 'inset(0px 0px 0px 0px round 0px)'
    }))
    const t = window.setTimeout(() => setPhase('open'), EXPAND_MS)
    return () => { cancelAnimationFrame(raf); window.clearTimeout(t) }
  }, [from, page])

  // mentre si gioca: pagina ferma, 3D e musica del sito in pausa
  useEffect(() => {
    if (!open) return
    setGameOpen(true)
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    const prevPadding = html.style.paddingRight
    const scrollbar = window.innerWidth - html.clientWidth
    html.style.overflow = 'hidden'
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`
    const paused: HTMLAudioElement[] = []
    document.querySelectorAll('audio').forEach((a) => { if (!a.paused) { a.pause(); paused.push(a) } })
    return () => {
      setGameOpen(false)
      html.style.overflow = prevOverflow
      html.style.paddingRight = prevPadding
      paused.forEach((a) => { a.play().catch(() => { /* serve un gesto */ }) })
    }
  }, [open, setGameOpen])

  // i tasti arrivano al gioco solo se il riquadro ha il fuoco
  useEffect(() => {
    if (phase === 'open' && shown) frameRef.current?.focus()
  }, [phase, shown])

  function close() {
    if (phase === 'closing') return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    if (page || !from) { onClose(); return }
    setPhase('closing')
    const el = rootRef.current
    if (el) el.style.clipPath = clipFrom(from)
    window.setTimeout(onClose, EXPAND_MS)
  }

  // Esc chiude solo con il fuoco sul sito: dentro il gioco Esc e' del gioco
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && open) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function fullscreen() {
    const el = rootRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else el.requestFullscreen?.().catch(() => {})
  }

  const body = (
    <div
      ref={rootRef}
      className={styles.root}
      data-phase={phase}
      data-page={page ? 'true' : undefined}
      role={open ? 'dialog' : undefined}
      aria-modal={open ? true : undefined}
      aria-hidden={open ? undefined : true}
      aria-label={game.title}
    >
      <div className={styles.shell}>
        {/* la tesa del Game Boy: lucina, nome, due tasti di gomma */}
        <div className={styles.top}>
          <span className={styles.power}><i className={styles.led} data-on={shown ? 'true' : undefined} />Power</span>
          <span className={styles.name}>{game.title}</span>
          <div className={styles.keys}>
            <button type="button" className={styles.key} onClick={fullscreen} tabIndex={open ? 0 : -1}>
              <span className={styles.pill} aria-hidden="true" />Schermo
            </button>
            <button type="button" className={styles.key} onClick={close} tabIndex={open ? 0 : -1}>
              <span className={styles.pill} aria-hidden="true" />{game.close}
            </button>
          </div>
        </div>

        <div className={styles.window}>
          {/* un caricamento solo, quello del sito */}
          <div className={`${pre.overlay} ${styles.loading}`} data-hidden={shown ? 'true' : undefined} aria-hidden={shown}>
            {open && <MatrixGrid />}
            <div className={pre.hud}>
              <img className={styles.logo} src="/artismi-logo.png" alt="" />
              <span className={styles.loadingText}>{game.loading}</span>
              <div className={pre.counter}>
                <span className={pre.counterNum}>{Math.floor(pct)}</span>
                <span className={pre.counterPct}>%</span>
              </div>
            </div>
            <div className={pre.progressFill} style={{ width: `${pct}%` }} />
          </div>

          <iframe
            ref={frameRef}
            className={styles.frame}
            data-shown={shown ? 'true' : undefined}
            src={warm ? game.url : game.path}
            title={game.title}
            allow="fullscreen; gamepad"
            allowFullScreen
            tabIndex={open ? 0 : -1}
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  )

  return page ? body : createPortal(body, document.body)
}
