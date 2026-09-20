'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { useStore } from '@/stores/useStore'
import { PaperPlane, type PaperItem } from '@/components/ui/PaperPlane'
import styles from './ProjectPage.module.css'

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Project = {
  id: string
  title: string
  category: string
  tagline: string
  /** Sezioni libere: ogni progetto racconta quello che ha da raccontare. */
  sections?: { label: string; text: string }[]
  /** Schema storico a quattro caselle, usato dai progetti che non hanno "sections". */
  context?: string
  problem?: string
  solution?: string
  result?: string
  accent: string
  mainImage?: string
  coverVideo?: string
  coverPoster?: string
  gallery?: string[]
  videos?: string[]
  marquee?: string
  panoramaStrip?: string
  pdfs?: { label: string; url: string; pages?: string[] }[]
  /** Collegamenti esterni: dove il progetto e' finito davvero. */
  links?: { label: string; url: string; note?: string }[]
  /** Traccia audio propria del progetto, se ne ha una. */
  audio?: string
}

type Layout =
  | 'case_study'
  | 'split_light'
  | 'split_dark'
  | 'panoramic'
  | 'dual'
  | 'centered'
  | 'organic'
  | 'archive'

/* ─── Layout map ─────────────────────────────────────────────────────────── */

const LAYOUT_MAP: Record<string, Layout> = {
  bicicleria:           'case_study',
  'spazio-comune':      'split_light',
  mulini:               'panoramic',
  'torino-invisibile':  'split_dark',
  punk:                 'dual',
  ciclomeccanica:       'split_light',
  alice:                'centered',
  'ecosistema-boreale': 'organic',
  'ridi-piangi-balli':  'centered',
  sperimentazione:      'archive',
}

const NARRATIVE_LABELS = {
  context:  'Contesto',
  problem:  'Il Problema',
  solution: 'La Soluzione',
  result:   'Il Risultato',
}

/* ─── Animation helpers ──────────────────────────────────────────────────── */

function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </motion.div>
  )
}

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut', delay }}
      viewport={{ once: true, margin: '-40px' }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Hero variants ──────────────────────────────────────────────────────── */

function HeroBlock({
  project,
  layout,
  num,
  isIllustration,
}: {
  project: Project
  layout: Layout
  num: string
  isIllustration: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  /* DUAL — dark background, two images flanking the title */
  if (layout === 'dual') {
    return (
      <div className={styles.heroDual} ref={ref} data-illustration={isIllustration}>
        <motion.div
          className={styles.heroDualTitle}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ opacity }}
        >
          <span className={styles.heroNum}>{num}</span>
          <h1 className={styles.heroTitleDual}>{project.title}</h1>
          <p className={styles.heroCategoryDual}>{project.category}</p>
        </motion.div>
        {project.gallery?.slice(0, 2).map((img, i) => (
          <motion.div
            key={i}
            className={styles.heroDualImg}
            data-side={i === 0 ? 'left' : 'right'}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.1 }}
          >
            <Image src={img} alt="" fill style={{ objectFit: 'cover' }} />
          </motion.div>
        ))}
      </div>
    )
  }

  /* VIDEO HERO — copertina in movimento, stesso trattamento dell'hero immagine */
  if (project.coverVideo && !isIllustration) {
    return (
      <div className={styles.heroImage} ref={ref} data-illustration={isIllustration}>
        <motion.div className={styles.heroImageParallax} style={{ y }}>
          <video
            src={project.coverVideo}
            poster={project.coverPoster || project.mainImage}
            className={styles.heroCoverVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </motion.div>
        <div className={styles.heroImageOverlay} />
        <motion.div
          className={styles.heroImageContent}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ opacity }}
        >
          <span className={styles.heroNum}>{num}</span>
          <h1 className={styles.heroTitle}>{project.title}</h1>
          <p className={styles.heroCategory}>{project.category}</p>
        </motion.div>
      </div>
    )
  }

  /* Niente hero-immagine: la copertina ripeteva una foto che si rivede
     subito sotto in galleria e allontanava il soggetto. Restano l'hero video
     (dove il video E' il lavoro) e quello tipografico. */

  /* TEXT HERO — no image, editorial typographic */
  return (
    <div className={styles.heroText} ref={ref} data-illustration={isIllustration}>
      <motion.span
        className={styles.heroNumWatermark}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.1 }}
        style={{ color: project.accent }}
      >
        {num}
      </motion.span>
      <motion.div
        className={styles.heroTextContent}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        style={{ opacity }}
      >
        <h1 className={styles.heroTitle}>{project.title}</h1>
        <p className={styles.heroCategory}>{project.category}</p>
      </motion.div>
    </div>
  )
}

/* ─── Narrative grid variants ────────────────────────────────────────────── */

function NarrativeGrid({
  project,
  layout,
  isIllustration,
}: {
  project: Project
  layout: Layout
  isIllustration: boolean
}) {
  /**
   * La struttura della pagina segue il contenuto, non il contrario:
   * se il progetto definisce le sue sezioni si usano quelle (quante sono,
   * con i titoli che servono), altrimenti si ricade sullo schema storico
   * Contesto / Problema / Soluzione / Risultato.
   */
  const blocks = project.sections?.length
    ? project.sections.map((s, i) => ({ key: `s${i}`, label: s.label, text: s.text }))
    : ([
        { key: 'context',  label: NARRATIVE_LABELS.context,  text: project.context  },
        { key: 'problem',  label: NARRATIVE_LABELS.problem,  text: project.problem  },
        { key: 'solution', label: NARRATIVE_LABELS.solution, text: project.solution },
        { key: 'result',   label: NARRATIVE_LABELS.result,   text: project.result   },
      ].filter((b) => b.text) as { key: string; label: string; text: string }[])

  /* CASE STUDY — 4 cards in a horizontal grid */
  if (layout === 'case_study') {
    return (
      <div className={styles.narrativeCaseStudy} data-illustration={isIllustration}>
        {blocks.map((b, i) => (
          <FadeUp key={b.key} delay={i * 0.07} className={styles.narrativeCard}>
            <span className={styles.narrativeCardNum}>0{i + 1}</span>
            <span className={styles.narrativeLabel}>
              {b.label}
            </span>
            <p className={styles.narrativeText}>{b.text}</p>
          </FadeUp>
        ))}
      </div>
    )
  }

  /* PANORAMIC — big pull quotes, staggered columns */
  if (layout === 'panoramic') {
    return (
      <div className={styles.narrativePanoramic} data-illustration={isIllustration}>
        {blocks.map((b, i) => (
          <FadeUp key={b.key} delay={i * 0.1} className={styles.narrativePanoramicBlock}>
            <span className={styles.narrativeLabel}>{b.label}</span>
            <p className={styles.narrativeTextLarge}>{b.text}</p>
          </FadeUp>
        ))}
      </div>
    )
  }

  /* SPLIT (dark/light) — 2 columns */
  if (layout === 'split_dark' || layout === 'split_light') {
    return (
      <div className={styles.narrativeSplit} data-illustration={isIllustration}>
        <div className={styles.narrativeSplitCol}>
          {blocks.slice(0, 2).map((b, i) => (
            <FadeUp key={b.key} delay={i * 0.08} className={styles.narrativeBlock}>
              <span className={styles.narrativeLabel}>{b.label}</span>
              <p className={styles.narrativeText}>{b.text}</p>
            </FadeUp>
          ))}
        </div>
        <div className={styles.narrativeSplitCol}>
          {blocks.slice(2).map((b, i) => (
            <FadeUp key={b.key} delay={i * 0.08 + 0.12} className={styles.narrativeBlock}>
              <span className={styles.narrativeLabel}>{b.label}</span>
              <p className={styles.narrativeText}>{b.text}</p>
            </FadeUp>
          ))}
        </div>
      </div>
    )
  }

  /* DEFAULT — linear single column */
  return (
    <div className={styles.narrativeLinear} data-illustration={isIllustration}>
      {blocks.map((b, i) => (
        <FadeUp key={b.key} delay={i * 0.08} className={styles.narrativeBlock}>
          <span className={styles.narrativeLabel}>{b.label}</span>
          <p className={styles.narrativeText}>{b.text}</p>
        </FadeUp>
      ))}
    </div>
  )
}

/* ─── Archivio: immagini + video mescolati ───────────────────────────────── */

type ArchiveItem = { kind: 'image' | 'video'; src: string }

/**
 * Distribuisce i video tra le immagini a intervalli regolari, mantenendo
 * l'ordine relativo di entrambi. Con 22 fogli e 5 video ne esce circa
 * un video ogni 4 fogli.
 */
function interleaveMedia(images: string[], videos: string[]): ArchiveItem[] {
  if (!videos.length) return images.map((src) => ({ kind: 'image' as const, src }))

  const out: ArchiveItem[] = []
  const step = images.length / (videos.length + 1)
  let next = step
  let v = 0

  images.forEach((src, i) => {
    out.push({ kind: 'image', src })
    if (v < videos.length && i + 1 >= Math.round(next)) {
      out.push({ kind: 'video', src: videos[v] })
      v += 1
      next += step
    }
  })
  while (v < videos.length) {
    out.push({ kind: 'video', src: videos[v] })
    v += 1
  }
  return out
}

/** Video dell'archivio: parte da solo quando entra nello schermo, muto e in loop. */
function ArchiveVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const isInView = useInView(ref, { margin: '0px 0px -80px 0px' })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (isInView) el.play().catch(() => {})
    else el.pause()
  }, [isInView])

  return (
    <video
      ref={ref}
      src={src}
      className={styles.galleryArchiveVideo}
      muted
      loop
      playsInline
      preload="metadata"
    />
  )
}

/* ─── Gallery variants ───────────────────────────────────────────────────── */

function GalleryBlock({
  project,
  layout,
  onLightbox,
  isIllustration,
}: {
  project: Project
  layout: Layout
  onLightbox: (src: string, all: string[]) => void
  isIllustration: boolean
}) {
  let all = project.gallery || []

  // La copertina non ha piu' un hero dedicato: se non e' gia' in galleria
  // entra qui, altrimenti sparirebbe dalla pagina (bicicleria, torino-invisibile).
  if (project.mainImage && !all.includes(project.mainImage)) {
    all = [project.mainImage, ...all]
  }

  /* ILLUSTRATION — full width stacked images avoiding Next Image absolute positioning */
  if (isIllustration) {
    if (!all.length) return null

    return (
      <div className={styles.galleryIllustration}>
        {all.map((img, i) => (
          <FadeUp key={i} delay={i * 0.1} className={styles.galleryIllustrationItem}>
            <button onClick={() => onLightbox(img, all)}>
              <img src={img} alt="" loading="lazy" />
            </button>
          </FadeUp>
        ))}
      </div>
    )
  }

  if (!all.length) return null

  /* ARCHIVE — fogli sparsi su un piano, trascinabili da desktop */
  if (layout === 'archive') {
    const items = interleaveMedia(all, project.videos || [])
    return (
      <PaperPlane
        items={items.map((it, i): PaperItem => ({
          id: `${it.kind}-${i}`,
          kind: it.kind,
          src: it.src,
          accent: project.accent,
        }))}
        onOpen={(item) => {
          if (item.kind === 'image') onLightbox(item.src, all)
        }}
      />
    )
  }

  /* DUAL — hide gallery (images used in hero already) */
  if (layout === 'dual') {
    const rest = all.slice(2)
    if (!rest.length) return null
    return (
      <div className={styles.galleryStrip} data-illustration={isIllustration}>
        {rest.map((img, i) => (
          <FadeIn key={i} delay={i * 0.05} className={styles.galleryStripItem}>
            <button onClick={() => onLightbox(img, rest)}>
              <Image src={img} alt="" fill style={{ objectFit: isIllustration ? 'contain' : 'cover' }} />
            </button>
          </FadeIn>
        ))}
      </div>
    )
  }

  /* ORGANIC — overlapping freeform */
  if (layout === 'organic') {
    return (
      <div className={styles.galleryOrganic} data-illustration={isIllustration}>
        {all.map((img, i) => (
          <FadeUp key={i} delay={i * 0.06} className={styles.galleryOrganicItem} >
            <button onClick={() => onLightbox(img, all)}>
              <Image src={img} alt="" fill style={{ objectFit: isIllustration ? 'contain' : 'cover' }} />
            </button>
          </FadeUp>
        ))}
      </div>
    )
  }

  /* DEFAULT masonry grid */
  return (
    <div className={styles.galleryMasonry} data-illustration={isIllustration}>
      {all.map((img, i) => (
        <FadeIn key={i} delay={i * 0.04} className={styles.galleryMasonryItem} data-size={i === 0 ? 'large' : i % 5 === 3 ? 'wide' : 'normal'}>
          <button onClick={() => onLightbox(img, all)}>
            <Image src={img} alt="" fill style={{ objectFit: isIllustration ? 'contain' : 'cover' }} />
          </button>
        </FadeIn>
      ))}
    </div>
  )
}

/* ─── Video block ────────────────────────────────────────────────────────── */

function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const isInView = useInView(ref, { margin: '0px 0px -100px 0px' })

  useEffect(() => {
    if (isInView) {
      ref.current?.play().catch(() => {})
    } else {
      ref.current?.pause()
    }
  }, [isInView])

  return (
    <FadeUp delay={0.1}>
      <video
        ref={ref}
        src={src}
        className={styles.videoPlayer}
        muted
        loop
        playsInline
        controls
        preload="metadata"
      />
    </FadeUp>
  )
}

function VideoBlock({ videos }: { videos: string[] }) {
  if (!videos?.length) return null
  return (
    <div className={styles.videoWrapper}>
      {videos.map((vid, i) => (
        <VideoPlayer key={i} src={vid} />
      ))}
    </div>
  )
}

/* ─── Marquee block (Vertical) ───────────────────────────────────────────── */

function MarqueeBlock({ url }: { url: string }) {
  if (!url) return null
  return (
    <div className={styles.verticalMarqueeWindow}>
      <div className={styles.verticalMarqueeTrack}>
        <img src={url} alt="Stickers" />
        <img src={url} alt="Stickers" />
      </div>
    </div>
  )
}

/* ─── Panorama Block (Horizontal Strip) ──────────────────────────────────── */

function PanoramaBlock({ url }: { url?: string }) {
  if (!url) return null
  return (
    <div className={styles.panoramaSection}>
      <FadeUp delay={0.1}>
        <div className={styles.panoramaContainer}>
          <img src={url} alt="Striscia Panoramica" className={styles.panoramaImg} loading="lazy" />
        </div>
      </FadeUp>
    </div>
  )
}

/**
 * Nel portfolio le parole chiave sono in grassetto dentro il testo corrente:
 * e' la firma tipografica di Andrea. Qui si scrivono con **due asterischi**.
 */
function conGrassetto(testo: string) {
  return testo.split(/(\*\*[^*]+\*\*)/g).map((pezzo, i) =>
    pezzo.startsWith('**') && pezzo.endsWith('**')
      ? <strong key={i}>{pezzo.slice(2, -2)}</strong>
      : <span key={i}>{pezzo}</span>,
  )
}

/* ─── Impaginazione a movimenti ──────────────────────────────────────────── */

/** Le sezioni del progetto, saltando le caselle vuote dello schema storico. */
function blocksOf(project: Project): { label: string; text: string }[] {
  if (project.sections?.length) return project.sections
  return ([
    { label: NARRATIVE_LABELS.context,  text: project.context  },
    { label: NARRATIVE_LABELS.problem,  text: project.problem  },
    { label: NARRATIVE_LABELS.solution, text: project.solution },
    { label: NARRATIVE_LABELS.result,   text: project.result   },
  ].filter((b) => b.text) as { label: string; text: string }[])
}

/** Tutte le immagini del progetto, copertina inclusa, senza doppioni. */
function imagesOf(project: Project): string[] {
  const all = [project.mainImage, ...(project.gallery ?? [])]
  return all.filter((src, i, arr): src is string => Boolean(src) && arr.indexOf(src) === i)
}

/**
 * NarrativeFlow — testo e immagini si alternano invece di stare in due
 * mucchi separati. Ogni sezione e' un "movimento": la colonna di testo da
 * una parte, l'immagine che le corrisponde dall'altra, sfalsata in verticale.
 * A meta' racconto un'immagine a tutta larghezza rompe il ritmo, e quello che
 * resta chiude in una griglia irregolare.
 */
function NarrativeFlow({
  project,
  onLightbox,
}: {
  project: Project
  onLightbox: (src: string, all: string[]) => void
}) {
  const blocks = blocksOf(project)
  const images = imagesOf(project)

  // una immagine per movimento; la prima dopo il secondo va a tutta larghezza
  const perMovement = images.slice(0, blocks.length)
  const bleed = images[blocks.length]
  const dopoBleed = images.slice(blocks.length + (bleed ? 1 : 0))

  // Il guizzo, preso dal portfolio: una seconda immagine piu' piccola
  // appoggiata sull'angolo della prima, come una stampa posata sopra un'altra.
  // Una sola, sul secondo movimento, altrimenti diventa disordine.
  const sovrapposta = dopoBleed[0]
  const rest = sovrapposta ? dopoBleed.slice(1) : dopoBleed
  const movimentoConSovrapposta = blocks.length > 1 ? 1 : 0
  const bleedAfter = Math.min(1, blocks.length - 1)

  return (
    <div className={styles.flow}>
      {blocks.map((b, i) => (
        <div key={b.label}>
          <section className={styles.movement} data-side={i % 2 === 0 ? 'left' : 'right'}>
            {/* filetto di apertura: numero a sinistra, titolo a destra, come in
                un catalogo. E' la struttura a tenere insieme la pagina. */}
            <div className={styles.movementRule}>
              <span className={styles.movementIndex}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.movementLabel}>{b.label}</span>
            </div>

            <FadeUp className={styles.movementText} delay={0.05}>
              <p className={styles.movementBody}>{conGrassetto(b.text)}</p>
            </FadeUp>

            {perMovement[i] && (
              <FadeUp className={styles.movementFigure} delay={0.12}>
                <button onClick={() => onLightbox(perMovement[i], images)}>
                  <Image
                    src={perMovement[i]}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 100vw, 46vw"
                    style={{ objectFit: 'cover' }}
                  />
                </button>

                {sovrapposta && i === movimentoConSovrapposta && (
                  <span className={styles.sovrapposta}>
                    <button onClick={() => onLightbox(sovrapposta, images)}>
                      <Image
                        src={sovrapposta}
                        alt=""
                        fill
                        sizes="(max-width: 900px) 40vw, 200px"
                        style={{ objectFit: 'cover' }}
                      />
                    </button>
                  </span>
                )}
              </FadeUp>
            )}
          </section>

          {bleed && i === bleedAfter && (
            <FadeIn className={styles.bleed}>
              <button onClick={() => onLightbox(bleed, images)}>
                <Image src={bleed} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} />
              </button>
            </FadeIn>
          )}
        </div>
      ))}

      {rest.length > 0 && (
        <div className={styles.rest}>
          {rest.map((src, i) => (
            <FadeIn key={src} delay={(i % 4) * 0.05} className={styles.restItem}>
              <button onClick={() => onLightbox(src, images)}>
                <Image src={src} alt="" fill sizes="(max-width: 900px) 50vw, 32vw" style={{ objectFit: 'cover' }} />
              </button>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Collegamenti esterni ───────────────────────────────────────────────── */

function LinksBlock({ links }: { links: { label: string; url: string; note?: string }[] }) {
  return (
    <div className={styles.linksSection}>
      <FadeUp>
        <h3 className={styles.linksHeading}>Approfondimenti</h3>
      </FadeUp>
      <ul className={styles.linksList}>
        {links.map((l, i) => (
          <FadeUp key={l.url} delay={i * 0.06}>
            <li className={styles.linkItem}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className={styles.linkAnchor}>
                <span className={styles.linkLabel}>{l.label}</span>
                <span className={styles.linkArrow} aria-hidden="true">↗</span>
              </a>
              {l.note && <span className={styles.linkNote}>{l.note}</span>}
            </li>
          </FadeUp>
        ))}
      </ul>
    </div>
  )
}

/* ─── PDF block ──────────────────────────────────────────────────────────── */

/**
 * Documenti — le pagine dei PDF sono gia' convertite in immagini a monte:
 * si vedono sempre, su qualsiasi browser, senza visualizzatori esterni.
 * Il PDF originale resta scaricabile per chi lo vuole.
 */
function PdfBlock({
  pdfs,
  onLightbox,
}: {
  pdfs: { label: string; url: string; pages?: string[] }[]
  onLightbox: (src: string, all: string[]) => void
}) {
  return (
    <div className={styles.pdfSection}>
      <FadeUp>
        <h3 className={styles.pdfHeading}>Documenti</h3>
      </FadeUp>

      {pdfs.map((pdf, i) => {
        const pages = pdf.pages ?? []
        return (
          <FadeUp key={i} delay={i * 0.07} className={styles.pdfDoc}>
            <div className={styles.pdfDocHead}>
              <span className={styles.pdfDocLabel}>{pdf.label}</span>
              <a
                href={pdf.url}
                className={styles.pdfDownload}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                Scarica il PDF ↓
              </a>
            </div>

            {pages.length > 0 ? (
              <div className={styles.pdfPages} data-single={pages.length === 1 ? 'true' : undefined}>
                {pages.map((src, j) => (
                  <button
                    key={j}
                    className={styles.pdfPage}
                    onClick={() => onLightbox(src, pages)}
                    aria-label={`${pdf.label} — pagina ${j + 1}`}
                  >
                    <img src={src} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            ) : null}
          </FadeUp>
        )
      })}
    </div>
  )
}

/* ─── Lightbox ───────────────────────────────────────────────────────────── */

function Lightbox({
  src,
  all,
  onClose,
  onNav,
  isIllustration,
}: {
  src: string
  all: string[]
  onClose: () => void
  onNav: (src: string) => void
  isIllustration: boolean
}) {
  const idx = all.indexOf(src)
  return (
    <motion.div
      className={styles.lightbox}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.lightboxInner}
        initial={{ scale: 0.94 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.94 }}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={src} alt="" className={styles.lightboxImg} style={{ objectFit: isIllustration ? 'contain' : 'cover' }} />
        {all.length > 1 && (
          <>
            <button
              className={styles.lightboxPrev}
              onClick={() => idx > 0 && onNav(all[idx - 1])}
              disabled={idx === 0}
            >
              ←
            </button>
            <button
              className={styles.lightboxNext}
              onClick={() => idx < all.length - 1 && onNav(all[idx + 1])}
              disabled={idx === all.length - 1}
            >
              →
            </button>
            <span className={styles.lightboxCounter}>
              {idx + 1} / {all.length}
            </span>
          </>
        )}
      </motion.div>
      <button className={styles.lightboxClose} onClick={onClose}>
        ×
      </button>
    </motion.div>
  )
}

/* ─── Scroll progress bar ────────────────────────────────────────────────── */

function ProgressBar() {
  const { scrollYProgress } = useScroll()
  return (
    <motion.div
      className={styles.progressBar}
      style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
    />
  )
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export function ProjectPage({
  project,
  prev,
  next,
  index,
  total,
}: {
  project: Project
  prev: Project | null
  next: Project | null
  index: number
  total: number
}) {
  // Determine layout and tone based on category
  let layout: Layout = LAYOUT_MAP[project.id] ?? 'split_light'
  // Ogni progetto puo' avere la sua musica: si imposta entrando e si lascia uscendo.
  const setAmbienceTrack = useStore((st) => st.setAmbienceTrack)
  useEffect(() => {
    setAmbienceTrack(project.audio ?? null)
    return () => setAmbienceTrack(null)
  }, [project.audio, setAmbienceTrack])

  const useFlow =
    layout !== 'archive' &&
    imagesOf(project).length > 0 &&
    !(project.category?.toLowerCase()?.includes('illustrazione') && !project.sections?.length)

  const isIllustration = project.category?.toLowerCase()?.includes('illustrazione') ||
                         project.category?.toLowerCase()?.includes('grafica') || false

  if (isIllustration) {
    layout = 'centered'
  }

  const isDark = layout === 'split_dark' || layout === 'dual'
  const num = String(index + 1).padStart(2, '0')

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxAll, setLightboxAll] = useState<string[]>([])

  function openLightbox(src: string, all: string[]) {
    setLightboxSrc(src)
    setLightboxAll(all)
  }

  return (
    <div
      className={styles.root}
      data-layout={layout}
      data-dark={isDark ? '' : undefined}
      style={{ '--accent': project.accent } as React.CSSProperties}
    >
      {/* Scroll progress */}
      <ProgressBar />

      {/* Fixed nav */}
      <nav className={styles.nav}>
        <Link href="/#portfolio" className={styles.back}>
          <motion.span
            className={styles.backArrow}
            whileHover={{ x: -4 }}
            transition={{ duration: 0.2 }}
          >
            ←
          </motion.span>
          <span>Portfolio</span>
        </Link>
        <span className={styles.navTitle}>{project.title}</span>
        <span className={styles.counter}>
          {num} / {String(total).padStart(2, '0')}
        </span>
      </nav>

      {/* Hero */}
      <HeroBlock project={project} layout={layout} num={num} isIllustration={isIllustration} />

      {/* Intro strip */}
      <section className={styles.intro} data-illustration={isIllustration}>
        <FadeUp delay={0}>
          <span className={styles.category}>{project.category}</span>
        </FadeUp>
        <FadeUp delay={0.08}>
          <p className={styles.tagline}>{project.tagline}</p>
        </FadeUp>
        <motion.div
          className={styles.accentRule}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          viewport={{ once: true }}
          style={{ originX: 0 }}
        />
      </section>

      {/* Racconto: a movimenti quando ci sono immagini da alternare al testo,
          altrimenti lo schema storico. Stamperia e le illustrazioni hanno
          impaginazioni loro. */}
      {useFlow ? (
        <NarrativeFlow project={project} onLightbox={openLightbox} />
      ) : (
        <section className={styles.narrativeSection}>
          <NarrativeGrid project={project} layout={layout} isIllustration={isIllustration} />
        </section>
      )}

      {/* Panorama Strip */}
      {project.panoramaStrip && <PanoramaBlock url={project.panoramaStrip} />}

      {/* Mixed Media: Marquee (Vertical) + Videos */}
      {(project.marquee || (layout !== 'archive' && project.videos?.length)) && (
        <section className={styles.mixedMediaSection}>
          {project.marquee && <MarqueeBlock url={project.marquee} />}
          {layout !== 'archive' && <VideoBlock videos={project.videos || []} />}
        </section>
      )}

      {/* Media: gallery + PDFs */}
      {((!useFlow && (project.mainImage || project.gallery?.length)) ||
        project.pdfs?.length || project.links?.length) && (
        <section className={styles.mediaSection} data-illustration={isIllustration}>
          {!useFlow && (
            <GalleryBlock project={project} layout={layout} onLightbox={openLightbox} isIllustration={isIllustration} />
          )}
          {project.pdfs?.length ? <PdfBlock pdfs={project.pdfs} onLightbox={openLightbox} /> : null}
          {project.links?.length ? <LinksBlock links={project.links} /> : null}
        </section>
      )}

      {/* Footer navigation */}
      <footer className={styles.footerNav}>
        {prev ? (
          <Link href={`/portfolio/${prev.id}`} className={styles.navLink} data-dir="prev">
            <span className={styles.navDir}>← Precedente</span>
            <span className={styles.navLinkTitle}>{prev.title}</span>
          </Link>
        ) : (
          <div />
        )}
        <Link href="/#portfolio" className={styles.navHome}>
          ◉ Portfolio
        </Link>
        {next ? (
          <Link href={`/portfolio/${next.id}`} className={styles.navLink} data-dir="next">
            <span className={styles.navDir}>Successivo →</span>
            <span className={styles.navLinkTitle}>{next.title}</span>
          </Link>
        ) : (
          <div />
        )}
      </footer>

      {/* Lightbox */}
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          all={lightboxAll}
          isIllustration={isIllustration}
          onClose={() => setLightboxSrc(null)}
          onNav={setLightboxSrc}
        />
      )}
    </div>
  )
}
