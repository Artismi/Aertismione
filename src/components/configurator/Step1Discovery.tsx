'use client'

import { useConfiguratorStore, IdentityMode } from '@/stores/useConfiguratorStore'
import styles from './Configurator.module.css'

export function Step1Discovery() {
  const { haIdentity, setHaIdentity } = useConfiguratorStore()

  // Premere di nuovo la card attiva la deseleziona
  const handleSelect = (val: Exclude<IdentityMode, null>) => {
    setHaIdentity(haIdentity === val ? null : val)
  }

  return (
    <div className={styles.step}>
      <h3 className={styles.title}>Prima di tutto: cosa cerchi?</h3>
      <p className={styles.subtitle}>
        Cambia il percorso, non il risultato finale.
      </p>

      <div className={styles.explanation}>
        Se hai già un logo, colori, font — anche fatti da te —
        partiamo da lì. Se sei a zero, costruiamo l&apos;identità prima
        di declinare qualsiasi cosa. Se vuoi solo una cosa precisa,
        saltiamo il percorso e andiamo dritti.
      </div>

      <div className={`${styles.cardGrid} ${styles.cardGrid3}`}>
        <button
          className={`${styles.card} ${haIdentity === false ? styles.active : ''}`}
          onClick={() => handleSelect(false)}
          aria-pressed={haIdentity === false}
        >
          <div className={styles.cardIcon}>★</div>
          <div className={styles.cardBody}>
            <span className={styles.cardTitle}>Parto da zero</span>
            <span className={styles.cardSub}>Non ho un&apos;identità visiva. Voglio costruirne una e poi declinarla.</span>
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
            <span className={styles.cardSub}>Ho logo, colori, font. Voglio aggiungere o declinare.</span>
          </div>
        </button>

        <button
          className={`${styles.card} ${haIdentity === 'single' ? styles.active : ''}`}
          onClick={() => handleSelect('single')}
          aria-pressed={haIdentity === 'single'}
        >
          <div className={styles.cardIcon}>→</div>
          <div className={styles.cardBody}>
            <span className={styles.cardTitle}>Solo una prestazione</span>
            <span className={styles.cardSub}>Illustrazione, murale, poster — una cosa sola, senza percorso identità.</span>
          </div>
        </button>
      </div>

      <footer className={styles.footerNote}>
        I prezzi mostrati sono stime indicative. La cifra definitiva viene confermata dopo una prima chiamata.
      </footer>
    </div>
  )
}
