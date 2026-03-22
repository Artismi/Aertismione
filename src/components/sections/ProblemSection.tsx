'use client'

import { motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import styles from './ProblemSection.module.css'
import { VISION } from '@/config/content'

const vp = { once: true, margin: '-80px' }

export function ProblemSection() {
  return (
    <div className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {VISION.blocks.map((block, idx) => (
            <motion.div
              key={block.id}
              className={styles.block}
              initial={{ opacity: 0, x: idx === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={vp}
              transition={{ duration: 0.8, ease: 'easeOut' as const, delay: idx * 0.15 }}
            >
              <span className={styles.blockIndex} aria-hidden="true">
                0{idx + 1}
              </span>

              <motion.span
                className={styles.blockLabel}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={vp}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.15 }}
              >
                {block.id}
              </motion.span>

              <motion.h2
                className={styles.heading}
                style={block.accent === 'warm' ? { color: 'var(--color-warm)' } : undefined}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.7, ease: 'easeOut' as const, delay: 0.2 + idx * 0.15 }}
              >
                {block.heading}
              </motion.h2>

              <motion.div
                className={styles.bodyWrap}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.6, delay: 0.4 + idx * 0.15 }}
              >
                <div className={styles.bodyLine} aria-hidden="true" />
                <p className={styles.body}>
                  {block.body.split('\n').map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                  ))}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
