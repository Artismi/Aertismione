'use client'

/**
 * PaperPlane — fogli sparsi su un piano.
 *
 * Usato sia dalle illustrazioni sia dalle stampe di Stamperia: le immagini
 * non stanno in una griglia ma appoggiate sul piano, ruotate, un po'
 * sovrapposte, con i bordi ondulati e sgualciti.
 *
 * Da desktop si possono afferrare e spostare. Da mobile il trascinamento e'
 * disattivato e il piano diventa una sequenza leggibile: la disposizione e'
 * decisa dal CSS, qui passiamo solo le variabili.
 *
 * Le posizioni sono pseudo-casuali ma deterministiche (stessa formula sul
 * server e sul client), altrimenti Next si lamenterebbe dell'hydration.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import styles from './PaperPlane.module.css'

export type PaperItem = {
  id: string
  kind: 'image' | 'video'
  src: string
  label?: string
  accent?: string
}

/** Rumore deterministico in [0,1): stesso risultato ovunque, nessun Math.random. */
function rand(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Bordo del foglio: poligono con i vertici leggermente sfalsati, mai due uguali. */
function paperClip(i: number): string {
  const per = 5
  const amp = 1.6
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
function PlaneVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const inView = useInView(ref, { margin: '0px 0px -60px 0px' })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (inView) el.play().catch(() => {})
    else el.pause()
  }, [inView])

  return <video ref={ref} src={src} className={styles.media} muted loop playsInline preload="metadata" />
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

  // Trascinamento solo da desktop con mouse: niente su touch e schermi piccoli.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)')
    const apply = () => setCanDrag(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Un trascinamento non deve valere come clic di apertura.
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleClick = useCallback(
    (item: PaperItem, index: number) => (e: React.MouseEvent) => {
      const start = down.current
      down.current = null
      if (start) {
        const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y)
        if (moved > 6) return
      }
      onOpen?.(item, index)
    },
    [onOpen],
  )

  const cols = size === 'large' ? 3 : 4
  const rowH = size === 'large' ? 340 : 250
  const rows = Math.ceil(items.length / cols)
  const planeH = rows * rowH + (size === 'large' ? 200 : 150)

  return (
    <>
      {/* Filtro che increspa i fogli: definito una volta sola, riusato da tutti. */}
      <svg className={styles.defs} aria-hidden="true" focusable="false">
        <filter id="paper-warp" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.021" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div
        ref={planeRef}
        className={styles.plane}
        data-size={size}
        style={{ '--plane-h': `${planeH}px` } as React.CSSProperties}
      >
        {items.map((item, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)

          // Partenza ordinata: fogli allineati e dritti. Il disordine lo fa
          // l'utente trascinandoli in giro, non noi.
          const left = ((col + 0.5) / cols) * 100
          const top = row * rowH + 40
          const rot = 0
          const width = size === 'large' ? 360 : 230

          return (
            <motion.div
              key={item.id}
              className={styles.sheet}
              data-front={front === item.id ? 'true' : undefined}
              style={{
                '--x': `${left}%`,
                '--y': `${top}px`,
                '--rot': `${rot}deg`,
                '--w': `${width}px`,
                '--accent': item.accent ?? '#E8A8BF',
                clipPath: paperClip(i),
                zIndex: front === item.id ? 400 : 10 + (i % 7),
              } as React.CSSProperties}
              drag={canDrag}
              dragConstraints={planeRef}
              dragElastic={0.12}
              dragMomentum={false}
              onDragStart={() => setFront(item.id)}
              whileDrag={{ scale: 1.05, rotate: (rand(i, 3) - 0.5) * 9 }}
              whileHover={canDrag ? { scale: 1.03, y: -4 } : undefined}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: (i % 6) * 0.05 }}
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
                <PlaneVideo src={item.src} />
              ) : (
                <Image
                  src={item.src}
                  alt={item.label ?? ''}
                  className={styles.media}
                  width={900}
                  height={1200}
                  sizes={size === 'large' ? '(max-width: 899px) 45vw, 420px' : '(max-width: 899px) 45vw, 280px'}
                  style={{ width: '100%', height: 'auto' }}
                />
              )}
              {/* piega di luce sulla carta */}
              <span className={styles.crease} aria-hidden="true" />
              {item.label && <span className={styles.label}>{item.label}</span>}
            </motion.div>
          )
        })}
      </div>
    </>
  )
}
