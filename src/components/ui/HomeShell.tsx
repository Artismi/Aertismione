'use client'

/**
 * HomeShell — la home che resta viva mentre si guarda un lavoro.
 *
 * Aprendo un lavoro dalla home la sua pagina arriva sopra (rotta intercettata in
 * app/@modal): la home non viene smontata, si nasconde. Il mondo 3D si ferma
 * (store.away) e al ritorno e' gia' pronto, alla stessa altezza di prima: niente
 * caricamento, niente shader da ricompilare. Aprendo un lavoro da un link diretto
 * la home non c'e' e la pagina e' quella normale.
 */

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type Lenis from 'lenis'
import { useStore } from '@/stores/useStore'

const lenisOf = () => (window as unknown as { __lenis?: Lenis }).__lenis

export function HomeShell({ children }: { children: React.ReactNode }) {
  const away = usePathname() !== '/'
  // l'altezza della home: aggiornata solo mentre la home si vede
  const kept = useRef(0)
  const wasAway = useRef(false)

  useEffect(() => {
    const keep = () => { if (!useStore.getState().away) kept.current = window.scrollY }
    keep()
    window.addEventListener('scroll', keep, { passive: true })
    return () => window.removeEventListener('scroll', keep)
  }, [])

  useLayoutEffect(() => {
    useStore.getState().setAway(away)
    if (away) {
      // la pagina del lavoro comincia dall'alto. Lo scroll morbido resta acceso: fermo,
      // Lenis blocca lo scroll di tutta la pagina (overflow: clip sull'html) e del
      // lavoro si vedeva solo la prima schermata
      window.scrollTo(0, 0)
      lenisOf()?.scrollTo(0, { immediate: true, force: true })
    } else if (wasAway.current) {
      // di nuovo a casa: dove si era lasciata
      const y = kept.current
      window.scrollTo(0, y)
      lenisOf()?.scrollTo(y, { immediate: true, force: true })
      useStore.getState().setScrollY(y)
    }
    wasAway.current = away
  }, [away])

  // nascosta ma ancora impaginata, ferma all'altezza a cui la si e' lasciata: le misure
  // della pagina (le sezioni, il riquadro del banco) restano quelle, il mondo non si scompone
  return (
    <div
      aria-hidden={away || undefined}
      inert={away || undefined}
      style={away ? { position: 'fixed', top: -kept.current, left: 0, right: 0, visibility: 'hidden', pointerEvents: 'none', zIndex: -2 } : undefined}
    >
      {children}
    </div>
  )
}
