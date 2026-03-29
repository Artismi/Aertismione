'use client'

import { motion } from 'framer-motion'
import styles from './AboutSection.module.css'
import { ABOUT } from '@/config/content'

const vp = { once: true, margin: '-60px' }

export function AboutSection() {
  return (
    <div className={styles.section}>
      {/* Immagine di fallback per la scena 3D (inserire l'immagine in public/images/chi-sono-bg.webp) */}
      <div className={styles.bgImage} />

      {/* Card bio — ancorata a sinistra, avatar libero a destra */}
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, x: -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={vp}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
      >
        {/* Label sezione */}
        <span className={styles.label}>Chi sono</span>

        {/* Nome come display */}
        <h2 className={styles.name}>{ABOUT.heading}</h2>

        {/* Bio */}
        <div className={styles.bio}>
          {ABOUT.bio.map((para, i) => (
            <motion.p
              key={i}
              className={styles.para}
              dangerouslySetInnerHTML={{ __html: para }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.55, ease: 'easeOut' as const, delay: i * 0.07 }}
            />
          ))}
        </div>

        {/* Socials */}
        <div className={styles.socials}>
          {ABOUT.socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label={s.aria}
            >
              ↗ {s.label}
            </a>
          ))}
        </div>
      </motion.div>

      {/* Ticker in fondo */}
      <motion.div
        className={styles.tickerWrap}
        aria-label="Competenze"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={vp}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <div className={styles.ticker}>
          {[0, 1].map((pass) => (
            <div key={pass} className={styles.tickerTrack} aria-hidden={pass === 1}>
              {ABOUT.skills.map((s) => (
                <span key={s.code} className={styles.tickerItem}>
                  <span className={styles.tickerStar} aria-hidden="true">✦</span>
                  <span className={styles.tickerCode}>{s.code}</span>
                  <span className={styles.tickerLabel}>{s.label}</span>
                  <span className={styles.tickerSubs}>{s.items.join(' · ')}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
