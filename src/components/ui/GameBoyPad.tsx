'use client'

/**
 * GameBoyPad — la pulsantiera del Game Boy di Porto Vecchio.
 *
 * Solo comandi che fanno qualcosa, con gli stessi materiali del Game Boy 3D sul banco
 * (Console3D): la levetta per camminare e guidare, la seconda levetta per la visuale
 * (di lato gira attorno al personaggio, in su e in giu' lo zoom; in BMX e nella tavoletta
 * il gioco la legge come la croce di prima: trick, colore, spessore; con un gioco piu'
 * vecchio, v < 3, resta la croce), A e B (la lettera stampata sulla calotta, sotto quello
 * che fanno adesso), e tre tasti veri con la loro icona: la bomboletta (i graffiti), la
 * bici, lo zaino (il menu del gioco, dove stanno anche ora, soldi e debito: per questo la
 * console non ha piu' un display). Acceso, un tasto si illumina. Schermo intero, audio
 * ed esci stanno nel menu del gioco, non sulla console.
 *
 * Ogni tocco e' un messaggio al gioco nel riquadro ({pvc:'levetta'|'tasto'}, vedi
 * GameBoy); il gioco risponde con la scritta di A e B adesso (Salta, Freno,
 * Scendi…), con quali tasti sono accesi e col numero delle cose da fare qui.
 * Piu' dita insieme: ogni tasto tiene il suo dito (pointer capture). Nessun
 * tasto prende il fuoco: la tastiera resta al gioco.
 */

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode, type SyntheticEvent } from 'react'
import { PROGETTI } from '@/config/content'
import styles from './GameBoy.module.css'

export type PadKey = 'a' | 'b' | 'croce' | 'bomboletta' | 'bici' | 'zaino'
/**
 * Quello che il gioco dice dei tasti: la scritta di ognuno (null = ora non fa niente; per la croce cosa fanno le frecce),
 * quali sono accesi, quello che hai in mano (lo usa B), le cose da fare qui, l'audio
 */
export type Tasti = { t: Partial<Record<PadKey, string | null>>; on?: Partial<Record<PadKey, boolean>>; mano?: string | null; n: number; audio: boolean }
/** Quello che il gioco dice di se', per il display: giorno, ora, soldi, debito, ore alla scadenza (null = nessuna), stelle */
export type Stato = { giorno: string; ora: string; soldi: string; debito: string; scade: number | null; ricercato: number }
export type Send = (m: { pvc: string; [k: string]: unknown }) => void

const pad = PROGETTI.game.pad

function buzz() {
  try { navigator.vibrate?.(8) } catch { /* niente vibrazione */ }
}

// il tocco non sceglie testo, non zooma, non porta il fuoco al sito; quello lungo non apre menu
const hush = (e: SyntheticEvent) => e.preventDefault()

/** Un tasto da tenere premuto: giu' al tocco, su quando il dito si stacca (anche fuori dal tasto) */
function Tasto({ k, send, className, name, label, lit, children }: {
  k: string; send: Send; className: string; name: string; label?: string | null; lit?: boolean; children?: ReactNode
}) {
  const [down, setDown] = useState(false)
  const id = useRef<number | null>(null)
  function press(e: RPointerEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (id.current !== null) return
    id.current = e.pointerId
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* dito gia' staccato */ }
    setDown(true)
    buzz()
    send({ pvc: 'tasto', k, giu: true })
  }
  function release(e: RPointerEvent<HTMLButtonElement>) {
    if (e.pointerId !== id.current) return
    id.current = null
    setDown(false)
    send({ pvc: 'tasto', k, giu: false })
  }
  return (
    <button
      type="button"
      tabIndex={-1}
      title={label ? `${name}: ${label}` : name}
      className={className}
      data-down={down || undefined}
      data-off={label === null || undefined}
      data-lit={lit || undefined}
      aria-label={label ? `${name}: ${label}` : name}
      aria-pressed={lit === undefined ? undefined : lit}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={hush}
    >
      {children}
    </button>
  )
}

/**
 * La levetta: un incavo nella plastica, lo stelo, il cappuccio di gomma concavo con la corona zigrinata.
 * Il cappuccio segue il dito e si inclina verso dove lo spingi (in prospettiva, solo CSS), poi torna al centro
 * con un piccolo rimbalzo quando lo lasci (msg: 'levetta' cammina, 'levetta2' la visuale;
 * un tocco breve su 'levetta2' cambia vista: alta, media, vicina)
 */
function Levetta({ send, msg = 'levetta', small }: { send: Send; msg?: string; small?: boolean }) {
  const base = useRef<HTMLDivElement>(null)
  const id = useRef<number | null>(null)
  const want = useRef({ x: 0, y: 0 })
  const sent = useRef({ x: 0, y: 0 })
  const raf = useRef(0)
  const [held, setHeld] = useState(false)
  // un tocco breve sulla levetta della visuale cambia vista (alta, media, vicina)
  const tap = useRef({ t: 0, x: 0, y: 0, far: false })
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // al gioco una volta per fotogramma, solo se e' cambiata
  function flush() {
    raf.current = 0
    const w = want.current
    if (w.x === sent.current.x && w.y === sent.current.y) return
    sent.current = w
    send({ pvc: msg, x: w.x, y: w.y })
  }
  // sull'incavo: il cappuccio (spostato e inclinato), lo stelo, l'ombra e il riflesso lo leggono tutti da qui
  function show(x: number, y: number) {
    base.current?.style.setProperty('--x', String(x))
    base.current?.style.setProperty('--y', String(y))
  }
  function at(e: RPointerEvent<HTMLDivElement>) {
    const r = base.current!.getBoundingClientRect(), R = r.width * 0.34
    let x = (e.clientX - r.left - r.width / 2) / R, y = (e.clientY - r.top - r.height / 2) / R
    const l = Math.hypot(x, y)
    if (l > 1) { x /= l; y /= l }
    x = Math.round(x * 100) / 100
    y = Math.round(y * 100) / 100
    want.current = { x, y }
    const t = tap.current
    if (Math.hypot(x - t.x, y - t.y) >= 0.25) t.far = true
    show(x, y)
    if (!raf.current) raf.current = requestAnimationFrame(flush)
  }
  function down(e: RPointerEvent<HTMLDivElement>) {
    e.preventDefault()
    if (id.current !== null) return
    id.current = e.pointerId
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* dito gia' staccato */ }
    setHeld(true)
    buzz()
    tap.current = { t: performance.now(), x: 0, y: 0, far: false }
    at(e)
    tap.current.x = want.current.x
    tap.current.y = want.current.y
    tap.current.far = false
  }
  function move(e: RPointerEvent<HTMLDivElement>) { if (e.pointerId === id.current) at(e) }
  function up(e: RPointerEvent<HTMLDivElement>) {
    if (e.pointerId !== id.current) return
    id.current = null
    setHeld(false)
    want.current = { x: 0, y: 0 }
    show(0, 0)
    cancelAnimationFrame(raf.current)
    flush()
    const t = tap.current
    if (msg === 'levetta2' && !t.far && performance.now() - t.t < 250) {
      send({ pvc: 'tasto', k: 'vista', giu: true })
      send({ pvc: 'tasto', k: 'vista', giu: false })
    }
  }
  return (
    <div
      ref={base}
      className={small ? `${styles.stick} ${styles.stickSm}` : styles.stick}
      data-held={held || undefined}
      role="presentation"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onContextMenu={hush}
    >
      <span className={styles.stickShadow} aria-hidden="true" />
      <span className={styles.stickStem} aria-hidden="true" />
      <span className={styles.stickCap} />
    </div>
  )
}

/** La croce nera, per la visuale: si tiene premuta, anche in diagonale, e il dito puo' scivolare da un braccio all'altro */
function Croce({ send }: { send: Send }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useRef<number | null>(null)
  const cur = useRef<string[]>([])
  const [dirs, setDirs] = useState('')

  function set(next: string[]) {
    const prev = cur.current
    prev.filter((d) => !next.includes(d)).forEach((k) => send({ pvc: 'tasto', k, giu: false }))
    const added = next.filter((d) => !prev.includes(d))
    added.forEach((k) => send({ pvc: 'tasto', k, giu: true }))
    if (added.length) buzz()
    cur.current = next
    setDirs(next.join(' '))
  }
  function at(e: RPointerEvent<HTMLDivElement>) {
    const r = ref.current!.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2)
    const ax = Math.abs(x), ay = Math.abs(y), next: string[] = []
    if (Math.max(ax, ay) > 0.2) {
      if (ax >= ay * 0.45) next.push(x < 0 ? 'sx' : 'dx')
      if (ay >= ax * 0.45) next.push(y < 0 ? 'su' : 'giu')
    }
    set(next)
  }
  function down(e: RPointerEvent<HTMLDivElement>) {
    e.preventDefault()
    if (id.current !== null) return
    id.current = e.pointerId
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* dito gia' staccato */ }
    at(e)
  }
  function move(e: RPointerEvent<HTMLDivElement>) { if (e.pointerId === id.current) at(e) }
  function up(e: RPointerEvent<HTMLDivElement>) {
    if (e.pointerId !== id.current) return
    id.current = null
    set([])
  }
  return (
    <div
      ref={ref}
      className={styles.cross}
      data-dir={dirs || undefined}
      role="presentation"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onContextMenu={hush}
    >
      <span className={styles.crossArms}><i /></span>
    </div>
  )
}

// le icone sui tre tasti (24×24, a tratto), stampate chiare sulla gomma
const ICONS: Record<'bomboletta' | 'bici' | 'zaino', ReactNode> = {
  bomboletta: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="9" width="8" height="12.5" rx="2" />
      <path d="M8.5 9V6.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V9M10 5.8V4h2.5" />
      <path d="M17.5 4.5h.01M19.5 6.5h.01M19.5 2.5h.01M21 4.5h.01" strokeWidth="2.6" />
    </svg>
  ),
  bici: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5.5" cy="16" r="3.8" />
      <circle cx="18.5" cy="16" r="3.8" />
      <path d="M5.5 16l4.2-7.5h6.6L18.5 16M9.7 8.5L12 16h1.2l3.1-7.5M8.4 6h3" />
    </svg>
  ),
  zaino: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 10a6 6 0 0 1 12 0v9.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5z" />
      <path d="M9.5 4.6V3.5h5v1.1M8.5 14.5h7v4h-7zM12 14.5v1.6" />
    </svg>
  ),
}

/** Un tasto vero: la gomma con l'icona in rilievo nel suo foro; acceso si illumina, il numero delle cose da fare sullo zaino */
function Funzione({ k, send, name, label, lit, badge }: {
  k: 'bomboletta' | 'bici' | 'zaino'; send: Send; name: string; label?: string | null; lit?: boolean; badge?: number
}) {
  return (
    <div className={styles.fnKey} data-k={k}>
      <span className={styles.socket}>
        <Tasto k={k} send={send} className={styles.fnBtn} name={name} label={label} lit={lit}>
          {ICONS[k]}
        </Tasto>
      </span>
      {!!badge && <span className={styles.badge} aria-hidden="true">{badge > 9 ? '9+' : badge}</span>}
    </div>
  )
}

/**
 * A e B: le calotte corallo con la lettera stampata, nel loro foro. La scritta di adesso sta fuori dalla piastra inclinata,
 * oltre la sua estremita': sopra A, sotto B (in verticale a sinistra di B); sotto B anche quello che hai in mano
 */
function Bottone({ k, send, label, hand }: { k: 'a' | 'b'; send: Send; label?: string | null; hand?: string | null }) {
  const name = k.toUpperCase()
  return (
    <div className={styles.abKey} data-k={k}>
      <span className={styles.abSocket}>
        <Tasto k={k} send={send} className={styles.abBtn} name={hand && label ? `${name} (${hand})` : name} label={label}>
          <span className={styles.abLetter} aria-hidden="true">{name}</span>
        </Tasto>
      </span>
      <span className={styles.abPrint}>
        <span className={styles.fn}>{label ?? ''}</span>
        {hand && <span className={styles.hand}>{hand}</span>}
      </span>
    </div>
  )
}

/** La pulsantiera: le due levette, i tre tasti, A e B, la scritta della levetta della visuale (in verticale sotto lo schermo, di traverso ai lati) */
export function GameBoyPad({ send, tasti, versione = 0 }: { send: Send; tasti: Tasti | null; versione?: number }) {
  const t = tasti?.t ?? {}, on = tasti?.on ?? {}
  return (
    <>
      <div className={styles.padL} role="group" aria-label={pad.label} onContextMenu={hush}>
        <Levetta send={send} />
      </div>
      <div className={styles.padC} role="group" aria-label={pad.label} onContextMenu={hush}>
        <Funzione k="bomboletta" send={send} name={pad.spray} label={t.bomboletta} lit={!!on.bomboletta} />
        <Funzione k="bici" send={send} name={pad.bike} label={t.bici} lit={!!on.bici} />
        <Funzione k="zaino" send={send} name={pad.bag} label={t.zaino} lit={!!on.zaino} badge={tasti?.n} />
      </div>
      <div className={styles.padX} role="group" aria-label={pad.label} onContextMenu={hush}>
        {versione >= 3 ? <Levetta send={send} msg="levetta2" /> : <Croce send={send} />}
      </div>
      {/* cosa fa adesso la levetta della visuale: lo dice il gioco (in BMX i trick) */}
      <span className={`${styles.print} ${styles.crossHint}`} aria-hidden="true">
        {(t.croce === undefined ? pad.cross : t.croce ?? '').split(' · ').map((r) => <span key={r}>{r}</span>)}
      </span>
      <div className={styles.padR} role="group" aria-label={pad.label} onContextMenu={hush}>
        <div className={styles.ab}>
          <span className={styles.abPlate} aria-hidden="true" />
          <Bottone k="b" send={send} label={t.b} hand={tasti?.mano} />
          <Bottone k="a" send={send} label={t.a} />
        </div>
      </div>
    </>
  )
}
