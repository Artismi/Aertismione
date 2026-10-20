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
  type: string
  label: string
  promise: string
  text: string
  proof: string
  featured?: boolean
}

const cards = SERVICES.cards as Card[]

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

      {/* ── Griglia blocchi ────────────────────────────────────── */}
      <div className={styles.grid}>
        {cards.map((c, idx) => {
          const isOpen = open === c.id
          return (
            <motion.div
              key={c.id}
              className={`${styles.block} ${c.featured ? styles.featured : ''}`}
              data-open={isOpen || undefined}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.7, ease: 'easeOut' as const, delay: idx * 0.12 }}
            >
              <div className={styles.blockHead}>
                <span className={styles.blockIdx} aria-hidden="true">0{idx + 1}</span>
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
