'use client'

import { motion, type Transition } from 'framer-motion'
import styles from './HeroSection.module.css'
import { HERO } from '@/config/content'
import { RawBtn } from '@/components/ui/RawBtn'

const EXPO: Transition = { duration: 0.95, ease: [0.16, 1, 0.3, 1] }

/* Ogni linea del titolo esce dal basso del suo contenitore clip */
function MaskLine({ text, delay, accent }: { text: string; delay: number; accent?: boolean }) {
  return (
    <span className={styles.maskWrap}>
      <motion.span
        className={accent ? styles.lineAccent : styles.line}
        dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }}
        initial={{ y: '112%' }}
        animate={{ y: '0%' }}
        transition={{ ...EXPO, delay } satisfies Transition}
      />
    </span>
  )
}

export function HeroSection() {
  return (
    <div className={styles.hero} aria-label="Sezione principale">
      {/* 40vh breather space for the logo exclusively */}
      <div className={styles.firstViewport} aria-hidden="true" />

      {/* Testo protetto dall'overlay viola 0.85 */}
      <div className={styles.secondViewport}>

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

        {/* Dark lines — z-index: -1, behind the 3D canvas/logo */}
        <div className={styles.titleDark} aria-hidden="true">
          {HERO.lines.map((line, i) =>
            i !== HERO.accentLineIndex
              ? <MaskLine key={i} text={line} delay={0.2 + i * 0.14} />
              : null
          )}
        </div>

        {/* Accent / pink line — z-index: 1, in front of the 3D canvas/logo */}
        <h1 className={styles.titleAccent}>
          <MaskLine
            text={HERO.lines[HERO.accentLineIndex]}
            delay={0.2 + HERO.accentLineIndex * 0.14}
            accent
          />
        </h1>

        {/* Subtitle + CTA */}
        <motion.div
          className={styles.bottom}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.9 } satisfies Transition}
        >
          <div className={styles.subtitleBlock}>
            <div className={styles.subtitleBar} />
            <p className={styles.subtitle}>{HERO.subtitle}</p>
          </div>

          <div className={styles.ctas}>
            {HERO.ctas.map((cta, i) => (
              <motion.div
                key={cta.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 + i * 0.1 } satisfies Transition}
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
