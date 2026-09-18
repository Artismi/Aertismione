'use client'

/**
 * SectionOverlay — pannello slide-in laterale aperto dagli hotspot 3D.
 *
 * Varianti:
 *   servizi   → entra da sinistra  (la toolbox è a sinistra)
 *   about     → entra da destra
 *   contatti  → entra da destra
 *
 * Il contenuto è estratto dai componenti sezione esistenti montati come figli.
 */

import { useStore } from '@/stores/useStore'
import { SECTION_TO_EXIT } from '@/lib/cinematicTransitions'
import styles from './SectionOverlay.module.css'
import { AboutSection } from '@/components/sections/AboutSection'
import { ServicesNewSection } from '@/components/sections/ServicesNewSection'
import { ContactSection } from '@/components/sections/ContactSection'

type PanelId = 'about' | 'servizi' | 'contatti'

const PANEL_CONTENT: Record<PanelId, React.ReactNode> = {
  about:    <AboutSection />,
  servizi:  <ServicesNewSection />,
  contatti: <ContactSection />,
}

const PANEL_SIDE: Record<PanelId, 'left' | 'right'> = {
  servizi:  'left',
  about:    'right',
  contatti: 'right',
}

export function SectionOverlay() {
  const activeOverlay       = useStore(s => s.activeOverlay)
  const setCinematicPlaying = useStore(s => s.setCinematicPlaying)
  const setActiveOverlay    = useStore(s => s.setActiveOverlay)

  // Gestisce solo about / servizi / contatti (non portfolio / lab)
  if (!activeOverlay || !['about', 'servizi', 'contatti'].includes(activeOverlay)) return null
  const id      = activeOverlay as PanelId
  const side    = PANEL_SIDE[id]
  const exitSeq = SECTION_TO_EXIT[id]

  const handleClose = () => {
    setActiveOverlay(null)
    if (exitSeq) setCinematicPlaying(exitSeq)
  }

  return (
    <aside
      className={`${styles.panel} ${styles[side]}`}
      role="dialog"
      aria-label={id}
    >
      {/* Close button */}
      <button className={styles.closeBtn} onClick={handleClose} aria-label="Chiudi">
        <span>✕</span>
      </button>

      {/* Back to scene */}
      <button className={styles.backBtn} onClick={handleClose}>
        ← Torna alla scena
      </button>

      <div className={styles.content}>
        {PANEL_CONTENT[id]}
      </div>
    </aside>
  )
}
