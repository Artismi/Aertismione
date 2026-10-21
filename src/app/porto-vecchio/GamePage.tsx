'use client'

/**
 * Porto Vecchio, come pagina del sito (per chi arriva da un link diretto):
 * lo stesso Game Boy del banco, gia' aperto. «Esci» riporta al tavolo.
 * Qui dietro non gira niente: niente 3D della home, niente scroll morbido.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GameBoy, gameWarmable } from '@/components/ui/GameBoy'

export function GamePage() {
  const router = useRouter()
  // il riquadro nasce solo nel browser: arrivato gia' nell'html, finiva di caricarsi
  // prima che la pagina potesse accorgersene
  const [mounted, setMounted] = useState(false)
  const [warm, setWarm] = useState(false)
  useEffect(() => { setWarm(gameWarmable()); setMounted(true) }, [])

  // si torna al tavolo da cui si e' partiti; arrivando da un link, alla home
  function back() {
    if (document.referrer.startsWith(window.location.origin)) router.back()
    else router.push('/#portfolio')
  }

  return <main>{mounted && <GameBoy page from={null} onClose={back} warm={warm} />}</main>
}
