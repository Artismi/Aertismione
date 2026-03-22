'use client'

import { useConfiguratorStore } from '@/stores/useConfiguratorStore'
import styles from './Configurator.module.css'
import { motion } from 'framer-motion'

export function Step1Discovery() {
  const { haIdentity, setHaIdentity, setStep } = useConfiguratorStore()

  const handleSelect = (val: boolean) => {
    setHaIdentity(val)
    setStep(2)
  }

  return (
    <div className={styles.step}>
      <h3 className={styles.title}>Prima di tutto: hai già un&apos;identità visiva?</h3>
      <p className={styles.subtitle}>
        Questo cambia tutto. Non il risultato finale — il percorso per arrivarci.
      </p>
      
      <div className={styles.explanation}>
        Se hai già un logo, una palette colori, dei font — anche se li hai fatti tu stesso — 
        possiamo usarli come punto di partenza. Se invece parti da zero, 
        costruiamo tutto insieme prima di declinare qualsiasi cosa.
      </div>

      <div className={styles.cardGrid}>
        <button 
          className={`${styles.card} ${haIdentity === false ? styles.active : ''}`}
          onClick={() => handleSelect(false)}
          aria-pressed={haIdentity === false}
        >
          <div className={styles.cardIcon}>★</div>
          <div className={styles.cardBody}>
            <span className={styles.cardTitle}>Parto da zero</span>
            <span className={styles.cardSub}>Non ho un&apos;identità visiva. Voglio costruirne una.</span>
          </div>
        </button>

        <button 
          className={`${styles.card} ${haIdentity === true ? styles.active : ''}`}
          onClick={() => handleSelect(true)}
          aria-pressed={haIdentity === true}
        >
          <div className={styles.cardIcon}>✦</div>
          <div className={styles.cardBody}>
            <span className={styles.cardTitle}>Ho già un&apos;identità</span>
            <span className={styles.cardSub}>Ho già logo, colori, font. Voglio declinare o aggiungere elementi.</span>
          </div>
        </button>
      </div>

      <footer className={styles.footerNote}>
        I prezzi mostrati sono stime indicative. La cifra definitiva viene confermata dopo una prima chiamata.
      </footer>
    </div>
  )
}
