'use client'

import { motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import styles from './ContactSection.module.css'
import { CONTACT } from '@/config/content'

const vp = { once: true, margin: '0px 0px -150px 0px' }

export function ContactSection() {
  return (
    <div className={styles.section}>
      <div className="container">
        <div className={styles.grid}>

          {/* Left: Headline */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={vp}
            transition={{ duration: 0.8, ease: 'easeOut' as const }}
          >
            <span className="accent-bar" />
            <h2 className={styles.heading}>{CONTACT.heading}</h2>
            <p className={styles.lead}>{CONTACT.lead}</p>
            <p className={styles.note}>{CONTACT.note}</p>

            <div className={styles.directLinks}>
              {CONTACT.directLinks.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={styles.directBtn}
                  aria-label={l.aria}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                >
                  <span>{l.icon}</span> {l.label}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.form
            className={styles.form}
            action={`https://formspree.io/f/${CONTACT.formspreeId}`}
            method="POST"
            aria-label="Modulo di contatto"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={vp}
            transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.1 }}
          >
            {CONTACT.form.fields.map((f, i) => (
              <motion.div
                key={f.id}
                className={styles.field}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              >
                <label htmlFor={f.id} className={styles.label}>{f.label}</label>
                <input
                  id={f.id} name={f.name} type={f.type}
                  required={f.required}
                  className={styles.input}
                  placeholder={f.placeholder}
                />
              </motion.div>
            ))}

            <motion.div
              className={styles.field}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <label htmlFor="message" className={styles.label}>{CONTACT.form.messageLabel}</label>
              <textarea
                id="message" name="message" rows={5} required
                className={styles.textarea}
                placeholder={CONTACT.form.messagePlaceholder}
              />
            </motion.div>

            <motion.button
              type="submit"
              className={styles.submitBtn}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={vp}
              transition={{ duration: 0.4, delay: 0.55 }}
            >
              {CONTACT.form.submitLabel}
            </motion.button>
          </motion.form>

        </div>
      </div>
    </div>
  )
}
