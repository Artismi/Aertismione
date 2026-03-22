'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './ProjectModal.module.css'
import { useConfiguratorStore } from '@/stores/useConfiguratorStore'
import { FotoBook } from './FotoBook'
import { MapViewer } from './MapViewer'
import { BookReader } from './BookReader'

const LightboxCtx = React.createContext<(src: string, all: string[]) => void>(() => {})

interface Project {
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
  pdfs?: { label: string; url: string }[]
}

interface Props {
  project: Project | null
  allProjects: Project[]
  onClose: () => void
  onNavigate: (p: Project) => void
}

type Layout = 'split_dark' | 'split_light' | 'panoramic' | 'dual' | 'centered' | 'organic' | 'archive' | 'case_study'

const LAYOUT_MAP: Record<string, Layout> = {
  'bicicleria':         'case_study',
  'spazio-comune':      'split_light',
  'mulini':             'panoramic',
  'torino-invisibile':  'split_dark',
  'punk':               'dual',
  'ciclomeccanica':     'split_light',
  'alice':              'centered',
  'ecosistema-boreale': 'organic',
  'ridi-piangi-balli':  'centered',
  'sperimentazione':    'archive',
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

const ease = 'easeOut' as const
const vp = { once: true, margin: '-60px' }

function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={vp}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

function SlideIn({ children, delay = 0, from = 'left', className }: { children: React.ReactNode; delay?: number; from?: 'left' | 'right'; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: from === 'left' ? -48 : 48 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={vp}
      transition={{ duration: 0.75, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Blocco narrativo riutilizzabile ─────────────────────────────── */

function NarrativeRows({ project, light }: { project: Project; light?: boolean }) {
  const rows = [
    { k: 'Contesto',  v: project.context  },
    { k: 'Problema',  v: project.problem  },
    { k: 'Soluzione', v: project.solution },
    { k: 'Risultato', v: project.result   },
  ]
  return (
    <div className={`${styles.narrativeRows} ${light ? styles.narrativeRowsLight : ''}`}>
      {rows.map(({ k, v }, i) => (
        <motion.div
          key={k}
          className={styles.narrativeRow}
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={vp}
          transition={{ duration: 0.6, ease, delay: i * 0.1 }}
        >
          <span className={styles.narrativeKey}>{k}</span>
          <p className={styles.narrativeVal}>{v}</p>
        </motion.div>
      ))}
      
      {/* PDF Links */}
      {project.pdfs && project.pdfs.length > 0 && (
        <div className={styles.pdfLinks}>
          {project.pdfs.map((pdf, i) => (
            <motion.a 
              key={i}
              href={pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.pdfLink}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              📄 {pdf.label}
            </motion.a>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Immagine singola — zoomabile (MapViewer) ──────────────────────── */

function NaturalImg({ src, className, delay = 0, accent = '#C4622D', mapMode = false }: {
  src: string; className?: string; delay?: number; accent?: string; mapMode?: boolean
}) {
  const openLightbox = React.useContext(LightboxCtx)
  if (mapMode) return <MapViewer src={src} accent={accent} onImageClick={s => openLightbox(s, [s])} />
  return (
    <motion.img
      src={src}
      alt=""
      className={`${styles.naturalImg} ${className ?? ''}`}
      style={{ cursor: 'zoom-in' }}
      onClick={() => openLightbox(src, [src])}
      initial={{ opacity: 0, scale: 1.02 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={vp}
      transition={{ duration: 0.7, ease, delay }}
    />
  )
}

/* ─── Gallery → FotoBook cinematico ─────────────────────────────────── */

function NaturalGallery({ images, accent }: { images: string[]; accent: string }) {
  const openLightbox = React.useContext(LightboxCtx)
  if (!images.length) return null
  return <FotoBook images={images} accent={accent} onImageClick={openLightbox} />
}

/* ─── PDF → BookReader editoriale ───────────────────────────────────── */

function PdfEmbed({ url, title, tall = false, accent = '#C4622D' }: {
  url: string; title: string; tall?: boolean; accent?: string
}) {
  return <BookReader url={url} title={title} accent={accent} tall={tall} />
}

function PdfScrollH({ url, title, accent = '#5B8EA6' }: {
  url: string; title: string; accent?: string
}) {
  return <BookReader url={url} title={title} accent={accent} horizontal />
}

/* ─── Slot immagine animato ───────────────────────────────────────── */

function ImgSlot({
  accent,
  label,
  src,
  className,
  delay = 0,
  tall = false,
}: {
  accent: string
  label?: string
  src?: string
  className?: string
  delay?: number
  tall?: boolean
}) {
  return (
    <motion.div
      className={`${styles.imgSlot} ${tall ? styles.imgSlotTall : ''} ${className ?? ''}`}
      style={{ '--slot-accent': accent } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={vp}
      transition={{ duration: 0.8, ease, delay }}
    >
      {src ? (
        <img src={src} alt={label || ''} className={styles.imgSlotContent} />
      ) : (
        <div className={styles.imgSlotNoise} />
      )}
      {label && <span className={styles.imgSlotLabel}>{label}</span>}
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT SPLIT DARK
   — Grande hero con titolo, poi colonne testo / gallery
   ══════════════════════════════════════════════════════════════════ */

function LayoutSplitDark({ project }: { project: Project }) {
  const isCyber = project.id === 'torino-invisibile'
  const bg = isCyber ? '#07070f' : '#1A1A1A'
  const fg = isCyber ? project.accent : '#F5F0E8'

  return (
    <div className={styles.layoutSplitDark} style={{ background: bg }}>

      {/* Hero fullbleed */}
      <div className={styles.sdHero} style={{ '--accent': project.accent } as React.CSSProperties}>
        <motion.span
          className={styles.sdCategory}
          style={{ color: project.accent }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
        >
          {project.category}
        </motion.span>
        <motion.h2
          className={styles.sdTitle}
          style={{ color: fg }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease, delay: 0.2 }}
        >
          {project.title}
        </motion.h2>
        <motion.p
          className={styles.sdTagline}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.45 }}
        >
          {project.tagline}
        </motion.p>
        <motion.div
          className={styles.sdAccentLine}
          style={{ background: project.accent }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease, delay: 0.6 }}
        />
      </div>

      {/* Gallery completa — tutte le scene a proporzioni naturali */}
      {(project.mainImage || (project.gallery && project.gallery.length > 0)) && (
        <NaturalGallery
          images={[
            ...(project.mainImage ? [project.mainImage] : []),
            ...(project.gallery ?? []),
          ]}
          accent={project.accent}
        />
      )}

      {/* Narrativa */}
      <div className={styles.sdNarrativeBlock}>
        <NarrativeRows project={project} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT SPLIT LIGHT
   ══════════════════════════════════════════════════════════════════ */

function LayoutSplitLight({ project }: { project: Project }) {
  const isPoster = project.id === 'ciclomeccanica'

  return (
    <div className={styles.layoutSplitLight}>
      {/* Hero titolo su sfondo chiaro */}
      <div className={styles.slHero} style={{ '--accent': project.accent } as React.CSSProperties}>
        <motion.span
          className={styles.slCategory}
          style={{ color: project.accent }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
        >
          {project.category}
        </motion.span>
        <motion.h2
          className={styles.slTitle}
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
        >
          {project.title}
        </motion.h2>
      </div>

      {isPoster ? (
        /* Ciclomeccanica — flyer PDF embedded + narrativa */
        <div className={styles.slPosterBody}>
          <div className={styles.slPosterPdf}>
            {project.pdfs && project.pdfs.length > 0 && (
              <PdfEmbed url={project.pdfs[0].url} title={project.pdfs[0].label} tall accent={project.accent} />
            )}
          </div>
          <div className={styles.slPosterRight}>
            <FadeUp delay={0.1}>
              <p className={styles.slTagline}>{project.tagline}</p>
            </FadeUp>
            <NarrativeRows project={project} light />
            {project.gallery && project.gallery.length > 0 && (
              <NaturalGallery images={project.gallery} accent={project.accent} />
            )}
          </div>
        </div>
      ) : (
        /* Spazio Comune — gallery hero + narrativa */
        <div className={styles.slSpazioBody}>
          {project.mainImage && <NaturalImg src={project.mainImage} delay={0.15} />}
          {project.gallery && project.gallery.length > 0 && (
            <NaturalGallery images={project.gallery} accent={project.accent} />
          )}
          <div className={styles.slSpazioBelow}>
            <SlideIn from="left" className={styles.slSpazioText}>
              <p className={styles.slTagline}>{project.tagline}</p>
              <NarrativeRows project={project} light />
            </SlideIn>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT PANORAMIC — Mulini
   ══════════════════════════════════════════════════════════════════ */

function LayoutPanoramic({ project }: { project: Project }) {
  return (
    <div className={styles.layoutPanoramic} style={{ '--accent': project.accent } as React.CSSProperties}>
      <div className={styles.panHeader}>
        <motion.span
          className={styles.panCategory}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
        >
          {project.category}
        </motion.span>
        <motion.h2
          className={styles.panTitle}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease, delay: 0.2 }}
        >
          {project.title}
        </motion.h2>
        <motion.p
          className={styles.panSub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.6, ease, delay: 0.4 }}
        >
          Tesi di laurea — Politecnico di Torino 2022
        </motion.p>
      </div>

      {/* Striscia illustrata — PDF orizzontale, scorrevole come una pergamena */}
      {project.pdfs && project.pdfs.find(p => p.url.includes('strip')) && (
        <PdfScrollH
          url={project.pdfs.find(p => p.url.includes('strip'))!.url}
          title="Striscia Illustrata 6m"
          accent={project.accent}
        />
      )}

      {/* Gallery di immagini (se presenti) */}
      {project.gallery && project.gallery.length > 0 && (
        <NaturalGallery images={project.gallery} accent={project.accent} />
      )}

      {/* Tesi e altri PDF — embed verticale */}
      {project.pdfs && project.pdfs.filter(p => !p.url.includes('strip')).map((pdf, i) => (
        <FadeUp key={i} delay={i * 0.1} className={styles.panPdfBlock}>
          <PdfEmbed url={pdf.url} title={pdf.label} accent={project.accent} />
        </FadeUp>
      ))}

      <FadeUp delay={0.15} className={styles.panNarrative}>
        <NarrativeRows project={project} />
      </FadeUp>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT DUAL — Punk isn't dead
   ══════════════════════════════════════════════════════════════════ */

function LayoutDual({ project }: { project: Project }) {
  const openLightbox = React.useContext(LightboxCtx)
  const gallery = project.gallery ?? []
  // Misuro le proporzioni reali (width/height) di ogni immagine al caricamento.
  // Il flex di ogni slot diventa uguale al suo aspect-ratio → entrambe le immagini
  // occupano la stessa altezza e larghezza proporzionale alla loro forma reale.
  const [ratios, setRatios] = useState<Record<number, number>>({})
  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>, i: number) => {
    const img = e.currentTarget
    if (img.naturalWidth && img.naturalHeight) {
      setRatios(r => ({ ...r, [i]: img.naturalWidth / img.naturalHeight }))
    }
  }

  return (
    <div className={styles.layoutDual}>
      {/* Hero giallo */}
      <div className={styles.dualHero}>
        <motion.div
          className={styles.dualNoiseLayer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        <motion.span
          className={styles.dualSuper}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
        >
          Bonobolabo × Mad One
        </motion.span>
        <motion.h2
          className={styles.dualTitle}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          PUNK<br />ISN'T<br />DEAD
        </motion.h2>
      </div>

      {/* Spread: altezza fissa, flex proporzionale alle dimensioni reali di ogni immagine.
          Dopo il caricamento ogni slot si allarga/stringe per abbracciare la forma naturale
          dell'immagine — nessun residuo giallo, nessun ritaglio, visione d'insieme perfetta. */}
      {gallery.length > 0 && (
        <div className={styles.dualSpread}>
          {gallery.map((src, i) => (
            <motion.div
              key={i}
              className={styles.dualSpreadSlot}
              style={{ flex: ratios[i] ?? 1 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.25 + i * 0.14 }}
              onClick={() => openLightbox(src, gallery)}
            >
              <img
                src={src}
                alt=""
                onLoad={e => handleImgLoad(e, i)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <FadeUp delay={0.1} className={styles.dualNarrative}>
        <NarrativeRows project={project} />
      </FadeUp>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT CENTERED — Alice / Ridi Piangi Balli
   ══════════════════════════════════════════════════════════════════ */

function LayoutCentered({ project }: { project: Project }) {
  const isRidi = project.id === 'ridi-piangi-balli'

  return (
    <div className={styles.layoutCentered} style={{ '--accent': project.accent } as React.CSSProperties}>
      {/* Titolo animato */}
      <div className={styles.centeredHero}>
        {isRidi ? (
          <div className={styles.ridiTitle}>
            {['Ridi', 'Piangi', 'Balli'].map((w, i) => (
              <motion.span
                key={w}
                className={styles.ridiWord}
                style={{ color: i === 0 ? '#E8A8BF' : i === 1 ? '#1A1A1A' : project.accent }}
                initial={{ opacity: 0, y: 60, rotate: i % 2 === 0 ? -4 : 4 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.18 }}
              >
                {w}
              </motion.span>
            ))}
          </div>
        ) : (
          <>
            <motion.span
              className={styles.centeredCategory}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.1 }}
            >
              {project.category}
            </motion.span>
            <motion.h2
              className={styles.centeredTitle}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease, delay: 0.2 }}
            >
              {project.title}
            </motion.h2>
          </>
        )}
      </div>

      {/* Immagine principale — MapViewer per esplorare l'illustrazione */}
      {project.mainImage && (
        <NaturalImg src={project.mainImage} accent={project.accent} mapMode delay={0.2} />
      )}

      {/* Gallery a proporzioni naturali */}
      {project.gallery && project.gallery.length > 0 && (
        <NaturalGallery images={project.gallery} accent={project.accent} />
      )}

      <FadeUp delay={0.1} className={styles.centeredTagline}>
        <p>{project.tagline}</p>
      </FadeUp>

      <FadeUp delay={0.15} className={styles.centeredNarrative}>
        <NarrativeRows project={project} />
      </FadeUp>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT ORGANIC — Ecosistema Boreale
   ══════════════════════════════════════════════════════════════════ */

function LayoutOrganic({ project }: { project: Project }) {
  return (
    <div className={styles.layoutOrganic} style={{ '--accent': project.accent } as React.CSSProperties}>
      {/* Immagine principale a proporzioni naturali */}
      {project.mainImage && (
        <NaturalImg src={project.mainImage} accent={project.accent} mapMode />
      )}

      {/* Testo sovrapposto in basso */}
      <div className={styles.organicContent}>
        <motion.span
          className={styles.organicCategory}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.3 }}
        >
          {project.category}
        </motion.span>
        <motion.h2
          className={styles.organicTitle}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease, delay: 0.4 }}
        >
          {project.title}
        </motion.h2>
        <FadeUp delay={0.5}>
          <p className={styles.organicTagline}>{project.tagline}</p>
          <p className={styles.organicSub}>Kaninchen-Haus / Borealis — Quartiere Aurora</p>
        </FadeUp>
        <FadeUp delay={0.1} className={styles.organicRows}>
          <NarrativeRows project={project} />
        </FadeUp>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT ARCHIVE — Sperimentazione
   ══════════════════════════════════════════════════════════════════ */

function LayoutArchive({ project }: { project: Project }) {
  const N = 12
  return (
    <div className={styles.layoutArchive} style={{ '--accent': project.accent } as React.CSSProperties}>
      <div className={styles.archiveHeader}>
        <motion.h2
          className={styles.archiveTitle}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease, delay: 0.1 }}
        >
          Sperimentazione<br />/ Archivio
        </motion.h2>
        <motion.p
          className={styles.archiveSub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ duration: 0.6, ease, delay: 0.35 }}
        >
          ~80 fogli A3 · Esplora liberamente
        </motion.p>
      </div>

      <div className={styles.archiveGrid}>
        {project.gallery?.map((src, i) => {
          const seed = i * 137
          const rotate = ((seed % 11) - 5.5) * 1.1
          const delay = (i % 4) * 0.07
          return (
            <motion.div
              key={i}
              className={styles.archiveSheet}
              initial={{ opacity: 0, y: 40, rotate: rotate - 6 }}
              whileInView={{ opacity: 1, y: 0, rotate }}
              viewport={vp}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}
              whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
            >
              <ImgSlot 
                accent={project.accent} 
                label={`Foglio ${i + 1}`} 
                src={src}
                className={styles.archiveSheetImg} 
              />
            </motion.div>
          )
        })}
      </div>

      <FadeUp className={styles.archiveNarrative}>
        <NarrativeRows project={project} />
      </FadeUp>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT CASE STUDY — Spread editoriale a schermo pieno
   LEFT: tipografia + narrativa + PDF
   RIGHT: immagine principale (zoomabile) + filmstrip galleria
   ══════════════════════════════════════════════════════════════════ */

function LayoutCaseStudy({ project, idx = 0 }: { project: Project; idx?: number }) {
  const openLightbox = React.useContext(LightboxCtx)
  const gallery = project.gallery ?? []
  const allImages = [
    ...(project.mainImage ? [project.mainImage] : []),
    ...gallery,
  ]
  const num = String(idx + 1).padStart(2, '0')

  return (
    <div
      className={styles.layoutCS2}
      style={{ '--accent': project.accent } as React.CSSProperties}
    >
      {/* ── SINISTRA: pannello editoriale ── */}
      <div className={styles.cs2Left}>

        {/* Numero di sfondo — grande, semitrasparente */}
        <span className={styles.cs2BgNum} aria-hidden>{num}</span>

        {/* Categoria */}
        <motion.span
          className={styles.cs2Cat}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {project.category}
        </motion.span>

        {/* Titolo display — riempie il pannello */}
        <motion.h2
          className={styles.cs2Title}
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          {project.title}
        </motion.h2>

        {/* Barra accent */}
        <motion.div
          className={styles.cs2Bar}
          style={{ background: project.accent }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
        />

        {/* Tagline in corsivo */}
        <motion.p
          className={styles.cs2Tagline}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.45 }}
        >
          {project.tagline}
        </motion.p>

        <div className={styles.cs2Sep} />

        {/* Narrativa compatta */}
        <div className={styles.cs2Narr}>
          {[
            { k: 'Contesto',  v: project.context  },
            { k: 'Problema',  v: project.problem  },
            { k: 'Soluzione', v: project.solution },
            { k: 'Risultato', v: project.result   },
          ].map(({ k, v }, i) => (
            <motion.div
              key={k}
              className={styles.cs2NarrRow}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.48, delay: 0.5 + i * 0.07 }}
            >
              <span className={styles.cs2NarrKey}>{k}</span>
              <p className={styles.cs2NarrVal}>{v}</p>
            </motion.div>
          ))}
        </div>

        {/* PDF come download links — non embed inline */}
        {project.pdfs && project.pdfs.length > 0 && (
          <div className={styles.cs2Pdfs}>
            <span className={styles.cs2PdfsLabel}>Documenti</span>
            {project.pdfs.map((pdf, i) => (
              <motion.a
                key={i}
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.cs2PdfBtn}
                style={{ '--pa': project.accent } as React.CSSProperties}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 + i * 0.06 }}
              >
                <span className={styles.cs2PdfTag}>PDF</span>
                <span className={styles.cs2PdfName}>{pdf.label}</span>
                <span className={styles.cs2PdfArr}>↗</span>
              </motion.a>
            ))}
          </div>
        )}
      </div>

      {/* ── DESTRA: pannello visivo ── */}
      <div className={styles.cs2Right}>

        {/* Immagine principale — MapViewer zoomabile/panabile */}
        {project.mainImage ? (
          <div className={styles.cs2Img}>
            <NaturalImg src={project.mainImage} accent={project.accent} mapMode />
          </div>
        ) : (
          <div className={styles.cs2ImgEmpty} aria-hidden>
            <span>{project.title.toUpperCase()}</span>
          </div>
        )}

        {/* Filmstrip galleria — scorrevole orizzontalmente */}
        {gallery.length > 0 && (
          <div className={styles.cs2Strip}>
            <p className={styles.cs2StripMeta}>
              GALLERIA · {gallery.length} IMMAGINI · SCORRI →
            </p>
            <div className={styles.cs2Film}>
              {gallery.map((src, i) => (
                <motion.button
                  key={i}
                  type="button"
                  className={styles.cs2Thumb}
                  onClick={() => openLightbox(src, allImages)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                  whileHover={{ scale: 1.06 }}
                >
                  <img src={src} alt={`${project.title} — ${i + 1}`} loading="lazy" />
                  <span className={styles.cs2ThumbN}>{String(i + 1).padStart(2, '0')}</span>
                </motion.button>
              ))}
              {/* Filler lettering se galleria corta */}
              {gallery.length < 5 && (
                <div className={styles.cs2FilmFiller} aria-hidden>
                  <span>{project.title.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPALE
   ══════════════════════════════════════════════════════════════════ */

export function ProjectModal({ project, allProjects, onClose, onNavigate }: Props) {
  const idx = project ? allProjects.findIndex(p => p.id === project.id) : -1
  const prev = idx > 0 ? allProjects[idx - 1] : allProjects[allProjects.length - 1]
  const next = idx < allProjects.length - 1 ? allProjects[idx + 1] : allProjects[0]
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const [lbSrc, setLbSrc] = useState<string | null>(null)
  const [lbImages, setLbImages] = useState<string[]>([])
  const [lbZoom, setLbZoom] = useState(1)
  const [lbPan, setLbPan] = useState({ x: 0, y: 0 })
  const lbDragging = useRef(false)
  const lbDragStart = useRef({ x: 0, y: 0 })
  const lbPanStart = useRef({ x: 0, y: 0 })
  const lbContainerRef = useRef<HTMLDivElement>(null)

  const resetZoom = () => { setLbZoom(1); setLbPan({ x: 0, y: 0 }) }
  const openLb = (src: string, all: string[]) => { setLbSrc(src); setLbImages(all); resetZoom() }
  const closeLb = () => { setLbSrc(null); resetZoom() }
  const lbIdx = lbImages.indexOf(lbSrc ?? '')
  const lbPrev = () => { if (lbImages.length > 1) { setLbSrc(lbImages[(lbIdx - 1 + lbImages.length) % lbImages.length]); resetZoom() } }
  const lbNext = () => { if (lbImages.length > 1) { setLbSrc(lbImages[(lbIdx + 1) % lbImages.length]); resetZoom() } }

  useEffect(() => { setMounted(true) }, [])

  // Lock scroll del body quando il modal è aperto
  useEffect(() => {
    if (project) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [!!project])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lbSrc) {
        if (e.key === 'Escape') closeLb()
        if (e.key === 'ArrowLeft') lbPrev()
        if (e.key === 'ArrowRight') lbNext()
      } else {
        if (e.key === 'Escape') onClose()
        if (e.key === 'ArrowLeft') onNavigate(prev)
        if (e.key === 'ArrowRight') onNavigate(next)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNavigate, prev, next, lbSrc, lbImages])

  // Scroll to top ogni volta che cambia progetto
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [project?.id])

  // Zoom rotellina nel lightbox — passive:false per poter fare preventDefault
  useEffect(() => {
    const el = lbContainerRef.current
    if (!el || !lbSrc) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setLbZoom(z => Math.max(1, Math.min(5, z + (e.deltaY < 0 ? 0.3 : -0.3))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [lbSrc])

  function renderLayout(p: Project) {
    const layout = LAYOUT_MAP[p.id] ?? 'split_light'
    switch (layout) {
      case 'split_dark':  return <LayoutSplitDark  project={p} />
      case 'split_light': return <LayoutSplitLight project={p} />
      case 'panoramic':   return <LayoutPanoramic  project={p} />
      case 'dual':        return <LayoutDual        project={p} />
      case 'centered':    return <LayoutCentered    project={p} />
      case 'organic':     return <LayoutOrganic     project={p} />
      case 'archive':     return <LayoutArchive     project={p} />
      case 'case_study':  return <LayoutCaseStudy   project={p} />
    }
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal
          aria-label={`Progetto: ${project.title}`}
        >
          <motion.div
            className={styles.card}
            initial={{ y: 56, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 56, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <LightboxCtx.Provider value={openLb}>
              {/* ── Controlli sempre visibili ── */}
              <button className={styles.closeBtn} onClick={onClose} aria-label="Chiudi">✕</button>

              <button className={styles.navBtn} data-dir="prev"
                onClick={() => onNavigate(prev)} aria-label="Progetto precedente">←</button>
              <button className={styles.navBtn} data-dir="next"
                onClick={() => onNavigate(next)} aria-label="Progetto successivo">→</button>

              <div className={styles.counter}>{idx + 1} / {allProjects.length}</div>

              <div className={styles.footerCta}>
                <button
                  className={styles.footerCtaButton}
                  onClick={() => {
                    onClose();
                    useConfiguratorStore.getState().openModal();
                  }}
                >
                  Vuoi un progetto simile? Calcola un preventivo →
                </button>
              </div>

              {/* ── Contenuto scrollabile ── */}
              <div className={styles.content} ref={contentRef}>
                {renderLayout(project)}
              </div>

              {/* Lightbox — zoom rotellina, drag-to-pan, click immagine per toggle 1×/2.5× */}
              <AnimatePresence>
                {lbSrc && (
                  <motion.div
                    ref={lbContainerRef}
                    className={styles.lightbox}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={closeLb}
                    onMouseMove={e => {
                      if (!lbDragging.current) return
                      const dx = (e.clientX - lbDragStart.current.x) / lbZoom
                      const dy = (e.clientY - lbDragStart.current.y) / lbZoom
                      setLbPan({ x: lbPanStart.current.x + dx, y: lbPanStart.current.y + dy })
                    }}
                    onMouseUp={() => { lbDragging.current = false }}
                    onMouseLeave={() => { lbDragging.current = false }}
                  >
                    {/* Wrapper animato per entrata/uscita — separato dal transform zoom */}
                    <motion.div
                      key={lbSrc}
                      className={styles.lightboxImgWrap}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <img
                        src={lbSrc}
                        alt=""
                        className={styles.lightboxImg}
                        draggable={false}
                        style={{
                          transform: `scale(${lbZoom}) translate(${lbPan.x}px, ${lbPan.y}px)`,
                          cursor: lbZoom > 1 ? 'grab' : 'zoom-in',
                          transition: lbDragging.current ? 'none' : 'transform 0.18s ease',
                        }}
                        onClick={e => {
                          e.stopPropagation()
                          if (lbZoom > 1) resetZoom()
                          else setLbZoom(2.5)
                        }}
                        onMouseDown={e => {
                          if (lbZoom <= 1) return
                          e.stopPropagation()
                          lbDragging.current = true
                          lbDragStart.current = { x: e.clientX, y: e.clientY }
                          lbPanStart.current = { ...lbPan }
                        }}
                      />
                    </motion.div>

                    {/* Indicatore zoom */}
                    {lbZoom > 1 && (
                      <button
                        className={styles.lightboxZoomReset}
                        onClick={e => { e.stopPropagation(); resetZoom() }}
                      >
                        {Math.round(lbZoom * 10) / 10}× — reset
                      </button>
                    )}

                    <button className={styles.lightboxClose} onClick={closeLb}>✕</button>
                    {lbImages.length > 1 && (
                      <>
                        <button className={`${styles.lightboxNav} ${styles.lightboxNavPrev}`} onClick={e => { e.stopPropagation(); lbPrev() }}>←</button>
                        <button className={`${styles.lightboxNav} ${styles.lightboxNavNext}`} onClick={e => { e.stopPropagation(); lbNext() }}>→</button>
                        <span className={styles.lightboxCounter}>{lbIdx + 1} / {lbImages.length}</span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </LightboxCtx.Provider>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
