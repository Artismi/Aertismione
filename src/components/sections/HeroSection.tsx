'use client'

import { motion, type Transition } from 'framer-motion'
import styles from './HeroSection.module.css'
import { HERO } from '@/config/content'
import { RawBtn } from '@/components/ui/RawBtn'

const EXPO: Transition = { duration: 0.95, ease: [0.16, 1, 0.3, 1] }

/** *parola* → la parola nel colore d'accento */
function accent(text: string) {
  return text.split(/\*([^*]+)\*/).map((part, i) =>
    i % 2 ? <em key={i} className={styles.accent}>{part}</em> : part)
}

/* Ogni riga del titolo esce dal basso del suo contenitore clip */
function MaskLine({ text, delay }: { text: string; delay: number }) {
  return (
    <span className={styles.maskWrap}>
      <motion.span
        className={styles.line}
        initial={{ y: '112%' }}
        animate={{ y: '0%' }}
        transition={{ ...EXPO, delay } satisfies Transition}
      >
        {accent(text)}
      </motion.span>
    </span>
  )
}

export function HeroSection() {
  return (
    <div className={styles.hero} aria-label="Sezione principale">
      {/* 40vh breather space for the logo exclusively */}
      <div className={styles.firstViewport} aria-hidden="true" />

      {/* Testo protetto dal velo viola; e' anche il punto «Visione» del menu */}
      <div id="visione" className={styles.secondViewport}>

        {/* Eyebrow + disponibilità */}
        <motion.div
          className={styles.eyebrowRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 } satisfies Transition}
        >
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            Artismi Design Studio
          </span>
          <span className={styles.available}>
            <span className={styles.availableDot} />
            Disponibile per nuovi progetti
          </span>
        </motion.div>

        {/* il blocco unico: una frase, cosa ottieni, tre garanzie */}
        <h1 className={styles.title}>
          {HERO.claim.map((line, i) => <MaskLine key={i} text={line} delay={0.2 + i * 0.14} />)}
        </h1>

        <motion.div
          className={styles.bottom}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.7 } satisfies Transition}
        >
          <div className={styles.subtitleBlock}>
            <div className={styles.subtitleBar} />
            <div>
              <p className={styles.subtitle}>{HERO.line}</p>
              <ul className={styles.points}>
                {HERO.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          </div>

          <div className={styles.ctas}>
            {HERO.ctas.map((cta, i) => (
              <motion.div
                key={cta.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.1 } satisfies Transition}
              >
                <RawBtn
                  href={cta.href}
                  label={cta.label}
                  variant={cta.variant as 'primary' | 'secondary'}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <div className={styles.scrollHint} aria-hidden="true">
          <span className={styles.scrollText}>{HERO.scrollHint}</span>
          <div className={styles.scrollLine} />
        </div>
      </div>
    </div>
  )
}
