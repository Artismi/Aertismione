'use client'

/**
 * Servizi: quattro carte sul tavolo, ognuna un oggetto di carta diverso
 * (cartellina, cartellino appeso, foglio con la pinza, scheda a righe).
 * Tutto il testo e' in vista; i contenuti sono in SERVICES.cards (content.ts).
 */

import { motion } from 'framer-motion'
import styles from './ServicesNewSection.module.css'
import { SERVICES } from '@/config/content'
import { useConfiguratorStore } from '@/stores/useConfiguratorStore'

const vp = { once: true, margin: '-60px' }

type Card = {
  id: string
  kind: 'folder' | 'tag' | 'sheet' | 'card'
  code: string
  label: string
  lead: string
  tab?: string
  type?: string
  featured?: boolean
  steps?: { name: string; text: string }[]
  items?: string[]
  sticker?: string
  core?: string[]
  addLabel?: string
  adds?: string[]
  variants?: string
  note?: string
  week?: string[]
}

const cards = SERVICES.cards as Card[]

// i giorni con un'uscita, nella settimana tipo della scheda social
const POSTS = [true, false, true, false, true, true, false]

function Cta() {
  return (
    <button type="button" className={styles.cta} onClick={() => useConfiguratorStore.getState().openModal()}>
      {SERVICES.cta}
    </button>
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
      <path d="M45 -40 C40 10 30 40 40 72 C44 84 50 84 48 74" fill="none" stroke="#E8A8BF" strokeWidth="3" strokeLinecap="round" />
      <path d="M52 -40 C58 14 60 46 50 72" fill="none" stroke="#c98aa1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Folder({ c, n }: { c: Card; n: string }) {
  return (
    <article className={`${styles.paper} ${styles.folder}`} data-tab={c.tab}>
      <div className={styles.folderHead}>
        <span className={styles.code}>{c.code} · Artismi</span>
        <span className={styles.folderNo} aria-hidden="true">{n}</span>
      </div>
      <h3 className={styles.title}>{c.label}</h3>
      <p className={styles.lead}>{c.lead}</p>
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
        <Cta />
        {c.note && (
          <p className={styles.sticky}>
            <span className={styles.tape} aria-hidden="true" />
            <span className={styles.stickyLabel}>+ valore intangibile</span>
            {c.note}
          </p>
        )}
      </div>
    </article>
  )
}

function Tag({ c }: { c: Card }) {
  return (
    <div className={styles.tagWrap}>
      <Twine className={styles.string} />
      <article className={`${styles.paper} ${styles.tag}`}>
        <span className={styles.code}>{c.code} · Check your favorite</span>
        <h3 className={styles.title} style={{ marginTop: 12 }}>{c.label}</h3>
        <p className={styles.lead}>{c.lead}</p>
        <ul className={styles.checks}>
          {c.items!.map((it) => <li key={it} className={styles.check}>{it}</li>)}
        </ul>
        <Cta />
      </article>
      {c.sticker && (
        <span className={styles.sticker} aria-hidden="true">
          <span>✦</span>{c.sticker}
        </span>
      )}
    </div>
  )
}

function Sheet({ c }: { c: Card }) {
  return (
    <article className={`${styles.paper} ${styles.sheet}`}>
      <Binder className={styles.binder} />
      <div className={`${styles.band} ${styles.code}`}>
        <span>Artismi-({c.code})</span>
        <span>{c.type} ✦</span>
      </div>
      <div className={styles.sheetBody}>
        {c.featured && <span className={styles.stamp}>✦<br />Più<br />richiesto</span>}
        <span className={styles.sheetType}>Percorso completo</span>
        <h3 className={`${styles.title} ${styles.sheetTitle}`}>{c.label}</h3>
        <p className={styles.lead}>{c.lead}</p>
        <div className={styles.sheetCols}>
          <div>
            <span className={styles.colLabel}>Il cuore</span>
            <ul className={styles.core}>
              {c.core!.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </div>
          <div>
            <span className={styles.colLabel}>{c.addLabel}</span>
            <ul className={styles.adds}>
              {c.adds!.map((it) => <li key={it}>{it}</li>)}
            </ul>
            {c.variants && <p className={styles.variants}>{c.variants}</p>}
          </div>
        </div>
        {c.note && <p className={styles.sheetNote}>{c.note}</p>}
        <Cta />
      </div>
    </article>
  )
}

function IndexCard({ c }: { c: Card }) {
  return (
    <article className={`${styles.paper} ${styles.card}`}>
      <div className={styles.cardTop}>
        <span className={styles.code}>{c.code}</span>
        <span className={styles.code}>{c.type}</span>
      </div>
      <h3 className={styles.title}>{c.label}</h3>
      <p className={styles.lead}>{c.lead}</p>
      <div className={styles.week} aria-hidden="true">
        {c.week!.map((d, i) => <span key={i}>{d}<i data-on={POSTS[i]} /></span>)}
      </div>
      <ul className={styles.cardList}>
        {c.items!.map((it) => <li key={it}>{it}</li>)}
      </ul>
      <Cta />
    </article>
  )
}

// l'angolo di arrivo di ogni carta: cade sul tavolo e si posa
const TILT = [-4, 5, 3, -5]

export function ServicesNewSection() {
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

      {/* ── Le quattro carte ───────────────────────────────────── */}
      <div className={styles.board}>
        {cards.map((c, idx) => (
          <motion.div
            key={c.id}
            className={styles.slot}
            data-kind={c.kind}
            initial={{ opacity: 0, y: 56, rotate: TILT[idx % TILT.length] }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={vp}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1], delay: (idx % 2) * 0.12 }}
          >
            {c.kind === 'folder' && <Folder c={c} n={`0${idx + 1}`} />}
            {c.kind === 'tag' && <Tag c={c} />}
            {c.kind === 'sheet' && <Sheet c={c} />}
            {c.kind === 'card' && <IndexCard c={c} />}
          </motion.div>
        ))}
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
        <span className={styles.gridFooterStar} aria-hidden="true">✦ ✦ ✦</span>
      </motion.div>

    </div>
  )
}
