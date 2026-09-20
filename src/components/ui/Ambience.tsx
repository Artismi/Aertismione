'use client'

/**
 * Ambience — la musica del sito.
 *
 * Due regole che vengono da come funzionano i browser e da come funziona
 * l'educazione:
 * 1. Nessun browser lascia partire l'audio da solo. Serve per forza un gesto
 *    dell'utente, quindi la musica parte solo se qualcuno la accende.
 * 2. Chi apre un sito non si aspetta di essere suonato addosso. Il comando e'
 *    piccolo, sempre raggiungibile, e la scelta viene ricordata per la sessione.
 *
 * Se il file della traccia non c'e', il comando non compare affatto: cosi' il
 * sito non mostra un bottone che non suona.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/stores/useStore'
import styles from './Ambience.module.css'

/** Traccia di casa. Basta sostituire il file per cambiare musica. */
const DEFAULT_TRACK = '/audio/lounge.mp3'
const ON_KEY = 'artismi:musica'
const VOLUME = 0.32
const FADE_MS = 900

export function Ambience() {
  const track = useStore((s) => s.ambienceTrack) ?? DEFAULT_TRACK
  const audioRef = useRef<HTMLAudioElement>(null)
  const fadeRef = useRef<number | null>(null)

  const [playing, setPlaying] = useState(false)
  const [available, setAvailable] = useState(true)

  /** Sfuma il volume invece di tagliare di netto. */
  const fadeTo = useCallback((target: number, onDone?: () => void) => {
    const el = audioRef.current
    if (!el) return
    if (fadeRef.current) window.clearInterval(fadeRef.current)

    const step = 30
    const delta = (target - el.volume) / (FADE_MS / step)

    fadeRef.current = window.setInterval(() => {
      const next = el.volume + delta
      if ((delta > 0 && next >= target) || (delta < 0 && next <= target)) {
        el.volume = target
        if (fadeRef.current) window.clearInterval(fadeRef.current)
        fadeRef.current = null
        onDone?.()
      } else {
        el.volume = Math.min(1, Math.max(0, next))
      }
    }, step)
  }, [])

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el) return

    if (playing) {
      fadeTo(0, () => el.pause())
      setPlaying(false)
      try { sessionStorage.removeItem(ON_KEY) } catch { /* ignora */ }
      return
    }

    el.volume = 0
    el.play()
      .then(() => {
        setPlaying(true)
        fadeTo(VOLUME)
        try { sessionStorage.setItem(ON_KEY, '1') } catch { /* ignora */ }
      })
      .catch(() => setAvailable(false))
  }, [playing, fadeTo])

  // Cambio pagina progetto: si cambia traccia senza spegnere la musica.
  useEffect(() => {
    const el = audioRef.current
    if (!el || !playing) return
    if (el.getAttribute('src') === track) return

    fadeTo(0, () => {
      el.setAttribute('src', track)
      el.load()
      el.play().then(() => fadeTo(VOLUME)).catch(() => { /* traccia assente */ })
    })
  }, [track, playing, fadeTo])

  // Se la musica era accesa, riprende al cambio pagina (il gesto c'e' gia' stato).
  useEffect(() => {
    let acceso = false
    try { acceso = Boolean(sessionStorage.getItem(ON_KEY)) } catch { /* ignora */ }
    if (!acceso) return

    const el = audioRef.current
    if (!el) return
    el.volume = 0
    el.play().then(() => { setPlaying(true); fadeTo(VOLUME) }).catch(() => { /* serve un gesto */ })
  }, [fadeTo])

  useEffect(() => () => { if (fadeRef.current) window.clearInterval(fadeRef.current) }, [])

  if (!available) return null

  return (
    <>
      <audio
        ref={audioRef}
        src={track}
        loop
        preload="none"
        onError={() => setAvailable(false)}
      />

      <button
        type="button"
        className={styles.toggle}
        data-playing={playing ? 'true' : undefined}
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Spegni la musica' : 'Accendi la musica'}
        title={playing ? 'Spegni la musica' : 'Accendi la musica'}
      >
        <span className={styles.bars} aria-hidden="true">
          <i /><i /><i /><i />
        </span>
        <span className={styles.label}>{playing ? 'musica' : 'silenzio'}</span>
      </button>
    </>
  )
}
