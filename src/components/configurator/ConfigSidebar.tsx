'use client'

import { useConfiguratorStore, CONFIG_SERVICES } from '@/stores/useConfiguratorStore'
import styles from './ConfigSidebar.module.css'
import { motion, AnimatePresence } from 'framer-motion'

export function ConfigSidebar() {
  const { currentStep, setStep, selectedServices, getTotals, haIdentity } = useConfiguratorStore()
  const { oneOffMin, oneOffMax, monthlyMin, monthlyMax, hasCustom } = getTotals()

  const selectedItems = selectedServices.map(id => CONFIG_SERVICES.find(s => s.id === id)).filter(Boolean)

  const canContinue = currentStep === 1 
    ? haIdentity !== null 
    : selectedServices.length > 0

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sticky}>
        <h4 className={styles.title}>Il tuo progetto</h4>
        
        <div className={styles.itemsList}>
          <AnimatePresence>
            {selectedItems.length === 0 ? (
              <motion.p 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className={styles.emptyNote}
              >
                Nessun servizio selezionato
              </motion.p>
            ) : (
              selectedItems.map(item => (
                <motion.div 
                  key={item!.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={styles.sidebarItem}
                >
                  <span className={styles.itemName}>{item!.label}</span>
                  <span className={styles.itemPrice}>
                    {item!.min === 0 ? 'da def.' : `${item!.min}€`}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Stima una tantum</span>
            <span className={styles.totalValue}>
              {oneOffMin.toLocaleString()} – {oneOffMax.toLocaleString()} €
              {hasCustom && ' + ?'}
            </span>
          </div>
          
          {(monthlyMin > 0) && (
            <div className={`${styles.totalRow} ${styles.monthly}`}>
              <span>Mensile</span>
              <span className={styles.totalValue}>
                {monthlyMin.toLocaleString()} – {monthlyMax.toLocaleString()} €/mese
              </span>
            </div>
          )}
        </div>

        {currentStep < 3 && (
          <button 
            className={styles.continueBtn}
            disabled={!canContinue}
            onClick={() => setStep((currentStep + 1) as 2 | 3)}
          >
            {currentStep === 1 ? 'Continua →' : 'Vedi riepilogo →'}
          </button>
        )}
        
        {currentStep > 1 && (
          <button className={styles.backBtn} onClick={() => setStep((currentStep - 1) as 1 | 2)}>
            ← Indietro
          </button>
        )}
      </div>
    </aside>
  )
}
