'use client'

/**
 * PaperPlane — fogli appoggiati su un piano.
 *
 * A riposo i fogli sono in ordine: li dispone una griglia CSS, quindi non si
 * sovrappongono mai e si adattano alla larghezza dello schermo. Da desktop si
 * possono afferrare e spostare: il foglio trascinato si stacca dalla griglia e
 * va dove lo lasci, sovrapponendosi agli altri. Il disordine lo fa l'utente.
 *
 * Nota: l'animazione d'ingresso non tocca x/y, altrimenti si scontra con il
 * trascinamento e i fogli tornano al loro posto da soli.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import imageSizes from '@/config/imageSizes.json'
import styles from './PaperPlane.module.css'

/** Proporzione vera del file (larghezza / altezza). */
function rapporto(src: string): number {
  const m = (imageSizes as unknown as Record<string, [number, number]>)[src]
  return m ? m[0] / m[1] : 1.3
}

export type PaperItem = {
  id: string
  kind: 'image' | 'video'
  src: string
  label?: string
  accent?: string
  /** Immagine molto alta e stretta da mostrare di lato, ruotata. */
  sdraiata?: boolean
}

/** Quanto e' larga, in riga, rispetto alla sua altezza: se il foglio e'
 *  sdraiato le proporzioni si rovesciano. */
function proporzioneInRiga(item: PaperItem): number {
  const r = rapporto(item.src)
  return item.sdraiata ? 1 / r : r
}

/** Rumore deterministico in [0,1): stesso risultato su server e client. */
function rand(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Bordo del foglio: poligono con i vertici leggermente sfalsati, mai due uguali. */
function paperClip(i: number): string {
  const per = 5
  const amp = 1.5
  const pts: string[] = []
  const push = (x: number, y: number, k: number) => {
    const jx = (rand(i, k) - 0.5) * amp
    const jy = (rand(i, k + 50) - 0.5) * amp
    pts.push(`${(x + jx).toFixed(2)}% ${(y + jy).toFixed(2)}%`)
  }
  for (let k = 0; k < per; k++) push((k / per) * 100, 0, k)
  for (let k = 0; k < per; k++) push(100, (k / per) * 100, k + 10)
  for (let k = 0; k < per; k++) push(100 - (k / per) * 100, 100, k + 20)
  for (let k = 0; k < per; k++) push(0, 100 - (k / per) * 100, k + 30)
  return `polygon(${pts.join(', ')})`
}

/** Video appoggiato sul piano: parte da solo quando entra nello schermo. */
function PlaneVideo({ src, ratio }: { src: string; ratio: number }) {
  const ref = useRef<HTMLVideoElement>(null)
  const inView = useInView(ref, { margin: '0px 0px -60px 0px' })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (inView) el.play().catch(() => {})
    else el.pause()
  }, [inView])

  return (
    <video
      ref={ref}
      src={src}
      className={styles.media}
      style={{ aspectRatio: String(ratio) }}
      muted
      loop
      playsInline
      preload="metadata"
      draggable={false}
    />
  )
}

export function PaperPlane({
  items,
  size = 'normal',
  onOpen,
}: {
  items: PaperItem[]
  /** "large" per le illustrazioni, "normal" per i fogli di stamperia. */
  size?: 'large' | 'normal'
  onOpen?: (item: PaperItem, index: number) => void
}) {
  const planeRef = useRef<HTMLDivElement>(null)
  const [canDrag, setCanDrag] = useState(false)
  const [front, setFront] = useState<string | null>(null)
  const down = useRef<{ x: number; y: number } | null>(null)

  // Trascinamento solo da desktop con mouse.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)')
    const apply = () => setCanDrag(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY }
  }, [])

  // Un trascinamento non deve valere come clic di apertura.
  const handleClick = useCallback(
    (item: PaperItem, index: number) => (e: React.MouseEvent) => {
      const start = down.current
      down.current = null
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return
      onOpen?.(item, index)
    },
    [onOpen],
  )

  return (
    <>
      {/* Filtro che increspa la carta: definito una volta, riusato da tutti i fogli. */}
      <svg className={styles.defs} aria-hidden="true" focusable="false">
        <filter id="paper-warp" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.022" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div ref={planeRef} className={styles.plane} data-size={size}>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            className={styles.sheet}
            data-kind={item.kind}
            data-sdraiata={item.sdraiata ? 'true' : undefined}
            data-front={front === item.id ? 'true' : undefined}
            /* La riga si riempie da sola: ogni foglio occupa una larghezza
               proporzionale alle sue proporzioni, cosi' tutti i fogli della
               stessa riga hanno la stessa altezza e i bordi sono allineati. */
            style={{
              '--accent': item.accent ?? '#E8A8BF',
              '--r': rapporto(item.src).toFixed(4),
              flexGrow: proporzioneInRiga(item),
              flexBasis: `calc(${proporzioneInRiga(item).toFixed(3)} * var(--riga))`,
              maxWidth: `calc(${proporzioneInRiga(item).toFixed(3)} * var(--riga) * 1.9)`,
              clipPath: paperClip(i),
              zIndex: front === item.id ? 400 : 1,
            } as React.CSSProperties}
            drag={canDrag}
            dragConstraints={planeRef}
            dragElastic={0.06}
            dragMomentum={false}
            onDragStart={() => setFront(item.id)}
            whileDrag={{ scale: 1.06, rotate: (rand(i, 3) - 0.5) * 10 }}
            whileHover={canDrag ? { scale: 1.02, rotate: (rand(i, 5) - 0.5) * 2.4 } : undefined}
            /* Solo opacita': toccare x/y qui romperebbe il trascinamento. */
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: (i % 6) * 0.05 }}
            onPointerDown={handlePointerDown}
            onClick={handleClick(item, i)}
            role={onOpen ? 'button' : undefined}
            tabIndex={onOpen ? 0 : undefined}
            onKeyDown={(e) => {
              if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onOpen(item, i)
              }
            }}
          >
            {item.kind === 'video' ? (
              <PlaneVideo src={item.src} ratio={rapporto(item.src)} />
            ) : (
              <Image
                src={item.src}
                alt={item.label ?? ''}
                className={styles.media}
                width={900}
                height={1200}
                sizes={size === 'large' ? '(max-width: 899px) 60vw, 520px' : '(max-width: 899px) 46vw, 340px'}
                draggable={false}
              />
            )}
            {item.label && <span className={styles.label}>{item.label}</span>}
          </motion.div>
        ))}
      </div>
    </>
  )
}
