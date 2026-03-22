'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import styles from './Preloader.module.css'
import { useStore } from '@/stores/useStore'

function MatrixJelly() {
  // Configurazione dei 6 blocchetti "Matrix"
  const blocks = Array.from({ length: 9 })
  
  return (
    <div className={styles.jellyContainer}>
      {blocks.map((_, i) => (
        <motion.div
          key={i}
          className={styles.jellyBlock}
          initial={{ opacity: 0.1, scale: 0.8 }}
          animate={{ 
            opacity: [0.1, 0.8, 0.1], 
            scale: [0.8, 1.1, 0.8],
            y: [0, -10, 0]
          }}
          transition={{
            duration: 0.6 + Math.random() * 0.8,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export function Preloader() {
  const isLoaded = useStore((s) => s.isLoaded)
  const loadingProgress = useStore((s) => s.loadingProgress)
  const [show, setShow] = useState(true)

  // Disattiva il preloader solo quando isLoaded === true
  useEffect(() => {
    if (isLoaded) {
      // Piccolo buffer per l'utente, poi sparisce
      const timer = setTimeout(() => setShow(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.overlay}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className={styles.content}>
            <div className={styles.brand}>
              <span className={styles.studio}>Artismi Design Studio</span>
              <span className={styles.location}>Loading Terminal — v1.0.2</span>
            </div>

            <MatrixJelly />

            <div className={styles.progressCounter}>
              <span>{Math.round(loadingProgress)}</span>
              <span className={styles.percent}>%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
