'use client'

import { motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import styles from './ServicesNewSection.module.css'
import { SERVICES } from '@/config/content'
import { useConfiguratorStore } from '@/stores/useConfiguratorStore'

const vp = { once: true, margin: '-60px' }

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

      {/* ── Griglia blocchi ────────────────────────────────────── */}
      <div className={styles.grid}>
        {SERVICES.packages.map((pkg, idx) => (
          <motion.div
            key={pkg.id}
            className={`${styles.block} ${pkg.featured ? styles.featured : ''}`}
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.7, ease: 'easeOut' as const, delay: idx * 0.12 }}
          >
            <div className={styles.blockHead}>
              <span className={styles.blockIdx}>0{idx + 1}</span>

              {pkg.featured && (
                <span className={styles.badge}>✦ Più richiesto</span>
              )}

              <span className={styles.blockType}>{pkg.type}</span>
              <h3 className={styles.blockTitle}>{pkg.label}</h3>
            </div>

            <ul className={styles.list}>
              {pkg.items.map((item, i) => (
                <motion.li
                  key={item.name}
                  className={styles.item}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.4, delay: idx * 0.12 + i * 0.07 + 0.2 }}
                >
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemPrice}>{item.price}</span>
                </motion.li>
              ))}
            </ul>

            {pkg.note && (
              <p className={styles.blockNote}>{pkg.note}</p>
            )}

            <button 
              onClick={() => useConfiguratorStore.getState().openModal()} 
              className={styles.blockCta}
            >
              {SERVICES.cta}
            </button>
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
          Tutti i prezzi sono indicativi — ogni progetto è un'altra storia
        </span>
        <span className={styles.gridFooterStar} aria-hidden="true">✦ ✦ ✦</span>
      </motion.div>

    </div>
  )
}
