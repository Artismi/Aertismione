'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './Navbar.module.css'
import { BRAND, NAV } from '@/config/content'
import { useConfiguratorStore } from '@/stores/useConfiguratorStore'

export function Navbar() {
  const navRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const openConfigurator = useConfiguratorStore((s) => s.openModal)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    // Aggiorna classe direttamente sul DOM — nessun re-render React
    const onScroll = () => {
      nav.classList.toggle(styles.scrolled, window.scrollY > 30)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav ref={navRef} className={styles.nav} aria-label="Navigazione principale">
      <div className={styles.inner}>
        <a href="#hero" className={styles.brand} aria-label="Torna in cima">
          <svg width="18" height="18" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
            <polygon points="50,0 60,40 100,50 60,60 50,100 40,60 0,50 40,40" />
          </svg>
          <img src="/artismi-logo.png" alt={BRAND.name} className={styles.brandLogo} />
        </a>

        <ul className={styles.links}>
          {NAV.links.map((l) => {
            // Se è il link al preventivo, lo rendiamo un bottone che apre il modal
            if (l.href === '#preventivo') {
              return (
                <li key={l.href}>
                  <button onClick={openConfigurator} className={styles.linkBtn}>
                    {l.label}
                  </button>
                </li>
              )
            }
            return (
              <li key={l.href}>
                <a href={l.href} className={styles.link}>{l.label}</a>
              </li>
            )
          })}
        </ul>

        <a href="#contatti" className={styles.cta}>{NAV.cta}</a>

        <button
          className={styles.hamburger}
          aria-label="Apri menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
      </div>

      {open && (
        <div className={styles.drawer} role="menu">
          {NAV.links.map((l) => {
             if (l.href === '#preventivo') {
              return (
                <button key={l.href} className={styles.drawerLink}
                  onClick={() => { setOpen(false); openConfigurator(); }} role="menuitem">
                  {l.label}
                </button>
              )
            }
            return (
              <a key={l.href} href={l.href} className={styles.drawerLink}
                onClick={() => setOpen(false)} role="menuitem">
                {l.label}
              </a>
            )
          })}
          <a href="#contatti" className={styles.cta} onClick={() => setOpen(false)}>
            {NAV.cta}
          </a>
        </div>
      )}
    </nav>
  )
}
