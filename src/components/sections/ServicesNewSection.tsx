'use client'

/**
 * Servizi: quattro carte sul velo viola, appena storte e sfalsate, in
 * ambra e viola. Ognuna si legge in tre colpi: l'icona disegnata, numero e
 * titolo, una frase breve. Sotto, piu' piccoli, spiegazione e dettagli.
 * I contenuti sono in SERVICES (content.ts).
 *
 * Sul computer tutto e' in vista. Sul telefono le carte stanno insieme a due
 * a due con icona, titolo e frase: toccandone una si apre tutta, con il
 * bottone del preventivo.
 */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import styles from './ServicesNewSection.module.css'
import { SERVICES } from '@/config/content'
import { useConfiguratorStore } from '@/stores/useConfiguratorStore'

const vp = { once: true, margin: '-60px' }

type Card = {
  id: string
  kind: 'folder' | 'strip' | 'sheet' | 'tag'
  code: string
  kicker: string
  label: string
  hook: string
  lead: string
  type?: string
  featured?: boolean
  steps?: { name: string; text: string }[]
  items?: string[]
  core?: string[]
  pack?: { label: string; text: string }
  spaceLabel?: string
  space?: string[]
  addLabel?: string
  adds?: string[]
  variants?: string
  note?: string
  week?: string[]
}

const cards = SERVICES.cards as Card[]

// i giorni con un'uscita, nella settimana tipo della carta social
const POSTS = [true, false, true, false, true, true, false]

function Cta() {
  return (
    <button type="button" className={styles.cta} onClick={() => useConfiguratorStore.getState().openModal()}>
      {SERVICES.cta}
    </button>
  )
}

/** sul telefono: apre la carta dalla griglia, o la richiude */
function Peek({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={styles.peek}
      aria-expanded={open}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
    >
      {open ? 'Chiudi' : 'Leggi tutto'}
    </button>
  )
}

/* ── Le icone ────────────────────────────────────────────────
   Tratto d'inchiostro e, sotto, il colore stampato appena fuori
   registro, come una stampa riso. */

const INK = { fill: 'none', stroke: '#1A1A1A', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const AMBER = '#C8860A'
const PLUM = '#35144E'

/** il laboratorio: la lavagna sul cavalletto coi post-it, e le persone davanti */
function IconLab() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <rect x="26" y="12" width="68" height="50" fill={AMBER} transform="translate(4 4)" />
      <rect x="26" y="12" width="68" height="50" fill="#F2EDE4" {...{ stroke: '#1A1A1A', strokeWidth: 2.2, strokeLinejoin: 'round' }} />
      <path d="M40 62 L32 92 M80 62 L88 92 M60 62 V80" {...INK} />
      <rect x="33" y="19" width="15" height="15" fill={AMBER} transform="rotate(-6 40 26)" />
      <rect x="53" y="20" width="15" height="15" fill={PLUM} transform="rotate(4 60 27)" />
      <rect x="73" y="19" width="14" height="14" fill={AMBER} transform="rotate(-3 80 26)" />
      <path d="M35 45 H85 M35 53 H68" {...INK} strokeWidth={1.6} />
      <path d="M47 113 Q60 97 73 113" fill={PLUM} transform="translate(3 2)" />
      <circle cx="30" cy="88" r="7" {...INK} fill="#F2EDE4" />
      <circle cx="60" cy="90" r="8" {...INK} fill="#F2EDE4" />
      <circle cx="90" cy="88" r="7" {...INK} fill="#F2EDE4" />
      <path d="M17 110 Q30 94 43 110 M47 113 Q60 97 73 113 M77 110 Q90 94 103 110" {...INK} />
    </svg>
  )
}

/** la maglietta con la spilla, e un adesivo che si stacca */
function IconPrint() {
  const shirt = 'M30 32 L46 24 Q60 33 74 24 L90 32 L101 51 L88 57 L86 98 L34 98 L32 57 L19 51 Z'
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <path d={shirt} fill={AMBER} transform="translate(4 4)" />
      <path d={shirt} {...INK} />
      <path d="M46 24 Q60 40 74 24" {...INK} strokeWidth={1.8} />
      <circle cx="61" cy="63" r="11" fill={PLUM} />
      <path d="M61 56 V70 M54 63 H68 M56 58 L66 68 M66 58 L56 68" stroke="#F2EDE4" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="98" cy="94" r="13" fill="#F2EDE4" stroke="#1A1A1A" strokeWidth="2.2" />
      <path d="M107 103 Q100 96 94 106" fill={AMBER} stroke="#1A1A1A" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

/** la bottega: insegna, tenda, vetrina con un murale dentro */
function IconShop() {
  const awning = 'M18 42 H102 L98 56 Q93 62 88 56 Q83 62 78 56 Q73 62 68 56 Q63 62 58 56 Q53 62 48 56 Q43 62 38 56 Q33 62 28 56 Q23 62 22 56 Z'
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <path d={awning} fill={AMBER} transform="translate(3 3)" />
      <rect x="32" y="68" width="34" height="26" fill={PLUM} transform="translate(3 3)" />
      <path d="M22 56 V100 H98 V56" {...INK} />
      <path d={awning} {...INK} />
      <path d="M38 42 V56 M58 42 V56 M78 42 V56" {...INK} strokeWidth={1.6} />
      <rect x="38" y="20" width="44" height="14" rx="2" {...INK} />
      <path d="M60 23 V31 M56 27 H64" {...INK} strokeWidth={1.6} />
      <rect x="32" y="68" width="34" height="26" {...INK} />
      <path d="M34 88 Q42 78 50 86 T64 82" {...INK} strokeWidth={1.6} />
      <circle cx="56" cy="76" r="3.5" {...INK} strokeWidth={1.6} />
      <rect x="74" y="68" width="16" height="32" {...INK} />
      <circle cx="86" cy="84" r="1.4" fill="#1A1A1A" />
    </svg>
  )
}

/** il telefono con i post della settimana e un cuore che arriva */
function IconSocial() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <rect x="34" y="14" width="46" height="92" rx="9" fill={AMBER} transform="translate(4 4)" />
      <rect x="34" y="14" width="46" height="92" rx="9" {...INK} />
      <path d="M52 21 H62" {...INK} strokeWidth={1.8} />
      <rect x="40" y="28" width="34" height="30" {...INK} strokeWidth={1.8} />
      <path d="M41 54 L52 42 L59 50 L64 45 L73 55" {...INK} strokeWidth={1.6} />
      <circle cx="66" cy="36" r="3" {...INK} strokeWidth={1.6} />
      {[64, 78].map((y) => [0, 1, 2].map((i) => <rect key={`${y}-${i}`} x={40 + i * 12} y={y} width="10" height="10" {...INK} strokeWidth={1.6} />))}
      <circle cx="94" cy="30" r="15" fill={PLUM} />
      <path d="M87 42 L83 52 L93 44" fill={PLUM} />
      <path d="M94 37 C86 31 87 24 91 24 C93 24 94 26 94 27 C94 26 95 24 97 24 C101 24 102 31 94 37 Z" fill="#F2EDE4" />
    </svg>
  )
}

const ICONS = { folder: IconLab, strip: IconPrint, sheet: IconShop, tag: IconSocial }

/** la testa della carta: icona, numero, titolo, frase breve, spiegazione */
function Head({ c, n }: { c: Card; n: string }) {
  const Icon = ICONS[c.kind]
  return (
    <>
      <div className={styles.icon}><Icon /></div>
      <div className={styles.kickerRow}>
        <span className={styles.num} aria-hidden="true">{n}</span>
        <span className={styles.kicker}>{c.kicker}</span>
      </div>
      <h3 className={styles.title}>{c.label}</h3>
      <p className={styles.hook}><span>{c.hook}</span></p>
      <p className={styles.lead}>{c.lead}</p>
    </>
  )
}

/** la graffetta, disegnata a filo */
function Clip({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 22 64" aria-hidden="true">
      <path d="M15 20 V52 a5 5 0 0 1 -10 0 V9 a7 7 0 0 1 14 0 V48 a2.5 2.5 0 0 1 -5 0 V20"
        fill="none" stroke="#8d8a86" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 20 V52 a5 5 0 0 1 -10 0 V9 a7 7 0 0 1 14 0" fill="none" stroke="#e9e6e1" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

type Props = { c: Card; n: string; peek: React.ReactNode }

/** 01 · la cartellina kraft, con la linguetta come quella del tavolo 3D */
function Folder({ c, n, peek }: Props) {
  return (
    <article className={`${styles.paper} ${styles.folder}`} data-tab={c.code}>
      <Head c={c} n={n} />
      <div className={styles.more}>
        <span className={styles.label}>Come funziona</span>
        <ol className={styles.steps}>
          {c.steps!.map((s) => (
            <li key={s.name}>
              <b>{s.name}</b> {s.text}
            </li>
          ))}
        </ol>
        {c.note && <p className={styles.note}>{c.note}</p>}
        <Cta />
      </div>
      {peek}
    </article>
  )
}

/** 02 · il foglio fermato col nastro */
function Strip({ c, n, peek }: Props) {
  return (
    <article className={`${styles.paper} ${styles.strip}`}>
      <span className={`${styles.tape} ${styles.stripTape}`} aria-hidden="true" />
      <Head c={c} n={n} />
      <div className={styles.more}>
        <span className={styles.label}>Cosa si fa</span>
        <ul className={styles.inline}>
          {c.items!.map((it) => <li key={it}>{it}</li>)}
        </ul>
        <Cta />
      </div>
      {peek}
    </article>
  )
}

/** 03 · il foglio con la fascia viola: il percorso piu' richiesto */
function Sheet({ c, n, peek }: Props) {
  return (
    <article className={`${styles.paper} ${styles.sheet}`}>
      <div className={`${styles.band} ${styles.code}`}>
        <span>{c.type}</span>
        {c.featured && <span>✦ Il più richiesto</span>}
      </div>
      <div className={styles.sheetBody}>
        <Head c={c} n={n} />
        <div className={styles.more}>
          <span className={styles.label}>Il cuore</span>
          <ul className={styles.core}>
            {c.core!.map((it) => <li key={it}>{it}</li>)}
          </ul>
          {c.pack && <p className={styles.note}><b>{c.pack.label}.</b> {c.pack.text}</p>}
          <span className={styles.label}>{c.spaceLabel}</span>
          <ul className={styles.space}>
            {c.space!.map((it) => <li key={it}>{it}</li>)}
          </ul>
          <span className={styles.label}>{c.addLabel}</span>
          <ul className={styles.inline}>
            {c.adds!.map((it) => <li key={it}>{it}</li>)}
          </ul>
          {c.variants && <p className={styles.small}>{c.variants}</p>}
          {c.note && <p className={styles.small}>{c.note}</p>}
          <Cta />
        </div>
        {peek}
      </div>
    </article>
  )
}

/** 04 · la scheda con la graffetta e la settimana */
function Tag({ c, n, peek }: Props) {
  return (
    <article className={`${styles.paper} ${styles.tag}`}>
      <Clip className={styles.clip} />
      <Head c={c} n={n} />
      <div className={styles.more}>
        <span className={styles.label}>Una settimana tipo</span>
        <div className={styles.week} aria-hidden="true">
          {c.week!.map((d, i) => <span key={i}>{d}<i data-on={POSTS[i]} /></span>)}
        </div>
        <ul className={styles.inline}>
          {c.items!.map((it) => <li key={it}>{it}</li>)}
        </ul>
        <Cta />
      </div>
      {peek}
    </article>
  )
}

// l'angolo di arrivo di ogni carta: cade sul tavolo e si posa
const TILT = [-4, 5, 3, -5]

export function ServicesNewSection() {
  const [open, setOpen] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  // aperta una carta sul telefono, la si legge dall'inizio: la griglia torna in cima
  useEffect(() => {
    const board = boardRef.current
    if (!open || !board || board.getBoundingClientRect().top > 0) return
    const lenis = (window as unknown as { __lenis?: { scrollTo: (el: HTMLElement, o: { offset: number }) => void } }).__lenis
    if (lenis) lenis.scrollTo(board, { offset: -80 })
    else board.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [open])

  return (
    <div className={styles.section}>

      {/* ── Header sezione ─────────────────────────────────────── */}
      <motion.div
        className={styles.sectionHeader}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={vp}
        transition={{ duration: 0.7, ease: 'easeOut' as const }}
      >
        <div>
          <span className={styles.sectionLabel}>Cosa offro</span>
          <h2 className={styles.heading}>
            {SERVICES.heading}
          </h2>
        </div>
        <p className={styles.intro}>{SERVICES.intro}</p>
      </motion.div>

      {/* ── Le carte ───────────────────────────────────────────── */}
      <div ref={boardRef} className={styles.board} data-open={open ?? undefined}>
        <div className={`${styles.topLine} ${styles.code}`} aria-hidden="true">
          {SERVICES.band.map((t, i) => <span key={t} data-i={i}>{t}</span>)}
        </div>

        {cards.map((c, idx) => {
          const isOpen = open === c.id
          const n = `0${idx + 1}`
          const peek = <Peek open={isOpen} onToggle={() => setOpen(isOpen ? null : c.id)} />
          return (
            <motion.div
              key={c.id}
              className={styles.slot}
              data-kind={c.kind}
              data-open={isOpen || undefined}
              onClick={() => { if (!isOpen) setOpen(c.id) }}
              initial={{ opacity: 0, y: 56, rotate: TILT[idx % TILT.length] }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={vp}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1], delay: (idx % 2) * 0.12 }}
            >
              {c.kind === 'folder' && <Folder c={c} n={n} peek={peek} />}
              {c.kind === 'strip' && <Strip c={c} n={n} peek={peek} />}
              {c.kind === 'sheet' && <Sheet c={c} n={n} peek={peek} />}
              {c.kind === 'tag' && <Tag c={c} n={n} peek={peek} />}
            </motion.div>
          )
        })}
      </div>

      {/* ── Footer decorativo ──────────────────────────────────── */}
      <motion.div
        className={styles.gridFooter}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={vp}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <span className={styles.gridFooterNote}>
          Ogni progetto è un'altra storia. Contattami per un preventivo personalizzato.
        </span>
        <span className={styles.collect}>
          {SERVICES.collect[0]} <b aria-hidden="true">✳</b> {SERVICES.collect[1]} ( <u>{SERVICES.collect[2]}</u> )
        </span>
      </motion.div>

    </div>
  )
}
