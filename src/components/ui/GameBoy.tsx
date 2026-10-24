'use client'

/**
 * GameBoy — Porto Vecchio dentro il Game Boy del banco.
 *
 * Il gioco gira in un riquadro incorniciato dalla plastica rosa della console:
 * in alto la tesa del Game Boy, con la lucina, il nome e due tasti di gomma
 * (schermo intero, esci). Niente barra del sito: si e' dentro la console.
 *
 * Caricamento: da computer il gioco parte quando si va sul Game Boy (il mouse
 * sopra, il tasto col fuoco), nascosto fuori schermo, e lo schermo della console
 * ne mostra il caricamento. Viene dal suo sito (PROGETTI.game.url): un'origine
 * diversa, quindi il browser lo fa girare in un processo suo. Scaldato per tutta
 * la visita costava comunque: e' un secondo mondo 3D, e il sito andava a meta'
 * fotogrammi. Da telefono (meno memoria) parte quando si prende la console, dal
 * sito stesso (PROGETTI.game.path), con i file gia' in cache.
 *
 * Il gioco dice a che punto e' con postMessage ('carico', 'pronto'): finche'
 * il menu non e' disegnato si vede un caricamento solo, quello del sito.
 *
 * Lo stesso Game Boy del banco (Console3D), visto di fronte: plastica rosa
 * trasparente con la scheda sotto (consolePaint), la cornice rosa dello schermo.
 * I comandi stanno nella pulsantiera, non sullo schermo (GameBoyPad): levetta,
 * croce per la visuale, A/B, bomboletta, bici, zaino; nella tesa la rotella
 * dell'audio, il display con l'ora e i soldi, l'interruttore per uscire. Il sito si presenta al gioco con {pvc:'ciao'}; il gioco
 * pulisce lo schermo (tutto il resto sta nel suo menu, lo zaino), risponde
 * {pv:'console'} e poi manda le scritte dei tasti ({pv:'tasti'}) e lo stato per
 * il display ({pv:'stato'}). Un gioco che non risponde (una versione vecchia)
 * si gioca come prima, senza pulsantiera.
 *
 * `from`: il rettangolo dello schermo della console da cui nasce; null =
 * ancora nascosto. `page`: la pagina /porto-vecchio, gia' aperto e fermo.
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/stores/useStore'
import { PROGETTI } from '@/config/content'
import styles from './GameBoy.module.css'
import { Display, GameBoyPad, Rotella, type Send, type Stato, type Tasti } from './GameBoyPad'
import pre from './Preloader.module.css'
import { MatrixGrid } from './Preloader'
import { gameLoad, gameInfo } from '@/components/canvas/table/gameLoad'
import { plasticInside } from '@/components/canvas/table/consolePaint'

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
  // i comandi sulla plastica: 'attesa' finche' il gioco non risponde, 'no' se non sa farli
  const [pad, setPad] = useState<'attesa' | 'si' | 'no'>('attesa')
  const [tasti, setTasti] = useState<Tasti | null>(null)
  const [stato, setStato] = useState<Stato | null>(null)
  const [off, setOff] = useState(false)   // l'interruttore spinto su OFF: un attimo, poi la console si chiude
  const [inside, setInside] = useState<string | null>(null)

  // l'elettronica sotto la plastica rosa trasparente: la stessa scheda del Game Boy 3D, disegnata una volta quando il browser e' libero
  useEffect(() => {
    let url: string | null = null, live = true
    const mono = getComputedStyle(document.body).getPropertyValue('--font-mono-var').trim() || 'monospace'
    const go = () => plasticInside(mono).then((u) => { if (live) { url = u; setInside(u) } else if (u) URL.revokeObjectURL(u) })
    const idle = typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(go, { timeout: 1200 }) : window.setTimeout(go, 200)
    return () => {
      live = false
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle); else window.clearTimeout(idle)
      if (url) URL.revokeObjectURL(url)
    }
  }, [])
  const hello = useRef(false)
  const src = warm ? game.url : game.path

  // al gioco, e solo a lui (il suo sito o questo, secondo da dove arriva)
  const send = useCallback<Send>((m) => {
    try { frameRef.current?.contentWindow?.postMessage(m, new URL(src, window.location.href).origin) } catch { /* riquadro non pronto */ }
  }, [src])

  // a che punto e' il gioco: lo dice lui
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.source !== frameRef.current?.contentWindow || !e.data || typeof e.data.pv !== 'string') return
      talks.current = true
      if (e.data.pv === 'console') { hello.current = true; setPad('si'); return }
      // le scritte dei tasti e lo stato vanno anche al Game Boy del banco (display e lucine)
      if (e.data.pv === 'tasti') { setTasti(e.data as Tasti); gameInfo.tasti = e.data as Tasti; gameLoad.onChange?.(); return }
      if (e.data.pv === 'stato') { setStato(e.data as Stato); gameInfo.stato = e.data as Stato; gameLoad.onChange?.(); return }
      if (!hello.current) send({ pvc: 'ciao' })   // il saluto, finche' il gioco non risponde
      if (typeof e.data.p === 'number') real.current = Math.max(real.current, e.data.p)
      if (e.data.pv === 'pronto') setReady(true)
      // anche lo schermo del Game Boy sul banco. Nascosto il gioco non disegna il menu
      // (e 'pronto' arriva solo quando si vede): per lo schermo basta il caricamento finito
      gameLoad.p = e.data.pv === 'pronto' ? 1 : real.current
      if (e.data.pv === 'pronto' || real.current >= 0.99) gameLoad.ready = true
      gameLoad.onChange?.()
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [send])

  // un gioco pronto che non ha risposto al saluto non sa dei tasti: si gioca come prima, sullo schermo
  useEffect(() => {
    if (pad !== 'attesa' || !ready) return
    const t = window.setTimeout(() => setPad((p) => (p === 'attesa' ? 'no' : p)), 1500)
    return () => window.clearTimeout(t)
  }, [pad, ready])

  // nessun tasto resta premuto: quando la pagina va in secondo piano e quando la console si chiude
  useEffect(() => {
    function hide() { if (document.visibilityState === 'hidden') send({ pvc: 'lascia' }) }
    document.addEventListener('visibilitychange', hide)
    return () => { document.removeEventListener('visibilitychange', hide); send({ pvc: 'lascia' }) }
  }, [send])

  // smontato il gioco non dice piu' niente: il display del banco torna a --:-- e le lucine
  // si spengono. Da computer non e' piu' caricato, e tornano spenti anche lo schermo e la
  // lucina della console (da telefono il caricamento e' quello dei file, che restano in cache)
  useEffect(() => () => {
    gameInfo.stato = null; gameInfo.tasti = null
    if (warm) { gameLoad.p = 0; gameLoad.ready = false }
    gameLoad.onChange?.()
  }, [warm])

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
    send({ pvc: 'lascia' })
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

  // l'interruttore: scivola su OFF, poi si esce
  function powerOff() {
    if (off) return
    setOff(true)
    window.setTimeout(close, 180)
  }

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
      data-pad={pad}
      role={open ? 'dialog' : undefined}
      aria-modal={open ? true : undefined}
      aria-hidden={open ? undefined : true}
      aria-label={game.title}
    >
      <div className={styles.shell} style={inside ? ({ '--inside': `url(${inside})` } as CSSProperties) : undefined}>
        {/* la tesa del Game Boy: la rotella dell'audio, il display (o il nome), schermo intero e l'interruttore */}
        <div className={styles.top}>
          <div className={styles.topL}>
            {pad === 'si' && <Rotella send={send} on={tasti?.audio !== false} />}
          </div>
          {pad === 'si' ? <Display stato={stato} /> : <span className={styles.name}>{game.title}</span>}
          <div className={styles.keys}>
            <button type="button" className={styles.key} onClick={fullscreen} tabIndex={open ? 0 : -1}>
              <span className={styles.pill} aria-hidden="true" />Schermo
            </button>
            <button type="button" className={styles.power} data-off={off || undefined} onClick={powerOff} tabIndex={open ? 0 : -1} aria-label={game.close}>
              <span className={styles.powerPrint} aria-hidden="true">{game.pad.off}</span>
              <span className={styles.powerTrack} aria-hidden="true"><span className={styles.powerKnob} /></span>
              <span className={styles.powerPrint} aria-hidden="true">{game.pad.on}</span>
            </button>
          </div>
        </div>

        {/* la cornice rosa dello schermo, come sul Game Boy 3D: le due righe, la lucina, la finestra scura, la scritta */}
        <div className={styles.window}>
          <div className={styles.lensTop} aria-hidden="true">
            <i className={styles.led} data-on={shown && !off ? 'true' : undefined} />
            <span className={styles.lensPrint}>{game.pad.battery}</span>
            <span className={styles.lensLines} />
          </div>
          <div className={styles.screen}>
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
              src={src}
              title={game.title}
              allow="fullscreen; gamepad; autoplay"
              allowFullScreen
              tabIndex={open ? 0 : -1}
              onLoad={() => { setLoaded(true); send({ pvc: 'ciao' }) }}
            />
          </div>
          <div className={styles.lensBottom} aria-hidden="true">{game.title} ✦ {game.pad.lens}</div>
        </div>

        {/* il nome serigrafato sotto lo schermo, come sul primo Game Boy; poi la pulsantiera */}
        {pad !== 'no' && (
          <>
            <div className={styles.brand} aria-hidden="true">{game.title}<small>{game.pad.brand}</small></div>
            <GameBoyPad send={send} tasti={tasti} />
          </>
        )}
      </div>
    </div>
  )

  return page ? body : createPortal(body, document.body)
}
