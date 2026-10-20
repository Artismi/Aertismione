'use client'

/**
 * Servizi: un collage di carta sul velo viola, nei colori dell'ambra e del
 * viola. In cima la fascia ambra con il codice; sotto la cartellina kraft
 * (progettazione partecipata), il cartellino crema appeso allo spago
 * (social), la striscia ambra pinzata con le caselle (stampe e gadget) e il
 * foglio con la graffetta (identita'). I contenuti sono in SERVICES (content.ts).
 *
 * Ogni carta si legge in tre colpi: la foto di un lavoro vero, il numero col
 * titolo, una frase breve. Sotto i dettagli. Sul computer tutto e' in vista;
 * sul telefono le carte stanno insieme a due a due e mostrano foto, titolo e
 * frase: toccandone una si apre tutta, con il bottone del preventivo.
 */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import styles from './ServicesNewSection.module.css'
import { SERVICES } from '@/config/content'
import { useConfiguratorStore } from '@/stores/useConfiguratorStore'

const vp = { once: true, margin: '-60px' }

type Img = { src: string; w: number; h: number; alt: string; caption: string }

type Card = {
  id: string
  kind: 'folder' | 'strip' | 'sheet' | 'tag'
  code: string
  kicker: string
  label: string
  hook: string
  lead: string
  images: Img[]
  tab?: string
  type?: string
  featured?: boolean
  steps?: { name: string; text: string }[]
  items?: string[]
  sticker?: string
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

// i giorni con un'uscita, nella settimana tipo del cartellino social
const POSTS = [true, false, true, false, true, true, false]

function Cta() {
  return (
    <button type="button" className={styles.cta} onClick={() => useConfiguratorStore.getState().openModal()}>
      {SERVICES.cta}
    </button>
  )
}

/** sul telefono: apre la carta dal collage, o la richiude */
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

/** una foto stampata, col bordo bianco e la didascalia sotto */
function Photo({ img, className = '' }: { img: Img; className?: string }) {
  return (
    <figure className={`${styles.photo} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.src} width={img.w} height={img.h} alt={img.alt} loading="lazy" decoding="async" />
      <figcaption>{img.caption}</figcaption>
    </figure>
  )
}

/** numero grande, etichetta, titolo e la frase breve: quello che si legge per primo */
function Head({ c, n }: { c: Card; n: string }) {
  return (
    <>
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

/** la pinza nera da ufficio */
function Binder({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 64 58" aria-hidden="true">
      <path d="M20 26 C18 10 22 3 32 3 C42 3 46 10 44 26" fill="none" stroke="#b9b6b0" strokeWidth="2.6" />
      <path d="M24 26 C23 13 26 7 32 7 C38 7 41 13 40 26" fill="none" stroke="#8f8b85" strokeWidth="2" />
      <path d="M6 24 H58 L52 56 H12 Z" fill="#141016" />
      <path d="M8 26 H56" stroke="#3a3440" strokeWidth="2" />
    </svg>
  )
}

/** lo spago che tiene il cartellino */
function Twine({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 90 96" aria-hidden="true">
      <path d="M45 -40 C40 10 30 40 40 72 C44 84 50 84 48 74" fill="none" stroke="#C8860A" strokeWidth="3" strokeLinecap="round" />
      <path d="M52 -40 C58 14 60 46 50 72" fill="none" stroke="#9c6806" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** la coppia di adesivi tondi, con il testo che gira intorno */
function Stickers() {
  const { ring, center } = SERVICES.stickers
  return (
    <div className={styles.stickers} aria-hidden="true">
      {['a', 'b'].map((k) => (
        <svg key={k} className={styles.round} data-k={k} viewBox="0 0 120 120">
          <defs>
            <path id={`ring-${k}`} d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
          </defs>
          <circle cx="60" cy="60" r="58" />
          <text className={styles.ringText}>
            <textPath href={`#ring-${k}`}>{ring}{ring}</textPath>
          </text>
          <foreignObject x="30" y="34" width="60" height="52">
            <p className={styles.roundCenter}>{center}</p>
          </foreignObject>
        </svg>
      ))}
    </div>
  )
}

type Props = { c: Card; n: string; peek: React.ReactNode }

function Folder({ c, n, peek }: Props) {
  const [lab, result] = c.images
  return (
    <article className={`${styles.paper} ${styles.folder}`} data-tab={c.tab}>
      <div className={styles.folderTop}>
        <div className={styles.folderText}><Head c={c} n={n} /></div>
        <Photo img={lab} className={styles.folderPhoto} />
      </div>
      <div className={styles.more}>
        <span className={styles.label}>Come funziona</span>
        <ol className={styles.steps}>
          <Clip className={styles.clip} />
          {c.steps!.map((s) => (
            <li key={s.name} className={styles.step}>
              <span className={styles.stepName}>{s.name}</span>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
        <div className={styles.folderFoot}>
          {result && <Photo img={result} className={styles.resultPhoto} />}
          {c.note && (
            <p className={styles.sticky}>
              <span className={styles.tape} aria-hidden="true" />
              <span className={styles.stickyLabel}>+ valore intangibile</span>
              {c.note}
            </p>
          )}
        </div>
        <Cta />
      </div>
      {peek}
    </article>
  )
}

function Strip({ c, n, peek }: Props) {
  return (
    <div className={styles.stripWrap}>
      <Binder className={styles.stripClip} />
      <article className={`${styles.paper} ${styles.strip}`}>
        <Photo img={c.images[0]} className={styles.stripPhoto} />
        <Head c={c} n={n} />
        <div className={styles.more}>
          <span className={styles.label}>Spunta i preferiti</span>
          <ul className={styles.checks}>
            {c.items!.map((it) => <li key={it} className={styles.check}>{it}</li>)}
          </ul>
          <div className={styles.stripFoot}>
            <Cta />
            {c.sticker && <span className={styles.oval}>{c.sticker}</span>}
          </div>
        </div>
        {peek}
      </article>
    </div>
  )
}

function Sheet({ c, n, peek }: Props) {
  const [main, ...rest] = c.images
  return (
    <article className={`${styles.paper} ${styles.sheet}`}>
      <span className={`${styles.tape} ${styles.sheetTape}`} aria-hidden="true" />
      <Clip className={styles.sheetClip} />
      <div className={`${styles.band} ${styles.code}`}>
        <span>Artismi-({c.code})</span>
        <span>{c.type} ✦</span>
      </div>
      <div className={styles.sheetBody}>
        <div className={styles.sheetTop}>
          <div className={styles.fan}>
            <Photo img={main} className={styles.fanMain} />
            {rest.map((img) => <Photo key={img.src} img={img} className={`${styles.fanSmall} ${styles.more}`} />)}
          </div>
          <div className={styles.sheetText}>
            {c.featured && <span className={styles.stamp}>✦<br />Più<br />richiesto</span>}
            <Head c={c} n={n} />
            <div className={styles.more}>
              <span className={styles.label}>Il cuore</span>
              <ul className={styles.core}>
                {c.core!.map((it) => <li key={it}>{it}</li>)}
              </ul>
              {c.pack && (
                <p className={styles.pack}>
                  <b>{c.pack.label}</b> {c.pack.text}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className={styles.more}>
          <div className={styles.sheetCols}>
            <div>
              <span className={styles.label}>{c.spaceLabel}</span>
              <ul className={styles.space}>
                {c.space!.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
            <div>
              <span className={styles.label}>{c.addLabel}</span>
              <ul className={styles.adds}>
                {c.adds!.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          </div>
          {c.variants && <p className={styles.variants}>{c.variants}</p>}
          {c.note && <p className={styles.sheetNote}>{c.note}</p>}
          <Cta />
        </div>
        {peek}
      </div>
    </article>
  )
}

function Tag({ c, n, peek }: Props) {
  return (
    <div className={styles.tagWrap}>
      <Twine className={styles.string} />
      <article className={`${styles.paper} ${styles.tag}`}>
        <span className={`${styles.code} ${styles.side}`} aria-hidden="true">Artismi · una settimana tipo · {c.type}</span>
        <Photo img={c.images[0]} className={styles.tagPhoto} />
        <Head c={c} n={n} />
        <div className={styles.more}>
          <span className={styles.label}>Una settimana tipo</span>
          <div className={styles.week} aria-hidden="true">
            {c.week!.map((d, i) => <span key={i}>{d}<i data-on={POSTS[i]} /></span>)}
          </div>
          <ul className={styles.tagList}>
            {c.items!.map((it) => <li key={it}>{it}</li>)}
          </ul>
          <Cta />
        </div>
        {peek}
      </article>
    </div>
  )
}

// l'angolo di arrivo di ogni carta: cade sul tavolo e si posa
const TILT = [-4, 5, 3, -5]

export function ServicesNewSection() {
  const [open, setOpen] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  // aperta una carta sul telefono, la si legge dall'inizio: il collage torna in cima
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

      {/* ── Il collage ─────────────────────────────────────────── */}
      <div ref={boardRef} className={styles.board} data-open={open ?? undefined}>
        <div className={`${styles.topBand} ${styles.code}`} aria-hidden="true">
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

        <Stickers />
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
