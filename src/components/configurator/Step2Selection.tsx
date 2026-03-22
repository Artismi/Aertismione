'use client'

import { useConfiguratorStore, CONFIG_SERVICES, ConfiguratorCategory } from '@/stores/useConfiguratorStore'
import styles from './Configurator.module.css'
import { motion } from 'framer-motion'

const CATEGORIES: { id: ConfiguratorCategory; label: string }[] = [
  { id: 'visual', label: 'Comunicazione Visiva' },
  { id: 'space', label: 'Spazio Fisico' },
  { id: 'gadget', label: 'Gadget e Merchandising' },
  { id: 'monthly', label: 'Servizi Continuativi' }
]

export function Step2Selection() {
  const { haIdentity, selectedServices, toggleService, insegnaType, setInsegnaType } = useConfiguratorStore()

  const renderService = (s: typeof CONFIG_SERVICES[0]) => {
    const isSelected = selectedServices.includes(s.id)
    const isLocked = s.id === 'identity_narrative' && haIdentity === false

    return (
      <div 
        key={s.id} 
        className={`${styles.serviceItem} ${isSelected ? styles.serviceActive : ''} ${isLocked ? styles.serviceLocked : ''}`}
        onClick={() => toggleService(s.id)}
      >
        <div className={styles.checkbox}>
          {isSelected && <motion.div layoutId="check" className={styles.checkFill} />}
        </div>
        <div className={styles.serviceBody}>
          <div className={styles.serviceHeader}>
            <span className={styles.serviceLabel}>{s.label}</span>
            <span className={styles.servicePrice}>
              {s.min === s.max ? `${s.min} €` : `${s.min} – ${s.max} €`}
            </span>
          </div>
          {s.description && <p className={styles.serviceDesc}>{s.description}</p>}
          
          {/* Sub-options for Insegna */}
          {s.id === 'insegna' && isSelected && (
            <div className={styles.subOptions} onClick={(e) => e.stopPropagation()}>
              <label className={styles.subOption}>
                <input 
                  type="radio" 
                  name="insegna" 
                  checked={insegnaType === 'base'} 
                  onChange={() => setInsegnaType('base')}
                />
                <span>Pannello standard (+350–500€ prod.)</span>
              </label>
              <label className={styles.subOption}>
                <input 
                  type="radio" 
                  name="insegna" 
                  checked={insegnaType === 'lum'} 
                  onChange={() => setInsegnaType('lum')}
                />
                <span>Insegna luminosa LED (+650–900€ prod.)</span>
              </label>
            </div>
          )}

          {s.note && <span className={styles.serviceNote}>{s.note}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.step}>
      <h3 className={styles.title}>
        {haIdentity === false 
          ? "Il percorso identità è la base. Aggiungi tutto quello che vuoi declinare."
          : "Seleziona quello di cui hai bisogno."
        }
      </h3>

      {/* Identity block - always visible if starting from zero */}
      {haIdentity === false && (
        <div className={styles.categoryBlock}>
          <div className={styles.categoryHeader}>Identità</div>
          {renderService(CONFIG_SERVICES.find(s => s.id === 'identity_narrative')!)}
        </div>
      )}

      {CATEGORIES.map(cat => (
        <div key={cat.id} className={styles.categoryBlock}>
          <div className={styles.categoryHeader}>{cat.label}</div>
          <div className={styles.servicesGrid}>
            {CONFIG_SERVICES.filter(s => s.category === cat.id).map(renderService)}
          </div>
        </div>
      ))}
    </div>
  )
}
