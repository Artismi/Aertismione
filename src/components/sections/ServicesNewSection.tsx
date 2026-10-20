'use client'

/**
 * Servizi: la griglia a colonne, una per servizio, separate da filetti; la
 * colonna del percorso piu' richiesto e' viola, col badge ambra. Solo
 * tipografia e colore, niente prezzi. Ogni colonna si legge d'un fiato:
 * titolo, la promessa (a cosa serve, in una frase), poche righe su cosa
 * succede e cosa ottieni, un lavoro vero.
 * I contenuti sono in SERVICES.cards (content.ts).
 *
 * Sul telefono le colonne diventano una griglia due per due con titolo e
 * promessa: toccandone una si apre a tutta larghezza, e le altre restano li'.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import styles from './ServicesNewSection.module.css'
import { SERVICES } from '@/config/content'
import { useConfiguratorStore } from '@/stores/useConfiguratorStore'

const vp = { once: true, margin: '-60px' }

type Card = {
  id: string
  code: string
  paper: 'folder' | 'sheet' | 'featured' | 'tag'
  type: string
  label: string
  promise: string
  text: string
  proof: string
  featured?: boolean
}

const cards = SERVICES.cards as Card[]

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

/** lo spago del cartellino, che sale fino alla fascia */
function Twine({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 40 90" preserveAspectRatio="none" aria-hidden="true">
      <path d="M17 0 C14 30 26 55 20 88" fill="none" stroke="#35144E" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M23 0 C27 32 15 58 21 88" fill="none" stroke="#5a2d7a" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/** l'adesivo tondo, col testo che gira intorno */
function Sticker() {
  return (
    <svg className={styles.sticker} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id="servizi-ring" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="58" />
      <text className={styles.stickerRing}>
        <textPath href="#servizi-ring">Artismi ✦ Fatto a mano ✦ Artismi ✦ Fatto a mano ✦</textPath>
      </text>
      <text className={styles.stickerCenter} x="60" y="56" textAnchor="middle">Qual è il</text>
      <text className={styles.stickerCenter} x="60" y="70" textAnchor="middle">tuo preferito?</text>
    </svg>
  )
}

export function ServicesNewSection() {
  // sul telefono: il servizio aperto a tutta larghezza
  const [open, setOpen] = useState<string | null>(null)

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

      {/* ── La fascia e i fogli ─────────────────────────────────── */}
      <div className={styles.desk}>
      <div className={`${styles.band} ${styles.code}`} aria-hidden="true">
        {SERVICES.band.map((t, i) => <span key={t} data-i={i}>{t}</span>)}
      </div>
      <div className={styles.grid}>
        {cards.map((c, idx) => {
          const isOpen = open === c.id
          return (
            <motion.div
              key={c.id}
              className={`${styles.block} ${c.featured ? styles.featured : ''}`}
              data-paper={c.paper}
              data-code={c.code}
              data-open={isOpen || undefined}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.7, ease: 'easeOut' as const, delay: idx * 0.12 }}
            >
              {c.paper === 'sheet' && <Clip className={styles.clip} />}
              {c.paper === 'tag' && <><Twine className={styles.twine} /><span className={styles.hole} aria-hidden="true" /></>}
              <div className={styles.blockHead}>
                <div className={styles.headRow}>
                  <span className={styles.blockIdx} aria-hidden="true">0{idx + 1}</span>
                  <span className={styles.code}>{c.code} · Artismi</span>
                </div>
                {c.featured && <span className={styles.badge}>✦ Più richiesto</span>}
                <span className={styles.blockType}>{c.type}</span>
                <h3 className={styles.blockTitle}>{c.label}</h3>
              </div>

              <div className={styles.blockBody}>
                <p className={styles.promise}>{c.promise}</p>
                <div className={styles.more}>
                  <p className={styles.text}>{c.text}</p>
                  <p className={styles.proof}><span>Già fatto per</span> {c.proof}</p>
                </div>
                <button
                  type="button"
                  className={styles.peek}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : c.id)}
                >
                  {isOpen ? 'Chiudi' : 'Leggi tutto'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => useConfiguratorStore.getState().openModal()}
                className={styles.blockCta}
              >
                {SERVICES.cta}
              </button>
            </motion.div>
          )
        })}
      </div>
      <Sticker />
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
