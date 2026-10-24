/**
 * Texture disegnate su canvas per il tavolo dei Progetti: legno del banco,
 * tappetino da taglio, kraft stampato con la grafica Artismi, etichette,
 * scheda elettronica e schermo della console, righello.
 * Niente immagini da scaricare, a parte il logo e le anteprime gia' sul sito.
 */

import * as THREE from 'three'

/** Seme fisso: il banco e la carta sono gli stessi a ogni visita */
export function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

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

/** Le misure della faccia della console, in unita' del mondo (vedi Console3D) */
export type SlabFace = {
  w: number
  d: number
  /** la finestra: centro (verso il lato lontano = +), misure, raggio, cornice nera e filo chiaro */
  screen: { cy: number; w: number; h: number; r: number; ring: number; rim: number }
  /** la tesa: la sua riga di mezzo, la lucina, le pillole (centri, lunghezza, raggio, riga) e le scritte */
  brow: { cy: number; led: number; pills: number[]; pillLen: number; pillR: number; pillCy: number; labelCy: number }
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

/**
 * La faccia della console, come la cornice del gioco a tutto schermo
 * (GameBoy.module.css): plastica rosa satinata con il suo sfumato e il riflesso
 * in alto a sinistra; nella tesa POWER accanto alla lucina, il nome inciso al
 * centro, SCHERMO ed ESCI sotto le pillole; sotto, la finestra scura con la
 * cornice nera e il filo chiaro. La tela copre esattamente la faccia: PX pixel
 * per unita', centro della faccia = centro della tela, in alto il lato lontano.
 */
export function slabTexture(title: string, labels: string[], f: SlabFace) {
  const PX = 1500
  const W = Math.round(f.w * PX), H = Math.round(f.d * PX)
  const [c, ctx] = canvas(W, H)
  const { display, mono } = fonts()
  const X = (x: number) => W / 2 + x * PX
  const Y = (y: number) => H / 2 - y * PX

  // lo sfumato della plastica (linear-gradient 165deg) e il riflesso (radial-gradient 120% 80% at 20% 0%).
  // Rosa piu' carichi di quelli della cornice: la luce del banco e il tone mapping li schiariscono,
  // e cosi' a schermo tornano gli stessi
  const a = 165 * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a)
  const L = Math.abs(W * dx) + Math.abs(H * dy)
  const g = ctx.createLinearGradient(W / 2 - dx * L / 2, H / 2 - dy * L / 2, W / 2 + dx * L / 2, H / 2 + dy * L / 2)
  g.addColorStop(0, '#f2bccd'); g.addColorStop(0.55, '#e79cb5'); g.addColorStop(1, '#dc86a3')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  ctx.save()
  ctx.translate(W * 0.2, 0); ctx.scale(W * 1.2, H * 0.8)
  const hl = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  // (piu' tenue della cornice: la lampada del banco ci aggiunge il suo riflesso)
  hl.addColorStop(0, 'rgba(255,255,255,0.2)'); hl.addColorStop(0.55, 'rgba(255,255,255,0)')
  ctx.fillStyle = hl; ctx.fillRect(-1, -1, 2, 2)
  ctx.restore()

  // la finestra: filo chiaro, cornice nera, vetro scuro
  const s = f.screen
  const win = (grow: number, fill: string) => {
    ctx.fillStyle = fill
    roundRect(ctx, X(-s.w / 2 - grow), Y(s.cy + s.h / 2 + grow), (s.w + grow * 2) * PX, (s.h + grow * 2) * PX, (s.r + grow) * PX)
    ctx.fill()
  }
  win(s.ring + s.rim, 'rgba(255,255,255,0.35)')
  win(s.ring, '#231c26')
  win(0, '#0d0b1a')

  // la tesa
  const b = f.brow
  const ink = 'rgba(100,34,62,0.85)'
  ctx.textBaseline = 'middle'
  // la lucina nel suo foro, e POWER accanto
  ctx.fillStyle = 'rgba(110,40,65,0.28)'
  ctx.beginPath(); ctx.arc(X(b.led), Y(b.cy), 0.017 * PX, 0, Math.PI * 2); ctx.fill()
  const small = Math.round(0.018 * PX)
  ctx.font = `700 ${small}px ${mono}`
  ctx.fillStyle = ink
  spaced(ctx, 'POWER', X(b.led + 0.03), Y(b.cy), small, 0.18)
  // il nome inciso nella plastica, con il filo di luce sotto
  ctx.textAlign = 'center'
  ctx.font = `800 ${Math.round(0.05 * PX)}px ${display}`
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillText(title, X(0), Y(b.cy) + 3)
  ctx.fillStyle = 'rgba(112,36,68,0.9)'; ctx.fillText(title, X(0), Y(b.cy))
  // le fessure delle pillole, con il filo chiaro sotto, e le scritte
  const label = Math.round(0.016 * PX)
  ctx.font = `700 ${label}px ${mono}`
  b.pills.forEach((px, i) => {
    const slot = (dy: number, fill: string) => {
      ctx.fillStyle = fill
      roundRect(ctx, X(px - b.pillLen / 2 - 0.005), Y(b.pillCy + b.pillR + 0.005) + dy, (b.pillLen + 0.01) * PX, (b.pillR * 2 + 0.01) * PX, (b.pillR + 0.005) * PX)
      ctx.fill()
    }
    slot(2, 'rgba(255,255,255,0.5)')
    slot(0, 'rgba(110,40,65,0.24)')
    ctx.fillStyle = ink
    spaced(ctx, (labels[i] ?? '').toUpperCase(), X(px), Y(b.labelCy), label, 0.16, true)
  })
  return toTexture(c)
}

/** L'alone della lucina accesa: un punto di luce morbido */
export function haloTexture() {
  const S = 128
  const [c, ctx] = canvas(S, S)
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,90,105,0.85)'); g.addColorStop(0.35, 'rgba(255,77,94,0.3)'); g.addColorStop(1, 'rgba(255,77,94,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S)
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
  // 16:10, come lo schermo della console
  const W = 1024, H = 640
  const [c, ctx] = canvas(W, H)
  const tex = toTexture(c)
  const { mono } = fonts()
  let launch: HTMLImageElement | null = null
  const lcd = () => {
    // griglia dei pixel, leggera
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1)
    for (let x = 0; x < W; x += 4) ctx.fillRect(x, 0, 1, H)
    // l'ombra dentro la finestra, come nella cornice del gioco
    ctx.save()
    ctx.beginPath(); ctx.rect(-60, -60, W + 120, H + 120); ctx.rect(0, 0, W, H)
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 26
    ctx.fillStyle = '#000'; ctx.fill('evenodd')
    ctx.restore()
  }
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
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}
