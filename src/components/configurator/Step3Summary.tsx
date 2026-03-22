'use client'

import { useState } from 'react'
import { useConfiguratorStore, CONFIG_SERVICES } from '@/stores/useConfiguratorStore'
import styles from './ConfigStep3.module.css'
import { motion } from 'framer-motion'

export function Step3Summary() {
  const { selectedServices, getTotals, insegnaType, reset } = useConfiguratorStore()
  const { oneOffMin, oneOffMax, monthlyMin, monthlyMax, hasCustom } = getTotals()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const generateSummaryText = () => {
    let text = "RIEPILOGO PROGETTO ARTISMI\n\n"
    selectedServices.forEach(id => {
      const s = CONFIG_SERVICES.find(srv => srv.id === id)
      if (!s) return
      let line = `- ${s.label}: ${s.min}–${s.max}€`
      if (id === 'insegna' && insegnaType) {
        line += ` (Tipo: ${insegnaType === 'base' ? 'Pannello' : 'Luminosa'})`
      }
      text += line + "\n"
    })
    text += `\nSTIMA TOTALE UNA TANTUM: ${oneOffMin} – ${oneOffMax} €`
    if (hasCustom) text += " + da definire"
    if (monthlyMin > 0) text += `\nSTIMA MENSILE: ${monthlyMin} – ${monthlyMax} €/mese`
    return text
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.append('preventivo_riepilogo', generateSummaryText())

    try {
      // Usiamo l'endpoint Formspree dedicato
      const response = await fetch('https://formspree.io/f/xvgzbgzl', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })

      if (response.ok) {
        setIsDone(true)
        reset() // Opzionale: puliamo lo store dopo l'invio
      }
    } catch (err) {
      console.error("Errore invio form", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDone) {
    return (
      <div className={styles.done}>
        <div className={styles.doneIcon}>✓</div>
        <h3 className={styles.doneTitle}>Ricevuto. Ti scrivo entro 24 ore.</h3>
        <p className={styles.doneText}>
          Ho salvato la tua configurazione. La studierò e ti contatterò per parlarne insieme.
        </p>
        <button className={styles.resetBtn} onClick={() => setIsDone(false)}>Inizia un nuovo progetto</button>
      </div>
    )
  }

  return (
    <div className={styles.step}>
      <h3 className={styles.title}>Ecco cosa hai costruito.</h3>
      <p className={styles.subtitle}>
        Questa è una stima di massima. Parliamone insieme per definire i dettagli.
      </p>

      <div className={styles.layout}>
        {/* Breakdown */}
        <div className={styles.breakdown}>
          <h4 className={styles.blockTitle}>Riepilogo voci</h4>
          <div className={styles.itemsList}>
            {selectedServices.map(id => {
              const s = CONFIG_SERVICES.find(srv => srv.id === id)
              if (!s) return null
              return (
                <div key={id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemLabel}>{s.label}</span>
                    <span className={styles.itemCategory}>{s.category}</span>
                  </div>
                  <span className={styles.itemRange}>
                    {s.min === s.max ? `${s.min}€` : `${s.min}–${s.max}€`}
                  </span>
                </div>
              )
            })}
          </div>
          
          <div className={styles.footerInfo}>
             I costi di stampa e materiali sono esclusi dalla stima salvo dove indicato.
          </div>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <h4 className={styles.blockTitle}>Parliamone.</h4>
          <p className={styles.formIntro}>
            Ti rispondo entro 24 ore. Capiamo se il progetto è fattibile e affiniamo la stima.
          </p>

          <div className={styles.field}>
            <label htmlFor="name">Nome *</label>
            <input type="text" id="name" name="name" required placeholder="Come ti chiami?" />
          </div>

          <div className={styles.field}>
            <label htmlFor="ref">Come mi hai trovato?</label>
            <select id="ref" name="source">
              <option value="instagram">Instagram</option>
              <option value="wordofmouth">Passaparola</option>
              <option value="google">Google</option>
              <option value="other">Altro</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="msg">Raccontami il tuo progetto in 2 righe *</label>
            <textarea 
              id="msg" 
              name="message" 
              required 
              maxLength={300}
              placeholder="Chi sei, cosa fai, cosa vuoi cambiare o costruire."
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Invio in corso...' : 'Mandami il progetto →'}
          </button>
          
          <p className={styles.privacy}>
            Inviando questo form accetti che i tuoi dati vengano usati per risponderti.
          </p>
        </form>
      </div>
    </div>
  )
}
