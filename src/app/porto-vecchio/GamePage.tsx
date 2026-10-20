'use client'

/**
 * Porto Vecchio, come pagina del sito: la barra di Artismi in alto e il gioco
 * sotto, a tutto schermo. Il gioco arriva dall'indirizzo del sito stesso
 * (/gioco/, vedi le rewrites in next.config.mjs), quindi non si cambia sito.
 *
 * Qui dietro non gira niente: niente 3D della home, niente scroll morbido. Per
 * questo il gioco va veloce come sul suo sito.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PROGETTI } from '@/config/content'
import { MatrixGrid } from '@/components/ui/Preloader'
import pre from '@/components/ui/Preloader.module.css'
import styles from './GamePage.module.css'

export function GamePage() {
  const game = PROGETTI.game
  const router = useRouter()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)
  // il riquadro nasce solo nel browser: arrivato gia' nell'html, finiva di caricarsi
  // prima che la pagina potesse accorgersene, e restava nascosto
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [ready, setReady] = useState(false)
  const [pct, setPct] = useState(0)
  // a che punto e' il gioco (0..1): lo dice lui con postMessage ('carico', 'pronto')
  const real = useRef(0)
  const talks = useRef(false)

  // Un caricamento solo: questo resta finche' il menu del gioco non e' disegnato
  // (il gioco lo dice), cosi' sotto non si vede il suo "Carico il porto…"
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

  // Una versione del gioco che non parla: basta la pagina caricata.
  // E se il messaggio non arrivasse mai, dopo un po' si mostra comunque.
  useEffect(() => {
    if (!loaded) return
    const t = window.setTimeout(() => setReady(true), talks.current ? 30000 : 300)
    return () => window.clearTimeout(t)
  }, [loaded])

  // Il contatore segue il caricamento vero e intanto non sta mai fermo:
  // avanza piano da solo verso 90, poi corre a 100 quando il gioco e' pronto
  useEffect(() => {
    const id = window.setInterval(() => setPct((p) => {
      if (ready) return Math.min(100, p + 6)
      return Math.min(97, Math.max(p + (90 - p) * 0.02, real.current * 100))
    }), 40)
    return () => window.clearInterval(id)
  }, [ready])
  const shown = ready && pct >= 100

  // i tasti arrivano al gioco solo se il riquadro ha il fuoco
  useEffect(() => {
    if (shown) frameRef.current?.focus()
  }, [shown])

  // si torna al tavolo da cui si e' partiti; arrivando da un link, alla home
  function back() {
    if (document.referrer.startsWith(window.location.origin)) router.back()
    else router.push('/#portfolio')
  }

  function fullscreen() {
    const el = document.documentElement
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else el.requestFullscreen?.().catch(() => {})
  }

  return (
    <main className={styles.page}>
      <header className={styles.bar}>
        <button type="button" className={styles.back} onClick={back}>
          ← {game.back}
        </button>
        <a href="/" className={styles.brand} aria-label="Artismi, home">
          <img src="/artismi-logo.png" alt="Artismi" />
        </a>
        <button type="button" className={styles.btn} onClick={fullscreen} aria-label="Schermo intero" title="Schermo intero">
          ⛶
        </button>
      </header>

      <div className={styles.stage}>
        {/* il caricamento della home del sito: griglia, logo Artismi, percentuale */}
        <div className={`${pre.overlay} ${styles.loading}`} data-hidden={shown ? 'true' : undefined} aria-hidden={shown}>
          <MatrixGrid />
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

        {mounted && <iframe
          ref={frameRef}
          className={styles.frame}
          data-loaded={shown ? 'true' : undefined}
          src={game.path}
          title={game.title}
          allow="fullscreen; autoplay; gamepad"
          allowFullScreen
          onLoad={() => setLoaded(true)}
        />}
      </div>
    </main>
  )
}
