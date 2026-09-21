'use client'

/**
 * IllustrationsGallery — vista d'insieme delle illustrazioni.
 *
 * Prima si sfogliava una pagina intera per volta con le frecce, e l'immagine
 * non si vedeva nemmeno subito. Ora si vedono tutte insieme: si clicca
 * un'illustrazione e si apre il suo dettaglio, con le immagini e il testo.
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { PaperPlane, type PaperItem } from '@/components/ui/PaperPlane'
import styles from './IllustrationsGallery.module.css'

type SubProject = {
  id: string
  title: string
  category: string
  tagline?: string
  accent?: string
  mainImage?: string
  gallery?: string[]
  sdraiata?: boolean
  sections?: { label: string; text: string }[]
  context?: string
  problem?: string
  solution?: string
  result?: string
  pdfs?: { label: string; url: string; pages?: string[] }[]
}

const LEGACY_LABELS = {
  context:  'Contesto',
  problem:  'Il Problema',
  solution: 'La Soluzione',
  result:   'Il Risultato',
} as const

/** Le sezioni del progetto se ci sono, altrimenti lo schema storico senza caselle vuote. */
function blocksOf(p: SubProject) {
  if (p.sections?.length) return p.sections
  return ([
    { label: LEGACY_LABELS.context,  text: p.context  },
    { label: LEGACY_LABELS.problem,  text: p.problem  },
    { label: LEGACY_LABELS.solution, text: p.solution },
    { label: LEGACY_LABELS.result,   text: p.result   },
  ].filter((b) => b.text) as { label: string; text: string }[])
}

/** Tutte le immagini del progetto, copertina inclusa e senza doppioni. */
function imagesOf(p: SubProject): string[] {
  const all = [p.mainImage, ...(p.gallery ?? []), ...(p.pdfs?.flatMap((d) => d.pages ?? []) ?? [])]
  return all.filter((src, i, arr): src is string => Boolean(src) && arr.indexOf(src) === i)
}

export function IllustrationsGallery({ project }: { project: any }) {
  const subProjects: SubProject[] = project.subProjects ?? []
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [imgIdx, setImgIdx] = useState(0)

  const close = useCallback(() => setOpenIdx(null), [])

  const open = useCallback((i: number) => {
    setOpenIdx(i)
    setImgIdx(0)
  }, [])

  const goTo = useCallback((i: number) => {
    setOpenIdx(((i % subProjects.length) + subProjects.length) % subProjects.length)
    setImgIdx(0)
  }, [subProjects.length])

  // Tastiera: Esc chiude, frecce cambiano illustrazione
  useEffect(() => {
    if (openIdx === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     close()
      if (e.key === 'ArrowRight') goTo(openIdx + 1)
      if (e.key === 'ArrowLeft')  goTo(openIdx - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIdx, close, goTo])

  // Blocca lo scroll della pagina mentre il dettaglio e' aperto
  useEffect(() => {
    if (openIdx === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [openIdx])

  if (!subProjects.length) return null

  const current = openIdx !== null ? subProjects[openIdx] : null
  const currentImages = current ? imagesOf(current) : []

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <Link href="/#portfolio" className={styles.back}>← Portfolio</Link>
        <h1 className={styles.title}>{project.title}</h1>
        {project.tagline && <p className={styles.tagline}>{project.tagline}</p>}
        <span className={styles.count}>
          {subProjects.length} lavori — clicca per leggere
        </span>
      </header>

      <PaperPlane
        size="large"
        items={subProjects
          .map((p): PaperItem => ({
            id: p.id,
            kind: 'image',
            src: imagesOf(p)[0] ?? '',
            label: p.title,
            accent: p.accent,
            sdraiata: p.sdraiata,
          }))
          .filter((it) => it.src)}
        onOpen={(item) => {
          const i = subProjects.findIndex((p) => p.id === item.id)
          if (i >= 0) open(i)
        }}
      />

      <AnimatePresence>
        {current && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
          >
            <motion.article
              className={styles.detail}
              style={{ '--accent': current.accent ?? '#E8A8BF' } as React.CSSProperties}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.close} onClick={close} aria-label="Chiudi">×</button>

              {currentImages.length > 0 && (
                <div className={styles.detailMedia}>
                  <Image
                    key={currentImages[imgIdx]}
                    src={currentImages[imgIdx]}
                    alt={current.title}
                    fill
                    sizes="(max-width: 1000px) 100vw, 900px"
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
              )}

              {currentImages.length > 1 && (
                <div className={styles.thumbs}>
                  {currentImages.map((src, j) => (
                    <button
                      key={src}
                      className={styles.thumb}
                      data-active={j === imgIdx ? 'true' : undefined}
                      onClick={() => setImgIdx(j)}
                      aria-label={`Immagine ${j + 1}`}
                    >
                      <Image src={src} alt="" fill sizes="80px" style={{ objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.detailText}>
                <span className={styles.detailCategory}>{current.category}</span>
                <h2 className={styles.detailTitle}>{current.title}</h2>
                {current.tagline && <p className={styles.detailTagline}>{current.tagline}</p>}

                {blocksOf(current).map((b) => (
                  <div key={b.label} className={styles.block}>
                    <span className={styles.blockLabel}>{b.label}</span>
                    <p className={styles.blockText}>{b.text}</p>
                  </div>
                ))}

                {current.pdfs?.map((d) => (
                  <a
                    key={d.url}
                    href={d.url}
                    className={styles.download}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    {d.label} — scarica il PDF ↓
                  </a>
                ))}
              </div>

              <nav className={styles.detailNav}>
                <button onClick={() => goTo(openIdx! - 1)}>← {subProjects[(openIdx! - 1 + subProjects.length) % subProjects.length].title}</button>
                <button onClick={() => goTo(openIdx! + 1)}>{subProjects[(openIdx! + 1) % subProjects.length].title} →</button>
              </nav>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
