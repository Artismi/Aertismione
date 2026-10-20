'use client'

/**
 * GameConsole — la console a conchiglia di Porto Vecchio, sul tavolo dei Progetti.
 *
 * Plastica viola trasparente che si accende, fatta solo di CSS 3D: niente
 * modelli da scaricare. Due scatole: la base con i tasti e il coperchio con lo
 * schermo, incernierate sul bordo dietro.
 *
 * Chiusa sul tavolo; al passaggio si solleva e si accende; presa in mano
 * (`open`) il coperchio si alza e lo schermo si accende sul gioco. Da li'
 * PortfolioSection allarga lo schermo a tutto schermo (vedi GameOverlay).
 */

import { forwardRef } from 'react'
import styles from './GameConsole.module.css'

type Props = {
  id: string
  open: boolean
  title: string
  hint: string
  screen: string
  onClick: () => void
}

/** Le sei facce di una scatola: base w×d, alta h (assi del CSS 3D: z verso l'alto) */
function Box({ className, children }: { className: string; children?: React.ReactNode }) {
  return (
    <div className={`${styles.box} ${className}`}>
      <div className={`${styles.face} ${styles.faceBottom}`} />
      <div className={`${styles.face} ${styles.faceBack}`} />
      <div className={`${styles.face} ${styles.faceFront}`} />
      <div className={`${styles.face} ${styles.faceLeft}`} />
      <div className={`${styles.face} ${styles.faceRight}`} />
      <div className={`${styles.face} ${styles.faceTop}`} />
      {children}
    </div>
  )
}

export const GameConsole = forwardRef<HTMLDivElement, Props>(function GameConsole(
  { id, open, title, hint, screen, onClick },
  screenRef,
) {
  return (
    <button
      id={id}
      type="button"
      className={styles.console}
      data-open={open ? 'true' : undefined}
      onClick={onClick}
      aria-label={`${title} — ${hint}`}
    >
      <span className={styles.stage} aria-hidden="true">
        <span className={styles.scene}>
          {/* La base: dentro, sulla faccia di sopra, croce, tasti e altoparlante */}
          <Box className={styles.base}>
            <div className={styles.controls}>
              <svg viewBox="0 0 220 200">
                <g className={styles.dpad}>
                  <rect x="38" y="62" width="18" height="54" rx="3" />
                  <rect x="20" y="80" width="54" height="18" rx="3" />
                </g>
                <circle className={styles.btn} cx="168" cy="78" r="13" />
                <circle className={styles.btn} cx="194" cy="62" r="13" />
                <rect className={styles.small} x="78" y="150" width="22" height="8" rx="4" />
                <rect className={styles.small} x="120" y="150" width="22" height="8" rx="4" />
                <g className={styles.speaker}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <circle key={i} cx={98 + (i % 4) * 8} cy={92 + Math.floor(i / 4) * 8} r="1.8" />
                  ))}
                </g>
                <circle className={styles.power} cx="160" cy="122" r="3.5" />
              </svg>
            </div>
          </Box>

          {/* Il coperchio: si alza sulla cerniera dietro */}
          <div className={styles.lid}>
            <Box className={styles.lidBox}>
              <div className={styles.lidInside}>
                <div ref={screenRef} className={styles.screen}>
                  <img src={screen} alt="" loading="lazy" decoding="async" />
                  {/* Schermata del titolo, come quella del gioco: neon rosa */}
                  <span className={styles.screenTitle}>{title}</span>
                  <span className={styles.screenStart}>Premi start</span>
                </div>
                <span className={styles.brand}>{title}</span>
              </div>
              <div className={styles.logo} />
            </Box>
          </div>
        </span>
      </span>

      <span className={styles.label}>{title}</span>
      <span className={styles.hint}>{hint}</span>
    </button>
  )
})
