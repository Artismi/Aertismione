'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import styles from './BookReader.module.css'

interface Props {
  url: string
  title: string
  accent: string
  tall?: boolean
  horizontal?: boolean
}

export function BookReader({ url, title, accent, tall = false, horizontal = false }: Props) {
  const [loaded, setLoaded] = useState(false)

  const iframeSrc = `${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`

  return (
    <motion.div
      className={`${styles.wrap} ${tall ? styles.tall : ''} ${horizontal ? styles.horizontal : ''}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
    >
      {/* Header editoriale */}
      <div className={styles.header} style={{ '--accent': accent } as React.CSSProperties}>
        <div className={styles.headerLeft}>
          <span className={styles.docLabel}>Documento</span>
          <span className={styles.title}>{title}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openLink}
          style={{ color: accent }}
        >
          Apri in piena pagina ↗
        </a>
      </div>

      {/* Frame */}
      <div className={styles.frameWrap}>
        {!loaded && (
          <div className={styles.loading}>
            <span className={styles.loadingDot} style={{ background: accent }} />
            <span className={styles.loadingText}>Caricamento…</span>
          </div>
        )}
        <iframe
          src={iframeSrc}
          title={title}
          className={styles.iframe}
          onLoad={() => setLoaded(true)}
        />
        {/* fade bottom */}
        <div className={styles.fadeBottom} />
      </div>
    </motion.div>
  )
}
