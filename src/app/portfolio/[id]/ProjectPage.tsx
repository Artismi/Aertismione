'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import styles from './ProjectPage.module.css'

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Project = {
  id: string
  title: string
  category: string
  tagline: string
  context: string
  problem: string
  solution: string
  result: string
  accent: string
  mainImage?: string
  gallery?: string[]
  videos?: string[]
  marquee?: string
  panoramaStrip?: string
  pdfs?: { label: string; url: string }[]
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

  /* IMAGE HERO — full bleed with parallax + overlay */
  if (project.mainImage && !isIllustration) {
    return (
      <div className={styles.heroImage} ref={ref} data-illustration={isIllustration}>
        <motion.div className={styles.heroImageParallax} style={{ y }}>
          <Image
            src={project.mainImage}
            alt={project.title}
            fill
            style={{ objectFit: 'cover' }}
            priority
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
        </motion.div>
      </div>
    )
  }

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
  const blocks = [
    { key: 'context',  text: project.context  },
    { key: 'problem',  text: project.problem  },
    { key: 'solution', text: project.solution },
    { key: 'result',   text: project.result   },
  ] as const

  /* CASE STUDY — 4 cards in a horizontal grid */
  if (layout === 'case_study') {
    return (
      <div className={styles.narrativeCaseStudy} data-illustration={isIllustration}>
        {blocks.map((b, i) => (
          <FadeUp key={b.key} delay={i * 0.07} className={styles.narrativeCard}>
            <span className={styles.narrativeCardNum}>0{i + 1}</span>
            <span className={styles.narrativeLabel}>
              {NARRATIVE_LABELS[b.key]}
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
            <span className={styles.narrativeLabel}>{NARRATIVE_LABELS[b.key]}</span>
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
              <span className={styles.narrativeLabel}>{NARRATIVE_LABELS[b.key]}</span>
              <p className={styles.narrativeText}>{b.text}</p>
            </FadeUp>
          ))}
        </div>
        <div className={styles.narrativeSplitCol}>
          {blocks.slice(2).map((b, i) => (
            <FadeUp key={b.key} delay={i * 0.08 + 0.12} className={styles.narrativeBlock}>
              <span className={styles.narrativeLabel}>{NARRATIVE_LABELS[b.key]}</span>
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
          <span className={styles.narrativeLabel}>{NARRATIVE_LABELS[b.key]}</span>
          <p className={styles.narrativeText}>{b.text}</p>
        </FadeUp>
      ))}
    </div>
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

  /* ILLUSTRATION — full width stacked images avoiding Next Image absolute positioning */
  if (isIllustration) {
    if (project.mainImage && !all.includes(project.mainImage)) {
      all = [project.mainImage, ...all]
    }
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

  /* ARCHIVE — scattered pile */
  if (layout === 'archive') {
    return (
      <div className={styles.galleryArchive} data-illustration={isIllustration}>
        {all.map((img, i) => {
          const seed = i * 137
          const rot = ((seed % 9) - 4) * 1.2
          const delay = (i % 8) * 0.04
          return (
            <motion.button
              key={i}
              className={styles.galleryArchiveItem}
              style={{ '--rot': `${rot}deg` } as React.CSSProperties}
              initial={{ opacity: 0, rotate: rot - 4, scale: 0.9 }}
              whileInView={{ opacity: 1, rotate: rot, scale: 1 }}
              whileHover={{ scale: 1.04, rotate: rot * 0.5, zIndex: 10 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
              viewport={{ once: true, margin: '-40px' }}
              onClick={() => onLightbox(img, all)}
            >
              <Image src={img} alt="" fill style={{ objectFit: isIllustration ? 'contain' : 'cover' }} />
            </motion.button>
          )
        })}
      </div>
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

import dynamic from 'next/dynamic'
const PdfViewer = dynamic(
  () => import('@/components/ui/PdfViewer').then((mod) => mod.PdfViewer),
  { ssr: false, loading: () => <p style={{fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-muted)'}}>Caricamento viewer PDF...</p> }
)

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

/* ─── PDF block ──────────────────────────────────────────────────────────── */

function PdfBlock({ pdfs }: { pdfs: { label: string; url: string }[] }) {
  return (
    <div className={styles.pdfSection}>
      <FadeUp>
        <h3 className={styles.pdfHeading}>Documenti</h3>
      </FadeUp>
      <div className={styles.pdfInlineGrid}>
        {pdfs.map((pdf, i) => (
          <FadeUp key={i} delay={i * 0.07}>
            <PdfViewer url={pdf.url} label={pdf.label} />
          </FadeUp>
        ))}
      </div>
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

      {/* Narrative */}
      <section className={styles.narrativeSection}>
        <NarrativeGrid project={project} layout={layout} isIllustration={isIllustration} />
      </section>

      {/* Panorama Strip */}
      {project.panoramaStrip && <PanoramaBlock url={project.panoramaStrip} />}

      {/* Mixed Media: Marquee (Vertical) + Videos */}
      {(project.marquee || project.videos?.length) && (
        <section className={styles.mixedMediaSection}>
          {project.marquee && <MarqueeBlock url={project.marquee} />}
          <VideoBlock videos={project.videos || []} />
        </section>
      )}

      {/* Media: gallery + PDFs */}
      {(project.mainImage || project.gallery?.length || project.pdfs?.length) && (
        <section className={styles.mediaSection} data-illustration={isIllustration}>
          <GalleryBlock project={project} layout={layout} onLightbox={openLightbox} isIllustration={isIllustration} />
          {project.pdfs?.length ? <PdfBlock pdfs={project.pdfs} /> : null}
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
