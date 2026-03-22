'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useConfiguratorStore } from '@/stores/useConfiguratorStore'
import styles from './ConfiguratorModal.module.css'
import { Step1Discovery } from './Step1Discovery'
import { Step2Selection } from './Step2Selection'
import { Step3Summary } from './Step3Summary'
import { ConfigSidebar } from './ConfigSidebar'
import { useEffect } from 'react'

export function ConfiguratorModal() {
  const { isModalOpen, closeModal, currentStep } = useConfiguratorStore()

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className={styles.overlay}>
          {/* Backdrop blur */}
          <motion.div 
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          />

          {/* Modal Container */}
          <motion.div 
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <button className={styles.closeBtn} onClick={closeModal} aria-label="Chiudi finestra">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className={styles.content}>
              <div className={styles.wizardArea}>
                <header className={styles.header}>
                  <span className={styles.stepIndicator}>Preventivo Interattivo — Step {currentStep} di 3</span>
                  <div className={styles.progressBar}>
                    <motion.div 
                      className={styles.progressFill}
                      animate={{ width: `${(currentStep / 3) * 100}%` }}
                    />
                  </div>
                </header>

                <div className={styles.stepView}>
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && <Step1Discovery key="1" />}
                    {currentStep === 2 && <Step2Selection key="2" />}
                    {currentStep === 3 && <Step3Summary key="3" />}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sidebar integrated in modal */}
              <div className={styles.sidebarArea}>
                <ConfigSidebar />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
