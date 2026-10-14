'use client'

/**
 * ArViewer — il logo in 3D, e da telefono nella stanza.
 *
 * Usa <model-viewer> di Google, che sceglie da solo la strada giusta:
 * Scene Viewer su Android, Quick Look su iPhone (il file USDZ lo genera lui
 * dal GLB), WebXR dove c'e'. Se nessuna e' disponibile — un computer, un
 * telefono senza ARCore — al posto del bottone compare il QR per aprire la
 * pagina dal telefono.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './ar.module.css'

type ModelViewerElement = HTMLElement & { canActivateAR: boolean }

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        alt?: string
        ar?: boolean
        'ar-modes'?: string
        'ar-placement'?: string
        'camera-controls'?: boolean
        'auto-rotate'?: boolean
        'shadow-intensity'?: string
        'environment-image'?: string
        exposure?: string
        'camera-orbit'?: string
        'interaction-prompt'?: string
        loading?: string
      }
    }
  }
}

export function ArViewer({ src, alt, button, hint, qr }: {
  src: string
  alt: string
  button: string
  hint: string
  qr: ReactNode
}) {
  const ref = useRef<ModelViewerElement>(null)
  /** null finche' il modello non e' caricato: non sappiamo ancora se l'AR c'e'. */
  const [canAR, setCanAR] = useState<boolean | null>(null)

  useEffect(() => {
    // Il componente tocca window: si carica solo nel browser.
    import('@google/model-viewer')

    const el = ref.current
    if (!el) return
    const onLoad = () => setCanAR(el.canActivateAR)
    el.addEventListener('load', onLoad)
    return () => el.removeEventListener('load', onLoad)
  }, [])

  return (
    <>
      <div className={styles.stage}>
        <model-viewer
          ref={ref}
          className={styles.viewer}
          src={src}
          alt={alt}
          ar
          ar-modes="scene-viewer quick-look webxr"
          ar-placement="floor"
          camera-controls
          auto-rotate
          camera-orbit="0deg 80deg auto"
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1.1"
          interaction-prompt="none"
        >
          <button slot="ar-button" className={styles.arButton}>{button}</button>
        </model-viewer>
      </div>

      <p className={styles.hint}>{hint}</p>

      {canAR === false && qr}
    </>
  )
}
