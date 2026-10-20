'use client'

/**
 * Il metodo, in una riga: tra l'apertura e il banco una frase sola, che si
 * legge in un colpo d'occhio, e tre garanzie. Prima qui c'erano Problema e
 * Soluzione, sei righe da leggere prima di arrivare ai lavori.
 */

import { motion } from 'framer-motion'
import styles from './ProblemSection.module.css'
import { VISION } from '@/config/content'

const vp = { once: true, margin: '-80px' }
const ease = [0.16, 1, 0.3, 1] as const

/** *parola* → la parola nel colore d'accento */
function accent(text: string) {
  return text.split(/\*([^*]+)\*/).map((part, i) =>
    i % 2 ? <em key={i} className={styles.accent}>{part}</em> : part)
}

export function ProblemSection() {
  return (
    <div className={styles.section}>
      <div className="container">
        <div className={styles.row}>
          <div>
            <motion.span
              className={styles.eyebrow}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={vp}
              transition={{ duration: 0.5 }}
            >
              {VISION.eyebrow}
            </motion.span>
            <h2 className={styles.claim}>
              {VISION.claim.map((line, i) => (
                <motion.span
                  key={i}
                  className={styles.claimLine}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.8, ease, delay: 0.1 + i * 0.12 }}
                >
                  {accent(line)}
                </motion.span>
              ))}
            </h2>
          </div>

          <motion.div
            className={styles.side}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.7, ease, delay: 0.35 }}
          >
            <p className={styles.line}>{VISION.line}</p>
            <ul className={styles.points}>
              {VISION.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
