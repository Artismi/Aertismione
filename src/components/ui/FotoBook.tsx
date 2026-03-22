'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import styles from './FotoBook.module.css'

interface Props {
  images: string[]
  accent: string
  onImageClick?: (src: string, all: string[]) => void
}

export function FotoBook({ images, accent, onImageClick }: Props) {
  const stripRef = useRef<HTMLDivElement>(null)

  return (
    <div className={styles.wrap}>
      <div className={styles.strip} ref={stripRef}>
        {images.map((src, i) => (
          <motion.div
            key={i}
            className={styles.frame}
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: i * 0.05 }}
          >
            <img
              src={src}
              alt=""
              className={styles.img}
              draggable={false}
              onClick={() => onImageClick?.(src, images)}
            />
            <span className={styles.counter} style={{ color: accent }}>
              {String(i + 1).padStart(2, '0')}
            </span>
          </motion.div>
        ))}
      </div>
      <div className={styles.rail}>
        <span className={styles.hint}>← sfoglia →</span>
      </div>
    </div>
  )
}
