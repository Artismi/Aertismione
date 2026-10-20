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
  const [pct, setPct] = useState(0)
  const ready = loaded && pct >= 100

  // contatore come quello della home: sale da solo, si ferma a 95 finche' il gioco non e' pronto
  useEffect(() => {
    const id = window.setInterval(() => setPct((p) => loaded ? Math.min(100, p + 8) : Math.min(95, p + 1.2)), 35)
    return () => window.clearInterval(id)
  }, [loaded])

  // i tasti arrivano al gioco solo se il riquadro ha il fuoco
  useEffect(() => {
    if (ready) frameRef.current?.focus()
  }, [ready])

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
        <div className={`${pre.overlay} ${styles.loading}`} data-hidden={ready ? 'true' : undefined} aria-hidden={ready}>
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
          data-loaded={ready ? 'true' : undefined}
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
