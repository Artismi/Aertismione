'use client'

/**
 * Servizi: la griglia a colonne, una per servizio, separate da filetti; la
 * colonna del percorso piu' richiesto e' viola, col badge ambra. Solo
 * tipografia e colore, tutto il testo in vista, niente prezzi. Ogni colonna:
 * cos'e' e per chi, le voci con una spiegazione breve, cosa ricevi, un esempio vero.
 * I contenuti sono in SERVICES.cards (content.ts).
 *
 * Sul telefono le colonne diventano una griglia due per due con tipo, titolo e
 * frase: toccandone una si apre a tutta larghezza, e le altre restano li'.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import styles from './ServicesNewSection.module.css'
import { SERVICES } from '@/config/content'
import { useConfiguratorStore } from '@/stores/useConfiguratorStore'

const vp = { once: true, margin: '-60px' }

type Row = { name: string; text: string }
type Card = {
  id: string
  type: string
  label: string
  hook: string
  forWho: string
  featured?: boolean
  groups: { label?: string; items: Row[] }[]
  more?: string
  result: string
  example: string
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

                {c.featured && (
                  <span className={styles.badge}>✦ Più richiesto</span>
                )}

                <span className={styles.blockType}>{c.type}</span>
                <h3 className={styles.blockTitle}>{c.label}</h3>
                <p className={styles.blockHook}>{c.hook}</p>
                <p className={styles.forWho}><span>Per chi</span> {c.forWho}</p>

                <button
                  type="button"
                  className={styles.peek}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : c.id)}
                >
                  {isOpen ? 'Chiudi' : 'Leggi tutto'}
                </button>
              </div>

              <div className={styles.more}>
                <div className={styles.groups}>
                {c.groups.map((g, gi) => (
                  <ul key={gi} className={styles.list}>
                    {g.label && <li className={styles.groupLabel}>{g.label}</li>}
                    {g.items.map((it) => (
                      <li key={it.name} className={styles.item}>
                        <span className={styles.itemName}>{it.name}</span>
                        <span className={styles.itemText}>{it.text}</span>
                      </li>
                    ))}
                  </ul>
                ))}
                </div>

                {c.more && <p className={styles.extra}>{c.more}</p>}

                <div className={styles.outcome}>
                  <p className={styles.result}><span>Cosa ricevi</span>{c.result}</p>
                  <p className={styles.example}><span>Esempio</span>{c.example}</p>
                </div>

                <button
                  type="button"
                  onClick={() => useConfiguratorStore.getState().openModal()}
                  className={styles.blockCta}
                >
                  {SERVICES.cta}
                </button>
              </div>
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
