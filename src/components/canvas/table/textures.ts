/**
 * Texture disegnate su canvas per il tavolo dei Progetti: legno del banco,
 * tappetino da taglio, kraft stampato con la grafica Artismi, etichette,
 * scheda elettronica e schermo della console, righello.
 * Niente immagini da scaricare, a parte il logo e le anteprime gia' sul sito.
 */

import * as THREE from 'three'
import { rng, pcbPaint } from './consolePaint'

/** Seme fisso: il banco e la carta sono gli stessi a ogni visita */
export { rng }

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

export function toTexture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** I font del sito hanno nomi generati da next/font: li leggiamo dalle variabili CSS */
export function siteFont(varName: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.body).getPropertyValue(varName).trim()
  return v || fallback
}

const fonts = () => ({
  display: siteFont('--font-display-var', 'sans-serif'),
  body: siteFont('--font-serif-var', 'sans-serif'),
  mono: siteFont('--font-mono-var', 'monospace'),
})

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Grana di base: fibre corte e puntini, su colore e rilievo insieme */
function fibres(ctx: CanvasRenderingContext2D, bctx: CanvasRenderingContext2D | null, W: number, H: number, rand: () => number, n: number, light: string, dark: string) {
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = rand() * H
    const len = 2 + rand() * 12, a = rand() * Math.PI
    const isLight = rand() > 0.5
    ctx.strokeStyle = isLight ? light : dark
    ctx.globalAlpha = 0.12 + rand() * 0.28
    ctx.lineWidth = 0.5 + rand() * 0.9
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke()
    if (bctx) {
      bctx.strokeStyle = isLight ? '#b0b0b0' : '#505050'
      bctx.globalAlpha = 0.35
      bctx.beginPath(); bctx.moveTo(x, y); bctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); bctx.stroke()
    }
  }
  ctx.globalAlpha = 1
  if (bctx) bctx.globalAlpha = 1
}

/* ── Banco da lavoro ─────────────────────────────────────────────────────── */

/**
 * Macchie sul banco, sopra il legno fotografico: gocce rosa e azzurre Artismi,
 * schizzi d'inchiostro, un alone di tazza, segni di matita. Fondo trasparente.
 */
export function stainsTexture() {
  const W = 2048, H = 1138
  const rand = rng(11)
  const [c, ctx] = canvas(W, H)
  const blot = (x: number, y: number, rr: number, col: string) => {
    ctx.fillStyle = col
    ctx.beginPath()
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.25) {
      const k = rr * (0.75 + rand() * 0.5)
      const px = x + Math.cos(a) * k, py = y + Math.sin(a) * k
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.fill()
    // schizzi attorno
    for (let i = 0; i < 4; i++) {
      const a = rand() * Math.PI * 2, d = rr * (1.4 + rand() * 1.5)
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr * 0.15 * rand() + 0.6, 0, Math.PI * 2); ctx.fill()
    }
  }
  for (let i = 0; i < 7; i++) blot(rand() * W, rand() * H, 2 + rand() * 5, 'rgba(232,168,191,0.9)')
  for (let i = 0; i < 6; i++) blot(rand() * W, rand() * H, 1.5 + rand() * 4, 'rgba(18,14,20,0.75)')
  for (let i = 0; i < 3; i++) blot(rand() * W, rand() * H, 1.5 + rand() * 4, 'rgba(157,212,238,0.85)')
  ctx.strokeStyle = 'rgba(40,20,8,0.22)'; ctx.lineWidth = 6
  ctx.beginPath(); ctx.arc(W * 0.8, H * 0.2, 62, 0.3, Math.PI * 1.85); ctx.stroke()
  ctx.strokeStyle = 'rgba(40,40,45,0.3)'; ctx.lineWidth = 1.2
  for (let i = 0; i < 5; i++) {
    const x = rand() * W, y = rand() * H
    ctx.beginPath(); ctx.moveTo(x, y)
    for (let k = 0; k < 6; k++) ctx.lineTo(x + rand() * 110, y + (rand() - 0.5) * 36)
    ctx.stroke()
  }
  return toTexture(c)
}

/** Tappetino da taglio: nero, griglia rosa, numeri e diagonali */
export function matTexture() {
  const W = 1600, H = 1900
  const rand = rng(5)
  const [c, ctx] = canvas(W, H)
  const { mono } = fonts()
  ctx.fillStyle = '#1F1C22'; ctx.fillRect(0, 0, W, H)
  fibres(ctx, null, W, H, rand, 6000, '#3a3540', '#121014')
  const step = 50
  for (let x = 100; x < W - 40; x += step) {
    const major = ((x - 100) / step) % 5 === 0
    ctx.strokeStyle = major ? 'rgba(232,168,191,0.75)' : 'rgba(232,168,191,0.28)'
    ctx.lineWidth = major ? 2.4 : 1.2
    ctx.beginPath(); ctx.moveTo(x, 100); ctx.lineTo(x, H - 60); ctx.stroke()
  }
  for (let y = 100; y < H - 40; y += step) {
    const major = ((y - 100) / step) % 5 === 0
    ctx.strokeStyle = major ? 'rgba(232,168,191,0.75)' : 'rgba(232,168,191,0.28)'
    ctx.lineWidth = major ? 2.4 : 1.2
    ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(W - 60, y); ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(232,168,191,0.22)'; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.moveTo(100, H - 60); ctx.lineTo(W - 60, H - 60 - (W - 160)); ctx.stroke()
  ctx.fillStyle = 'rgba(232,168,191,0.85)'
  ctx.font = `700 26px ${mono}`
  ctx.textAlign = 'center'
  for (let i = 0; i * step * 5 + 100 < W - 40; i++) ctx.fillText(String(i * 5), 100 + i * step * 5, 80)
  ctx.textAlign = 'right'
  for (let i = 0; i * step * 5 + 100 < H - 40; i++) ctx.fillText(String(i * 5), 84, 108 + i * step * 5)
  ctx.textAlign = 'left'
  ctx.font = `700 30px ${mono}`
  ctx.fillText('ARTISMI ✦ SELF-HEALING CUTTING MAT ✦ A3', 110, H - 22)
  // tagli
  for (let i = 0; i < 80; i++) {
    const x = rand() * W, y = rand() * H, len = 30 + rand() * 200, a = rand() > 0.5 ? 0 : Math.PI / 2
    ctx.strokeStyle = 'rgba(120,110,125,0.35)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke()
  }
  return toTexture(c)
}

/** Righello in acciaio: tacche e numeri */
export function rulerTexture(metal: HTMLImageElement | null) {
  const W = 2400, H = 240
  const [c, ctx] = canvas(W, H)
  const { mono } = fonts()
  ctx.fillStyle = '#d4d6d9'; ctx.fillRect(0, 0, W, H)
  // metallo spazzolato fotografico, steso lungo il righello
  if (metal) for (let x = 0; x < W; x += H * 2) ctx.drawImage(metal, x, 0, H * 2, H)
  ctx.fillStyle = '#1A1A1A'
  for (let i = 0; i <= 300; i++) {
    const x = 30 + i * 7.8
    const l = i % 10 === 0 ? 70 : i % 5 === 0 ? 48 : 30
    ctx.fillRect(x, 0, 2, l)
    if (i % 10 === 0) { ctx.font = `700 34px ${mono}`; ctx.fillText(String(i / 10), x - 8, 112) }
  }
  ctx.font = `700 26px ${mono}`
  ctx.fillText('ARTISMI STUDIO ✦ STAINLESS', W - 560, H - 30)
  return toTexture(c)
}

/* ── Fascicolo ───────────────────────────────────────────────────────────── */

/**
 * Kraft della copertina, con la grafica Artismi stampata a inchiostro:
 * logo, numero enorme che esce dal bordo, stelle, colonna di testo micro.
 * La texture copre esattamente la copertina (UV = forma del fascicolo).
 */
export function coverTextures(opts: { logo: HTMLImageElement | null; paper: HTMLImageElement | null; big: string; seed?: number; printed: boolean }) {
  const W = 1536, H = 2000
  const rand = rng(opts.seed ?? 7)
  const [c, ctx] = canvas(W, H)
  const [b, bctx] = canvas(W, H)
  const { display, mono } = fonts()

  ctx.fillStyle = '#B98552'; ctx.fillRect(0, 0, W, H)
  bctx.fillStyle = '#808080'; bctx.fillRect(0, 0, W, H)

  // cartoncino kraft fotografato, scaldato verso l'arancio del riferimento
  if (opts.paper) {
    const t = 1000
    for (let y = 0; y < H; y += t) for (let x = 0; x < W; x += t) ctx.drawImage(opts.paper, x, y, t, t)
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = 'rgba(232,170,110,0.55)'; ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'source-over'
  }
  fibres(ctx, bctx, W, H, rand, 9000, '#E6BE8C', '#6A4322')

  // bordi consumati: piu' scuri e un po' sfilacciati
  for (const [x0, y0, x1, y1] of [[0, 0, 70, 0], [W, 0, W - 70, 0], [0, 0, 0, 70], [0, H, 0, H - 70]] as const) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, 'rgba(90,55,25,0.45)'); g.addColorStop(1, 'rgba(90,55,25,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  }
  // pieghe del dorso, a sinistra
  for (const x of [46, 78]) {
    ctx.strokeStyle = 'rgba(70,42,18,0.45)'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    ctx.strokeStyle = 'rgba(230,190,140,0.35)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x + 3, 0); ctx.lineTo(x + 3, H); ctx.stroke()
    bctx.strokeStyle = '#303030'; bctx.lineWidth = 4
    bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, H); bctx.stroke()
  }
  // un'impronta di tazza e qualche segno di matita
  ctx.strokeStyle = 'rgba(80,45,15,0.18)'; ctx.lineWidth = 10
  ctx.beginPath(); ctx.arc(W * 0.78, H * 0.86, 120, 0.4, Math.PI * 1.7); ctx.stroke()

  if (opts.printed) {
    // stampa a inchiostro: moltiplica sul kraft
    ctx.globalCompositeOperation = 'multiply'

    // scritta enorme che sanguina dal bordo destro, stampata leggera: sta sotto l'etichetta
    ctx.fillStyle = 'rgba(26,20,16,0.3)'
    ctx.font = `800 900px ${display}`
    ctx.textAlign = 'right'
    ctx.fillText(opts.big, W + 150, H * 0.975)

    // logo graffiti
    if (opts.logo) {
      const lw = W * 0.78, lh = lw * (opts.logo.height / opts.logo.width)
      ctx.globalAlpha = 0.95
      ctx.drawImage(opts.logo, 130, 120, lw, lh)
      ctx.drawImage(opts.logo, 132, 121, lw, lh) // tratto piu' pieno
      ctx.globalAlpha = 1
    }

    // stelle
    ctx.fillStyle = 'rgba(26,20,16,0.9)'
    ctx.textAlign = 'left'
    ctx.font = `400 90px ${mono}`
    ctx.fillText('✦', 1250, 1180)
    ctx.font = `400 54px ${mono}`
    ctx.fillText('✦', 1140, 1240)

    // colonna di testo micro, maiuscolo giustificato
    ctx.font = `700 25px ${mono}`
    const words = 'ARCHIVIO DEI LAVORI ✦ IDENTITÀ VISIVE ✦ ILLUSTRAZIONE ✦ MURALES ✦ SOCIAL ✦ RICERCA ✦ STAMPA ✦ TORINO ✦ NEGOZI ASSOCIAZIONI PICCOLE IMPRESE ✦ OGNI PROGETTO È UN TERRITORIO ✦ APRIRE CON CURA ✦ ARTISMI DESIGN STUDIO ✦ 2024 — OGGI'.split(' ')
    justify(ctx, words, 130, 780, 560, 36, 9)

    ctx.globalCompositeOperation = 'source-over'
  }

  const map = toTexture(c), bump = toTexture(b, false)
  return { map, bump }
}

function justify(ctx: CanvasRenderingContext2D, words: string[], x: number, y: number, width: number, lh: number, maxLines: number) {
  const lines: string[][] = [[]]
  for (const w of words) {
    const cur = lines[lines.length - 1]
    const test = [...cur, w].join(' ')
    if (ctx.measureText(test).width > width && cur.length) lines.push([w])
    else cur.push(w)
  }
  lines.slice(0, maxLines).forEach((ws, i) => {
    const last = i === lines.length - 1
    const total = ws.reduce((s, w) => s + ctx.measureText(w).width, 0)
    const gap = last || ws.length < 2 ? ctx.measureText(' ').width : (width - total) / (ws.length - 1)
    let cx = x
    for (const w of ws) { ctx.fillText(w, cx, y + i * lh); cx += ctx.measureText(w).width + gap }
  })
}

/** Etichetta rosa Artismi: «Portfolio» enorme, e' la cosa che si legge per prima */
export function labelTexture(lines: { title: string; top: string; bottom: string }) {
  const W = 1400, H = 700
  const [c, ctx] = canvas(W, H)
  const { display, mono } = fonts()
  const rand = rng(21)
  ctx.fillStyle = '#EBB1C5'
  roundRect(ctx, 0, 0, W, H, 44); ctx.fill()
  fibres(ctx, null, W, H, rand, 3500, '#f6cfdc', '#c98aa1')
  ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 4
  ctx.strokeRect(40, 40, W - 80, H - 80)
  ctx.beginPath(); ctx.moveTo(40, 140); ctx.lineTo(W - 40, 140); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(40, H - 130); ctx.lineTo(W - 40, H - 130); ctx.stroke()
  ctx.fillStyle = '#1A1A1A'
  ctx.font = `700 34px ${mono}`
  ctx.fillText(lines.top, 80, 104)
  ctx.font = `800 330px ${display}`
  let size = 330
  while (ctx.measureText(lines.title).width > W - 150 && size > 120) { size -= 10; ctx.font = `800 ${size}px ${display}` }
  ctx.fillText(lines.title, 70, H - 190)
  ctx.font = `700 32px ${mono}`
  ctx.fillText(lines.bottom, 80, H - 70)
  return toTexture(c)
}

/** Bollino tondo azzurro, sovrapposto all'angolo dell'etichetta */
export function dotTexture(big: string, small: string) {
  const S = 512
  const [c, ctx] = canvas(S, S)
  const { display, mono } = fonts()
  ctx.fillStyle = '#9DD4EE'
  ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 4, 0, Math.PI * 2); ctx.fill()
  fibres(ctx, null, S, S, rng(8), 800, '#c4e8f7', '#6fa9c4')
  ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 4, 0, Math.PI * 2); ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 5
  ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 34, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = '#1A1A1A'; ctx.textAlign = 'center'
  ctx.font = `800 170px ${display}`
  ctx.fillText(big, S / 2, S / 2 + 40)
  ctx.font = `700 34px ${mono}`
  ctx.fillText(small, S / 2, S / 2 + 110)
  ctx.fillText('✦', S / 2, S / 2 - 120)
  return toTexture(c)
}

/** Linguetta azzurra con il nome, in verticale */
export function tabTexture(text: string) {
  const W = 180, H = 1100
  const [c, ctx] = canvas(W, H)
  const { display } = fonts()
  ctx.fillStyle = '#9DD4EE'; ctx.fillRect(0, 0, W, H)
  fibres(ctx, null, W, H, rng(4), 900, '#c4e8f7', '#6fa9c4')
  ctx.save()
  ctx.translate(W / 2, H / 2); ctx.rotate(Math.PI / 2)
  ctx.fillStyle = '#1A1A1A'; ctx.textAlign = 'center'
  ctx.font = `800 96px ${display}`
  ctx.fillText(text, 0, 34)
  ctx.restore()
  return toTexture(c)
}

/** Nastro di carta, semitrasparente e con i bordi strappati */
export function tapeTexture() {
  const W = 512, H = 160
  const [c, ctx] = canvas(W, H)
  const rand = rng(13)
  ctx.fillStyle = 'rgba(236,226,196,0.82)'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  for (let x = 0; x <= W; x += 16) ctx.lineTo(x, rand() * 6)
  for (let y = 0; y <= H; y += 10) ctx.lineTo(W - rand() * 10, y)
  for (let x = W; x >= 0; x -= 16) ctx.lineTo(x, H - rand() * 6)
  for (let y = H; y >= 0; y -= 10) ctx.lineTo(rand() * 10, y)
  ctx.fill()
  fibres(ctx, null, W, H, rand, 600, 'rgba(255,255,255,0.6)', 'rgba(150,130,90,0.5)')
  return toTexture(c)
}

/** Il timbro che compare al passaggio del mouse */
export function stampTexture(text: string) {
  const W = 1024, H = 300
  const [c, ctx] = canvas(W, H)
  const { display } = fonts()
  const rand = rng(3)
  ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 12
  roundRect(ctx, 20, 20, W - 40, H - 40, 18); ctx.stroke()
  ctx.fillStyle = '#1A1A1A'; ctx.textAlign = 'center'
  ctx.font = `800 190px ${display}`
  ctx.fillText(text.toUpperCase(), W / 2, 215)
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.3 + rand() * 0.7})`
    ctx.fillRect(rand() * W, rand() * H, 2 + rand() * 5, 2 + rand() * 4)
  }
  return toTexture(c)
}

/** Bordo dei fogli dentro il fascicolo: righe di carta di colori diversi */
export function pagesTexture() {
  const W = 64, H = 256
  const [c, ctx] = canvas(W, H)
  const cols = ['#F2EDE4', '#E9E2D4', '#F6F1E8', '#EBB1C5', '#F2EDE4', '#DCD5C7', '#9DD4EE', '#F2EDE4']
  const rand = rng(17)
  let y = 0
  while (y < H) {
    const h = 6 + rand() * 12
    ctx.fillStyle = cols[Math.floor(rand() * cols.length)]
    ctx.fillRect(0, y, W, h)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, y + h - 1.5, W, 1.5)
    y += h
  }
  return toTexture(c)
}

/* ── Console ─────────────────────────────────────────────────────────────── */

/** Scheda elettronica: piste dorate, piazzole, serigrafia */
export function pcbTexture() {
  const [c, ctx] = canvas(1024, 1024)
  pcbPaint(ctx, 1024, 1024, fonts().mono)   // la stessa del Game Boy a tutto schermo (consolePaint)
  return toTexture(c)
}

/** Testo spaziato come il letter-spacing del CSS (em: frazione della misura del font) */
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, em: number, center = false) {
  const chars = [...text]
  const gap = size * em
  const widths = chars.map((ch) => ctx.measureText(ch).width)
  let cx = center ? x - (widths.reduce((s, w) => s + w, 0) + gap * (chars.length - 1)) / 2 : x
  const align = ctx.textAlign
  ctx.textAlign = 'left'
  chars.forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += widths[i] + gap })
  ctx.textAlign = align
}

/** Dove stanno le cose sulla base della console, in unita' del mondo (vedi Console3D): x a destra, z verso chi guarda */
export type PadLayout = {
  w: number
  d: number
  brand: number
  keys: { x: number[]; z: number; r: number; lamp: number; label: number }
  stick: { x: number; z: number; r: number; label: number }
  cross: { x: number; z: number; r: number; label: number }
  a: { x: number; z: number }
  b: { x: number; z: number }
  abLabel: number
}

/** Le scritte della pulsantiera (PROGETTI.game.pad) */
type PadPrints = { stick: string; cross: string; spray: string; bike: string; bag: string; brand: string }

/**
 * La faccia della base della console, come la pulsantiera del Game Boy a tutto
 * schermo (GameBoyPad): il nome con ARTISMI, le scritte sotto i tre tasti, sotto
 * la levetta e la croce, A e B. La tela copre la base (PX pixel per unita',
 * centro della base = centro della tela, in alto la cerniera). Fondo trasparente:
 * sotto ci sono la plastica e la scheda.
 */
export function faceTexture(title: string, pad: PadPrints, l: PadLayout) {
  const PX = 1200
  const W = Math.round(l.w * PX), H = Math.round(l.d * PX)
  const [c, ctx] = canvas(W, H)
  const { mono, display } = fonts()
  const X = (x: number) => W / 2 + x * PX
  const Y = (z: number) => H / 2 + z * PX

  // la serigrafia del Game Boy 3D, incisa: un filo di luce sotto ogni scritta
  const ink = 'rgba(70,30,48,0.82)', soft = 'rgba(70,30,48,0.66)'
  const print = (draw: () => void, color: string) => {
    ctx.save(); ctx.translate(0, 2); ctx.fillStyle = 'rgba(255,255,255,0.5)'; draw(); ctx.restore()
    ctx.fillStyle = color; draw()
  }
  ctx.textBaseline = 'middle'

  // il nome, e ARTISMI spaziato accanto
  const big = Math.round(0.046 * PX), tiny = Math.round(0.017 * PX)
  ctx.font = `italic 800 ${big}px ${display}`
  const tw = ctx.measureText(title).width
  ctx.font = `700 ${tiny}px ${mono}`
  const bw = [...pad.brand.toUpperCase()].reduce((s, ch) => s + ctx.measureText(ch).width, 0) + tiny * 0.3 * (pad.brand.length - 1)
  const gap = 0.02 * PX, x0 = X(0) - (tw + gap + bw) / 2
  print(() => { ctx.font = `italic 800 ${big}px ${display}`; ctx.textAlign = 'left'; ctx.fillText(title, x0, Y(l.brand)) }, ink)
  print(() => { ctx.font = `700 ${tiny}px ${mono}`; spaced(ctx, pad.brand.toUpperCase(), x0 + tw + gap, Y(l.brand) + big * 0.08, tiny, 0.3) }, ink)

  // sotto i tre tasti, sotto la levetta e la croce
  const small = Math.round(0.018 * PX)
  const label = (text: string, x: number, z: number) =>
    print(() => { ctx.font = `700 ${small}px ${mono}`; spaced(ctx, text.toUpperCase(), X(x), Y(z), small, 0.1, true) }, soft)
  ;[pad.spray, pad.bike, pad.bag].forEach((t, i) => label(t, l.keys.x[i], l.keys.label))
  label(pad.stick, l.stick.x, l.stick.label)
  label(pad.cross, l.cross.x, l.cross.label)

  // A e B
  const ab = Math.round(0.03 * PX)
  for (const [k, p] of [['A', l.a], ['B', l.b]] as const) {
    print(() => { ctx.font = `800 ${ab}px ${display}`; ctx.textAlign = 'center'; ctx.fillText(k, X(p.x), Y(p.z + l.abLabel)) }, ink)
  }
  return toTexture(c)
}

/**
 * La tesa del coperchio, sopra lo schermo, come quella del Game Boy a tutto
 * schermo: SCHERMO sotto la pillola, la guida dell'interruttore con OFF e ON.
 * Fondo trasparente; la pillola, la levetta dell'interruttore e il display sono
 * pezzi a parte (Console3D).
 * La tela copre la tesa (w × d unita', centro = centro della tela, in alto il bordo).
 */
export function stripTexture(s: { w: number; d: number; pill: number; sw: number }, pad: { off: string; on: string }, screen: string) {
  const PX = 1200
  const W = Math.round(s.w * PX), H = Math.round(s.d * PX)
  const [c, ctx] = canvas(W, H)
  const { mono } = fonts()
  const X = (x: number) => W / 2 + x * PX
  const cy = H / 2
  const pill = (x: number, w: number, h: number, fill: string, dy = 0) => {
    ctx.fillStyle = fill
    roundRect(ctx, X(x - w / 2), cy - h / 2 * PX + dy, w * PX, h * PX, h / 2 * PX)
    ctx.fill()
  }
  // la fessura della pillola e la guida dell'interruttore
  pill(s.pill, 0.1, 0.038, 'rgba(255,255,255,0.55)', 2)
  pill(s.pill, 0.1, 0.038, 'rgba(110,40,65,0.26)')
  pill(s.sw, 0.064, 0.026, 'rgba(255,255,255,0.6)', 2)
  pill(s.sw, 0.064, 0.026, 'rgba(217,142,164,0.85)')
  // le scritte
  const small = Math.round(0.018 * PX)
  ctx.font = `700 ${small}px ${mono}`
  ctx.textBaseline = 'middle'
  const print = (text: string, x: number, y: number, center = false) => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; spaced(ctx, text.toUpperCase(), X(x), y + 2, small, 0.14, center)
    ctx.fillStyle = 'rgba(70,30,48,0.66)'; spaced(ctx, text.toUpperCase(), X(x), y, small, 0.14, center)
  }
  print(screen, s.pill, cy + 0.04 * PX, true)
  print(pad.off, s.sw - 0.072, cy)
  print(pad.on, s.sw + 0.042, cy)
  return toTexture(c)
}

/** Lo stato del gioco per il display: giorno, ora, soldi, ore alla scadenza, stelle (vedi GameBoyPad, Stato) */
type LcdStato = { giorno: string; ora: string; soldi: string; scade: number | null; ricercato: number }

/**
 * Il display nella tesa, come quello del Game Boy a tutto schermo: LCD chiaro
 * con le righe, la cornice scura. Giorno e ora, i soldi, le stelle quando ti
 * cercano; --:-- finche' il gioco non e' caricato. draw(stato) lo ridisegna.
 */
export function lcdTexture() {
  const W = 512, H = 128
  const [c, ctx] = canvas(W, H)
  const tex = toTexture(c)
  const { mono } = fonts()
  const draw = (stato: LcdStato | null) => {
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; roundRect(ctx, 0, 2, W, H - 2, 14); ctx.fill()
    ctx.fillStyle = '#2b2430'; roundRect(ctx, 2, 0, W - 4, H - 6, 12); ctx.fill()
    ctx.fillStyle = '#f4eaee'; roundRect(ctx, 12, 10, W - 24, H - 26, 6); ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    for (let y = 12; y < H - 16; y += 4) ctx.fillRect(12, y, W - 24, 1)
    const g = ctx.createLinearGradient(0, 10, 0, H / 2)
    g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g; ctx.fillRect(12, 10, W - 24, H / 2 - 10)
    ctx.textBaseline = 'middle'
    ctx.font = `700 46px ${mono}`
    const y = (H - 16) / 2 + 3
    if (!stato) {
      ctx.fillStyle = '#2b2430'; ctx.textAlign = 'center'; ctx.fillText('--:--', W / 2, y)
    } else {
      // come la riga del Game Boy a tutto schermo: LUN 21:40 ₤12K ★1
      const parts: [string, string][] = [
        [stato.giorno.slice(0, 3).toUpperCase(), '#2b2430'],
        [stato.ora, stato.scade !== null && stato.scade <= 6 ? '#d22e44' : '#2b2430'],
        [`₤${stato.soldi.replace(/\.000$/, 'K')}`, '#2b2430'],
      ]
      if (stato.ricercato > 0) parts.push([`★${stato.ricercato}`, '#d22e44'])
      ctx.textAlign = 'left'
      const gap = 22
      const widths = parts.map(([t]) => ctx.measureText(t).width)
      let x = (W - widths.reduce((s, w) => s + w, 0) - gap * (parts.length - 1)) / 2
      parts.forEach(([t, col], i) => { ctx.fillStyle = col; ctx.fillText(t, x, y); x += widths[i] + gap })
    }
    tex.needsUpdate = true
  }
  draw(null)
  return { tex, draw }
}

/** Le icone sui tre tasti (24×24, a tratto, quelle della pulsantiera): [percorso, spessore] */
const KEY_ICONS: Record<'bomboletta' | 'bici' | 'zaino', [string, number][]> = {
  bomboletta: [
    ['M9 9h4a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2z', 2],
    ['M8.5 9V6.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V9M10 5.8V4h2.5', 2],
    ['M17.5 4.5h.01M19.5 6.5h.01M19.5 2.5h.01M21 4.5h.01', 2.6],
  ],
  bici: [
    ['M1.7 16a3.8 3.8 0 1 0 7.6 0a3.8 3.8 0 1 0-7.6 0M14.7 16a3.8 3.8 0 1 0 7.6 0a3.8 3.8 0 1 0-7.6 0', 2],
    ['M5.5 16l4.2-7.5h6.6L18.5 16M9.7 8.5L12 16h1.2l3.1-7.5M8.4 6h3', 2],
  ],
  zaino: [
    ['M6 10a6 6 0 0 1 12 0v9.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5z', 2],
    ['M9.5 4.6V3.5h5v1.1M8.5 14.5h7v4h-7zM12 14.5v1.6', 2],
  ],
}

/** L'icona chiara stampata sulla gomma di un tasto, su fondo trasparente */
export function keyIconTexture(k: keyof typeof KEY_ICONS) {
  const S = 128
  const [c, ctx] = canvas(S, S)
  ctx.scale(S / 24, S / 24)
  ctx.strokeStyle = 'rgba(236,230,238,0.92)'
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const [d, w] of KEY_ICONS[k]) { ctx.lineWidth = w; ctx.stroke(new Path2D(d)) }
  return toTexture(c)
}

/** Il numero rosso sullo zaino: le cose da fare qui. draw(n) lo ridisegna */
export function badgeTexture() {
  const S = 64
  const [c, ctx] = canvas(S, S)
  const tex = toTexture(c)
  const { mono } = fonts()
  const draw = (n: number) => {
    ctx.clearRect(0, 0, S, S)
    ctx.fillStyle = 'rgba(249,221,229,0.9)'
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2); ctx.fill()
    const g = ctx.createLinearGradient(0, 4, 0, S - 4)
    g.addColorStop(0, '#ff6b7a'); g.addColorStop(0.5, '#ff4d5e'); g.addColorStop(1, '#d22e44')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.font = `700 ${n > 9 ? 22 : 30}px ${mono}`
    ctx.fillText(n > 9 ? '9+' : String(n), S / 2, S / 2 + 2)
    tex.needsUpdate = true
  }
  return { tex, draw }
}

/** L'alone di una lucina accesa: un punto di luce morbido del suo colore (r, g, b) */
export function haloTexture(r: number, g: number, b: number) {
  const S = 128
  const [c, ctx] = canvas(S, S)
  const gr = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  gr.addColorStop(0, `rgba(${r},${g},${b},0.85)`); gr.addColorStop(0.35, `rgba(${r},${g},${b},0.3)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = gr; ctx.fillRect(0, 0, S, S)
  return toTexture(c)
}

/** Cornice rosa dello schermo (faccia interna del coperchio), come quella del Game Boy a tutto schermo: in alto BATTERY e le righe, la finestra scura, sotto la scritta */
export function bezelTexture(title: string, battery: string, lens: string) {
  const W = 1024, H = 786
  const [c, ctx] = canvas(W, H)
  const { mono, display } = fonts()
  const rand = rng(41)
  ctx.fillStyle = '#E7A6B8'
  roundRect(ctx, 0, 0, W, H, 46); ctx.fill()
  fibres(ctx, null, W, H, rand, 1500, '#f4c8d5', '#c98aa1')
  // finestra scura attorno all'LCD
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#2b2430'); g.addColorStop(1, '#1d1822')
  ctx.fillStyle = g
  roundRect(ctx, 512 - 381, 333 - 262, 762, 524, 16); ctx.fill()
  // in alto: il foro della lucina, BATTERY e le righe fino in fondo
  ctx.fillStyle = 'rgba(70,30,48,0.35)'
  ctx.beginPath(); ctx.arc(60, 38, 13, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(70,30,48,0.75)'
  ctx.font = `700 22px ${mono}`; ctx.textBaseline = 'middle'
  spaced(ctx, battery.toUpperCase(), 86, 39, 22, 0.14)
  const lx = 86 + ctx.measureText(battery.toUpperCase()).width + 22 * 0.14 * battery.length + 18
  ctx.fillStyle = 'rgba(70,30,48,0.7)'
  ctx.fillRect(lx, 31, W - 40 - lx, 4); ctx.fillRect(lx, 43, W - 40 - lx, 2)
  // sotto, la scritta
  ctx.textAlign = 'center'
  ctx.font = `800 30px ${display}`
  ctx.fillText(`${title.toUpperCase()}  ✦  ${lens.toUpperCase()}`, W / 2, H - 48)
  return toTexture(c)
}

/**
 * Lo schermo del Game Boy, con l'accensione come sui Game Boy veri: il logo
 * Artismi scende dall'alto sull'LCD chiaro, si ferma, un lampo, poi la
 * schermata di lancio del gioco (ricostruita con il suo CSS).
 * draw(t) disegna l'istante t (secondi dall'accensione).
 */
export const BOOT_SECONDS = 2.6

export function screenTexture(src: string, logo: HTMLImageElement | null, loading: string, onReady: () => void) {
  // 3:2, come lo schermo della console e la schermata di lancio
  const W = 960, H = 640
  const [c, ctx] = canvas(W, H)
  const tex = toTexture(c)
  const { mono } = fonts()
  let launch: HTMLImageElement | null = null
  // la griglia dei pixel, leggera, e l'ombra dentro la finestra (come nella cornice del gioco)
  // non cambiano: si disegnano una volta, e a ogni fotogramma dell'accensione si ricopiano
  const [glassC, gctx] = canvas(W, H)
  gctx.fillStyle = 'rgba(0,0,0,0.08)'
  for (let y = 0; y < H; y += 4) gctx.fillRect(0, y, W, 1)
  for (let x = 0; x < W; x += 4) gctx.fillRect(x, 0, 1, H)
  gctx.beginPath(); gctx.rect(-60, -60, W + 120, H + 120); gctx.rect(0, 0, W, H)
  gctx.shadowColor = 'rgba(0,0,0,0.6)'; gctx.shadowBlur = 26
  gctx.fillStyle = '#000'; gctx.fill('evenodd')
  const lcd = () => ctx.drawImage(glassC, 0, 0)
  /** load: il caricamento del gioco (gameLoad); finche' non e' pronto lo schermo lo mostra */
  const draw = (t: number, load: { p: number; ready: boolean } = { p: 1, ready: true }) => {
    if (t < 2.1) {
      // LCD chiaro e logo che scende
      ctx.fillStyle = '#F4EAEE'; ctx.fillRect(0, 0, W, H)
      const k = Math.min(1, t / 1.2)
      const ease = 1 - Math.pow(1 - k, 3)
      const lw = W * 0.62, lh = logo ? lw * logo.height / logo.width : 120
      const y = -lh + ease * (H / 2 - lh / 2 + lh) - 30
      if (logo) {
        ctx.drawImage(logo, (W - lw) / 2, y, lw, lh)
        ctx.drawImage(logo, (W - lw) / 2 + 2, y + 1, lw, lh)
      }
      if (t > 1.2) {
        ctx.fillStyle = `rgba(26,26,26,${Math.min(1, (t - 1.2) / 0.3)})`
        ctx.font = `700 28px ${mono}`; ctx.textAlign = 'center'
        ctx.fillText('✦  D E S I G N   S T U D I O  ✦', W / 2, y + lh + 60)
      }
      if (t > 1.85) { ctx.fillStyle = `rgba(255,255,255,${(t - 1.85) / 0.25})`; ctx.fillRect(0, 0, W, H) }
    } else {
      ctx.fillStyle = '#0d0b1a'; ctx.fillRect(0, 0, W, H)
      if (launch) {
        // mentre il gioco si carica la schermata di lancio resta in penombra
        ctx.globalAlpha = Math.min(1, (t - 2.1) / 0.4) * (load.ready ? 1 : 0.32)
        // la schermata di lancio riempie lo schermo senza deformarsi
        const k = Math.max(W / launch.width, H / launch.height)
        ctx.drawImage(launch, (W - launch.width * k) / 2, (H - launch.height * k) / 2, launch.width * k, launch.height * k)
        ctx.globalAlpha = 1
      }
      if (!load.ready) {
        // la schermata di caricamento del gioco: scritta, barra, percentuale
        const p = Math.max(0, Math.min(1, load.p))
        ctx.fillStyle = '#F4EAEE'
        ctx.font = `700 34px ${mono}`; ctx.textAlign = 'center'
        ctx.fillText(loading, W / 2, H / 2 - 40)
        const bw = W * 0.6, bh = 22, bx = (W - bw) / 2, by = H / 2
        ctx.strokeStyle = '#F4EAEE'; ctx.lineWidth = 3
        ctx.strokeRect(bx, by, bw, bh)
        ctx.fillStyle = '#E8A8BF'
        ctx.fillRect(bx + 5, by + 5, (bw - 10) * p, bh - 10)
        ctx.fillStyle = '#F4EAEE'
        ctx.font = `700 40px ${mono}`
        ctx.fillText(`${Math.floor(p * 100)}%`, W / 2, by + bh + 64)
      }
    }
    lcd()
    tex.needsUpdate = true
  }
  draw(BOOT_SECONDS)
  const img = new Image()
  img.onload = () => { launch = img; draw(BOOT_SECONDS); onReady() }
  img.src = src
  return { tex, draw }
}

/** Carica un'immagine e la restituisce quando e' pronta */
export function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.src = src
    // decodificata fuori dal filo principale, prima di servire: se no si decodifica al primo
    // uso, di colpo, mentre la pagina scorre
    img.decode().then(() => resolve(img), () => resolve(img.complete && img.naturalWidth ? img : null))
  })
}
