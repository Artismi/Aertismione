'use client'

/**
 * Fascicolo — la pagina progetto come sequenza di capitoli.
 *
 * Ogni capitolo ha la stessa intestazione (titolo, sottotitolo, testo) e sotto
 * una composizione a righe: in ogni riga i pezzi stanno alla stessa altezza,
 * calcolata dalle loro proporzioni vere, così i bordi cadono allineati e la
 * riga si chiude piena senza ritagliare niente. Nessun effetto: niente cornici,
 * ombre, rotazioni o sovrapposizioni — ogni scelta viene dal contenuto.
 */

import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import imageSizes from '@/config/imageSizes.json'
import styles from './Fascicolo.module.css'

/* ─── Tipi ───────────────────────────────────────────────────────────────── */

type Video = { video: string; larghezza: number; altezza: number }
/** Immagini impilate nella stessa colonna, alla stessa larghezza. */
type Pila = { pila: string[] }
/** Un'opera di una raccolta: l'immagine con la sua didascalia sotto. */
type Opera = {
  img: string
  titolo: string
  nota?: string
  testo?: string
  /** Id del brano su Spotify: il player si carica solo al click. */
  spotify?: string
}
/**
 * Testo che occupa un posto nella griglia come un'immagine, con le proporzioni
 * date: chiude una riga che altrimenti resterebbe con un buco.
 */
type Blocco = {
  blocco: { label: string; text: string }[]
  rapporto: number
  /** Spazi fra pezzi che il blocco ingloba quando occupa più posti (es. 1 per due posti). */
  spazi?: number
}
/** Un pezzo della composizione: un'immagine, un video, una pila, un'opera o un blocco di testo. */
type Pezzo = string | Video | Pila | Opera | Blocco

type Section = {
  label: string
  sottotitolo?: string
  text?: string
  /** Link che valgono per tutto il capitolo, nell'intestazione. */
  link?: { label: string; url: string }[]
  /** Righe della composizione: in ogni riga i pezzi stanno alla stessa altezza. */
  righe?: Pezzo[][]
  /** Immagine verticale che scorre in loop, in una colonna alta quanto il capitolo. */
  scorrimento?: string
  /** Immagine alta e stretta (es. una tavola da skate), in una colonna a sinistra lunga quanto il capitolo. */
  colonna?: string
  /** Formati precedenti: diventano righe da tre. */
  images?: string[]
  gruppi?: string[][]
}

export type FascicoloProject = {
  id: string
  title: string
  tagline: string
  /** Introduzione breve, accanto al titolo. */
  intro?: string
  /** Striscia lunga a tutta larghezza, subito dopo la testata, da scorrere. */
  panoramaStrip?: string
  /** Pagina più larga sugli schermi grandi, dove le immagini sono tutto. */
  largo?: boolean
  sections?: Section[]
  context?: string
  problem?: string
  solution?: string
  result?: string
  links?: { label: string; url: string; note?: string }[]
}

const LABELS = {
  context: 'Contesto',
  problem: 'Il Problema',
  solution: 'La Soluzione',
  result: 'Il Risultato',
}

/* ─── Misure ─────────────────────────────────────────────────────────────── */

function misura(src: string): [number, number] {
  return (imageSizes as unknown as Record<string, [number, number]>)[src] ?? [1600, 1200]
}
const rapporto = (src: string) => {
  const [w, h] = misura(src)
  return w / h
}
const eVideo = (p: Pezzo): p is Video => typeof p === 'object' && 'video' in p
const ePila = (p: Pezzo): p is Pila => typeof p === 'object' && 'pila' in p
const eOpera = (p: Pezzo): p is Opera => typeof p === 'object' && 'img' in p
const eBlocco = (p: Pezzo): p is Blocco => typeof p === 'object' && 'blocco' in p

/**
 * Altezza comune di una riga, come espressione CSS.
 *
 * Un pezzo singolo largo a·H; una pila di k immagini con rapporti b₁…bₖ è larga
 * (H − (k−1)·gap)·B, con B = 1/Σ(1/bⱼ). Imponendo che la somma delle larghezze
 * più gli spazi faccia la larghezza del contenitore (100cqw):
 *   H = (100cqw − c·gap) / S,  S = Σa + ΣB,  c = (n−1) − Σ B·(k−1)
 */
function geometriaRiga(riga: Pezzo[]) {
  let somma = 0
  let spazi = riga.length - 1
  const pezzi = riga.map((p) => {
    if (ePila(p)) {
      const B = 1 / p.pila.reduce((s, src) => s + 1 / rapporto(src), 0)
      somma += B
      spazi -= B * (p.pila.length - 1)
      return { pezzo: p, quota: B, larghezza: `calc((var(--h) - ${p.pila.length - 1} * var(--gap)) * ${B.toFixed(5)})` }
    }
    if (eBlocco(p)) {
      // un blocco su più posti ingloba anche gli spazi fra quei posti
      const k = p.spazi ?? 0
      somma += p.rapporto
      spazi += k
      return {
        pezzo: p,
        quota: p.rapporto,
        larghezza: `calc(var(--h) * ${p.rapporto.toFixed(5)} + ${k} * var(--gap))`,
      }
    }
    const a = eVideo(p) ? p.larghezza / p.altezza : rapporto(eOpera(p) ? p.img : p)
    somma += a
    return { pezzo: p, quota: a, larghezza: `calc(var(--h) * ${a.toFixed(5)})` }
  })
  const altezza = `calc((100cqw - ${spazi.toFixed(5)} * var(--gap)) / ${somma.toFixed(5)})`
  return { pezzi, altezza, somma }
}

/* ─── Testo ──────────────────────────────────────────────────────────────── */

function conGrassetto(testo: string) {
  return testo.split(/(\*\*[^*]+\*\*)/g).map((pezzo, i) =>
    pezzo.startsWith('**') && pezzo.endsWith('**')
      ? <strong key={i}>{pezzo.slice(2, -2)}</strong>
      : <span key={i}>{pezzo}</span>,
  )
}

/* ─── Sezioni e immagini ─────────────────────────────────────────────────── */

function sezioniDi(p: FascicoloProject): Section[] {
  if (p.sections?.length) return p.sections
  return ([
    { label: LABELS.context, text: p.context },
    { label: LABELS.problem, text: p.problem },
    { label: LABELS.solution, text: p.solution },
    { label: LABELS.result, text: p.result },
  ].filter((b) => b.text) as Section[])
}

const aTre = (imgs: string[]) =>
  Array.from({ length: Math.ceil(imgs.length / 3) }, (_, i) => imgs.slice(i * 3, i * 3 + 3))

/** Le righe di un capitolo; i formati precedenti diventano righe da tre. */
function righeDi(s: Section): Pezzo[][] {
  if (s.righe) return s.righe
  if (s.gruppi) return s.gruppi.flatMap(aTre)
  return aTre(s.images ?? [])
}

/** Tutte le immagini del racconto, in ordine, per la navigazione del lightbox. */
function raccoltaImmagini(sezioni: Section[]): string[] {
  return sezioni.flatMap((s) => [
    ...(s.colonna ? [s.colonna] : []),
    ...righeDi(s)
      .flat()
      .flatMap((p) =>
        eVideo(p) || eBlocco(p) ? [] : ePila(p) ? p.pila : eOpera(p) ? [p.img] : [p],
      ),
  ])
}

/* ─── Animazione d'ingresso ──────────────────────────────────────────────── */

function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Pezzi ──────────────────────────────────────────────────────────────── */

/** Video muto in loop che parte quando entra nello schermo. */
function VideoPlate({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const inView = useInView(ref, { margin: '0px 0px -80px 0px' })
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
      className={styles.video}
      muted
      loop
      playsInline
      controls
      preload="metadata"
    />
  )
}

function Immagine({
  src,
  sizes,
  all,
  onLightbox,
}: {
  src: string
  sizes: string
  all: string[]
  onLightbox: (src: string, all: string[]) => void
}) {
  const [w, h] = misura(src)
  return (
    <button className={styles.apri} onClick={() => onLightbox(src, all)} aria-label="Apri immagine">
      <Image src={src} alt="" width={w} height={h} sizes={sizes} quality={90} className={styles.img} />
    </button>
  )
}

/**
 * Il brano su Spotify: finché non si clicca c'è solo «Ascolta», così il player
 * (e i suoi tracciamenti) si carica solo quando qualcuno vuole sentire.
 */
function Ascolta({ brano, titolo }: { brano: string; titolo: string }) {
  const [aperto, setAperto] = useState(false)
  if (!aperto) {
    return (
      <button className={styles.ascolta} onClick={() => setAperto(true)}>
        <span aria-hidden="true">▶</span> Ascolta
      </button>
    )
  }
  return (
    <iframe
      className={styles.player}
      src={`https://open.spotify.com/embed/track/${brano}?theme=0`}
      title={`${titolo} su Spotify`}
      height={80}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    />
  )
}

function Didascalia({ opera }: { opera: Opera }) {
  return (
    <div className={styles.didascalia}>
      <p className={styles.didTitolo}>{opera.titolo}</p>
      {opera.nota && <p className={styles.didNota}>{opera.nota}</p>}
      {opera.testo && <p className={styles.didTesto}>{conGrassetto(opera.testo)}</p>}
      {opera.spotify && <Ascolta brano={opera.spotify} titolo={opera.titolo} />}
    </div>
  )
}

function Riga({
  riga,
  all,
  onLightbox,
}: {
  riga: Pezzo[]
  all: string[]
  onLightbox: (src: string, all: string[]) => void
}) {
  const { pezzi, altezza, somma } = geometriaRiga(riga)
  return (
    <div className={styles.riga} style={{ '--h': altezza } as React.CSSProperties}>
      {pezzi.map(({ pezzo, quota, larghezza }, i) => {
        const sizes = `(max-width: 760px) 100vw, ${Math.max(18, Math.round((quota / somma) * 92))}vw`
        if (eVideo(pezzo)) {
          return (
            <div
              key={pezzo.video}
              className={styles.pezzo}
              style={{ width: larghezza, aspectRatio: `${pezzo.larghezza} / ${pezzo.altezza}` }}
            >
              <VideoPlate src={pezzo.video} />
            </div>
          )
        }
        if (ePila(pezzo)) {
          return (
            <div key={i} className={`${styles.pezzo} ${styles.pila}`} style={{ width: larghezza }}>
              {pezzo.pila.map((src) => (
                <Immagine key={src} src={src} sizes={sizes} all={all} onLightbox={onLightbox} />
              ))}
            </div>
          )
        }
        if (eBlocco(pezzo)) {
          return (
            <div key={i} className={`${styles.pezzo} ${styles.blocco}`} style={{ width: larghezza }}>
              {pezzo.blocco.map((b) => (
                <div key={b.label}>
                  <h3 className={styles.sottotitolo}>{b.label}</h3>
                  <p className={styles.bloccoTesto}>{conGrassetto(b.text)}</p>
                </div>
              ))}
            </div>
          )
        }
        if (eOpera(pezzo)) {
          return (
            <div key={pezzo.img} className={styles.pezzo} style={{ width: larghezza }}>
              <Immagine src={pezzo.img} sizes={sizes} all={all} onLightbox={onLightbox} />
              <Didascalia opera={pezzo} />
            </div>
          )
        }
        return (
          <div key={pezzo} className={styles.pezzo} style={{ width: larghezza }}>
            <Immagine src={pezzo} sizes={sizes} all={all} onLightbox={onLightbox} />
          </div>
        )
      })}
    </div>
  )
}

/**
 * Striscia lunga a tutta larghezza, alta quasi uno schermo ma mai oltre la sua
 * risoluzione: si percorre in orizzontale col trackpad, col dito o trascinando.
 */
function Striscia({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const presa = useRef<{ x: number; scroll: number } | null>(null)
  const [w, h] = misura(src)
  return (
    <section className={styles.striscia}>
      <div
        ref={ref}
        className={styles.strisciaFinestra}
        tabIndex={0}
        aria-label="Striscia illustrata: scorri in orizzontale"
        onPointerDown={(e) => {
          // col dito e col trackpad scorre già da sé: il trascinamento serve al mouse
          if (e.pointerType !== 'mouse' || !ref.current) return
          presa.current = { x: e.clientX, scroll: ref.current.scrollLeft }
          ref.current.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!presa.current || !ref.current) return
          ref.current.scrollLeft = presa.current.scroll - (e.clientX - presa.current.x)
        }}
        onPointerUp={() => (presa.current = null)}
        onPointerCancel={() => (presa.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Striscia illustrata" width={w} height={h} draggable={false} className={styles.strisciaImg} />
      </div>
      <p className={styles.strisciaNota}>Scorri la striscia →</p>
    </section>
  )
}

/** Colonna che fa scorrere in verticale un'immagine lunga, all'infinito. */
function Scorrimento({ src }: { src: string }) {
  return (
    <div className={styles.scorrimento} aria-hidden="true">
      <div className={styles.scorrimentoTraccia}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" />
      </div>
    </div>
  )
}

/* ─── Capitolo ───────────────────────────────────────────────────────────── */

function Capitolo({
  sezione,
  all,
  onLightbox,
}: {
  sezione: Section
  all: string[]
  onLightbox: (src: string, all: string[]) => void
}) {
  const righe = righeDi(sezione)
  // accanto a una colonna alta il testo va sotto le immagini: titolo, immagini
  // e testo stanno in una colonna stretta che resta ferma mentre si scorre
  const testoSotto = Boolean(sezione.colonna && sezione.text)
  const corpo = (
    <>
      <header className={styles.intestazione}>
        <div>
          <h2 className={styles.titolo}>{sezione.label}</h2>
          {sezione.sottotitolo && <p className={styles.sottotitolo}>{sezione.sottotitolo}</p>}
        </div>
        {!testoSotto && (sezione.text || sezione.link?.length) && (
          <div>
            {sezione.text && <p className={styles.testo}>{conGrassetto(sezione.text)}</p>}
            {sezione.link?.length ? (
              <p className={styles.linkCapitolo}>
                {sezione.link.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label} <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </p>
            ) : null}
          </div>
        )}
      </header>
      {righe.length > 0 && (
        <div className={styles.composizione}>
          {righe.map((riga, i) => (
            <Riga key={i} riga={riga} all={all} onLightbox={onLightbox} />
          ))}
        </div>
      )}
      {testoSotto && <p className={`${styles.testo} ${styles.testoSotto}`}>{conGrassetto(sezione.text!)}</p>}
    </>
  )

  return (
    <section>
      {sezione.colonna ? (
        <Reveal className={`${styles.capitolo} ${styles.conColonna}`}>
          <div className={styles.colonna}>
            <Immagine
              src={sezione.colonna}
              sizes="(max-width: 760px) 60vw, 40vw"
              all={all}
              onLightbox={onLightbox}
            />
          </div>
          <div className={styles.principale}>{corpo}</div>
        </Reveal>
      ) : sezione.scorrimento ? (
        <Reveal className={`${styles.capitolo} ${styles.conScorrimento}`}>
          <div className={styles.principale}>{corpo}</div>
          <Scorrimento src={sezione.scorrimento} />
        </Reveal>
      ) : (
        <Reveal className={styles.capitolo}>{corpo}</Reveal>
      )}
    </section>
  )
}

/* ─── Componente principale ──────────────────────────────────────────────── */

export function Fascicolo({
  project,
  onLightbox,
}: {
  project: FascicoloProject
  onLightbox: (src: string, all: string[]) => void
}) {
  const sezioni = sezioniDi(project)
  const immagini = raccoltaImmagini(sezioni)

  return (
    <div className={project.largo ? `${styles.foglio} ${styles.largo}` : styles.foglio}>
      <header className={project.intro ? `${styles.testata} ${styles.testataConIntro}` : styles.testata}>
        <div>
          <h1 className={styles.nome}>{project.title}</h1>
          <p className={styles.tagline}>{project.tagline}</p>
        </div>
        {project.intro && <p className={styles.intro}>{conGrassetto(project.intro)}</p>}
      </header>

      {project.panoramaStrip && <Striscia src={project.panoramaStrip} />}

      {sezioni.map((sec) => (
        <Capitolo key={sec.label} sezione={sec} all={immagini} onLightbox={onLightbox} />
      ))}

      {project.links?.length ? (
        <section className={styles.riferimenti}>
          <h2 className={styles.sottotitolo}>Riferimenti</h2>
          <ul className={styles.rifList}>
            {project.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  <span className={styles.rifLabel}>{l.label}</span>
                  {l.note && <span className={styles.rifNote}>{l.note}</span>}
                  <span className={styles.rifArrow} aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
