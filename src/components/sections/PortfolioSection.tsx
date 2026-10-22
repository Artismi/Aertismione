'use client'

/**
 * PortfolioSection â€” Mappa con due meccaniche di movimento:
 * 1. CLICK  â€” su qualunque punto â†’ salto parabolico verso quel punto
 * 2. DRAG   â€” tieni premuto sulla pallina e trascina per mirare.
 */

import { useState, useRef, useEffect, type RefObject } from 'react'
import { useRouter } from 'next/navigation'
import styles from './PortfolioSection.module.css'
import { PORTFOLIO, PROGETTI } from '@/config/content'
import dynamic from 'next/dynamic'
import type { TableApi } from '@/components/canvas/table/Table3D'
import { worldHold, consoleScreen } from '@/components/canvas/table/shared'
import { marble } from '@/components/canvas/table/marble'
import { MARBLE_PX } from '@/components/ui/MarblePage'
import { gameLoad } from '@/components/canvas/table/gameLoad'
import { GameBoy, gameWarmable, type Rect } from '@/components/ui/GameBoy'

// Il tavolo in 3D si carica solo nel browser, a parte dal resto della pagina
const Table3D = dynamic(() => import('@/components/canvas/table/Table3D'), { ssr: false })

/* â”€â”€â”€ Costanti â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

// la bilia 3D sul tabellone (Marble3D: 0,125 × 0,6 unita', il tabellone e' largo 4,46 su 1200)
const BALL_R        = 20
const FOLDER_KEY    = 'artismi:fascicolo-aperto'   // il fascicolo era aperto quando si e' andati a un lavoro
const FOLDER_HIT_R  = 74   // raggio collisione/hover cartellina (a misura piena)

/** Con tanti lavori le cartelline si stringono: misura in base allo spazio tra una e l'altra */
function folderScale(w: number, h: number) {
  return Math.max(0.5, Math.min(1, (Math.min(w, h) * 0.27) / 160))
}
const FRICTION      = 0.972
const MIN_SPEED     = 0.07
const MAX_LAUNCH    = 38
// Il tabellone e' la tavola stesa sul fascicolo 3D aperto: misura fissa, con le
// stesse proporzioni della tavola (BW : BD in Folder3D)
const MAP_W         = 1200
const MAP_H         = 775
// pixel del canvas per unita' del tabellone. La texture si ricarica solo quando la
// mappa cambia (la pallina e' la bilia 3D, non si disegna qui); a 1,5 la scheda
// video emulata del test si spegneva: meglio non rischiare sui telefoni deboli
const MAP_SCALE     = 1

/* â”€â”€â”€ Tipi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type Project = typeof PORTFOLIO.projects[number]

interface Ball { x: number; y: number; vx: number; vy: number; rotation: number }

interface JumpState {
  fromX: number; fromY: number; toX: number; toY: number
  startTime: number; duration: number; arcHeight: number
  scaleX: number; scaleY: number; arcNorm: number
  landed: boolean; projectId: string
  /** Velocita' da dare alla pallina dopo l'atterraggio (uscita dalla piega) */
  thenVx?: number; thenVy?: number
}

/**
 * Il tavolo: la cartellina si apre in piu' tempi.
 * closed → sliding (scivola a destra) → opening (la copertina si apre a sinistra)
 * → open (dentro c'e' la mappa) → closing → returning → closed.
 * Da telefono basta socchiuderla: 'list' mostra l'elenco di schede.
 */
type Phase = 'closed' | 'sliding' | 'opening' | 'open' | 'closing' | 'returning' | 'list'

const SLIDE_MS = 650
const COVER_MS = 800
const FADE_MS  = 280
const OPEN_MS  = 1150 // coperchio alzato e schermo acceso

interface Particle { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }

/* â”€â”€â”€ Dati â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const PROJECTS: Project[] = PORTFOLIO.projects as unknown as Project[]

const ZONE_JITTER = PROJECTS.map((p) => {
  const seed = p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return Array.from({ length: 9 }, (_, i) => 0.68 + ((seed * (i+1) * 137 + 41) % 100) / 175)
})

/** Le anteprime che spuntano dal fascicolo chiuso */
// Da telefono il tabellone e' in verticale (il fascicolo aperto si guarda girato
// di 90°): le stesse cartelline, con le coordinate scambiate
const PROJECTS_TALL: Project[] = PROJECTS.map((p) => ({ ...p, mapX: p.mapY, mapY: p.mapX }))

const THUMBS = PROJECTS
  .map((p) => (p as { thumb?: string }).thumb)
  .filter((t): t is string => Boolean(t))
  .slice(0, 4)

const PATH_PAIRS: [number, number][] = [
  [0,2],[2,4],[4,6],[6,8],[8,0],
  [1,3],[3,5],[5,7],[7,9],[9,1],
  [0,5],[2,7],[4,9],
]

/* â”€â”€â”€ Utility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

/* â”€â”€â”€ Disegno: sfondo con hex dots + reveal radiale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, reveal: number) {
  if (reveal <= 0) return
  const maxR = Math.hypot(w/2, h/2) * Math.min(reveal * 1.35, 1)
  const cx = w/2, cy = h/2, sp = 29, rowH = sp * 0.866
  // Dot rosa tenue visibili su sfondo scuro
  ctx.fillStyle = 'rgba(236,230,224,0.075)'
  for (let row = 0; row * rowH <= h + rowH; row++) {
    const y = row * rowH, xOff = (row % 2) * sp * 0.5
    for (let col = -1; col * sp <= w + sp; col++) {
      const x = col * sp + xOff
      if (Math.hypot(x - cx, y - cy) > maxR) continue
      const seed = ((row*31 + col*17 + 7) % 100 + 100) % 100
      ctx.beginPath(); ctx.arc(x, y, 0.85 + (seed/100)*1.1, 0, Math.PI*2); ctx.fill()
    }
  }
}

function drawMapDecorations(ctx: CanvasRenderingContext2D, w: number, h: number, touch: boolean) {
  const cx = w-44, cy = 44, r = 14
  ctx.strokeStyle = 'rgba(242,237,228,0.30)'; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.moveTo(cx, cy-r); ctx.lineTo(cx, cy+r); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx-r, cy); ctx.lineTo(cx+r, cy); ctx.stroke()
  const rd = r * 0.62
  ctx.strokeStyle = 'rgba(242,237,228,0.15)'
  for (const a of [Math.PI/4, -Math.PI/4, 3*Math.PI/4, -3*Math.PI/4]) {
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*rd*0.3, cy+Math.sin(a)*rd*0.3)
    ctx.lineTo(cx+Math.cos(a)*rd, cy+Math.sin(a)*rd); ctx.stroke()
  }
  ctx.beginPath(); ctx.moveTo(cx, cy-r); ctx.lineTo(cx-4, cy); ctx.lineTo(cx+4, cy)
  ctx.closePath(); ctx.fillStyle = 'rgba(232,168,191,0.75)'; ctx.fill()
  ctx.font = 'bold 7px "JetBrains Mono",monospace'
  ctx.fillStyle = 'rgba(242,237,228,0.60)'; ctx.textAlign = 'center'
  ctx.fillText('N', cx, cy-r-5)
  ctx.font = '600 7.5px "JetBrains Mono",monospace'
  ctx.fillStyle = 'rgba(242,237,228,0.25)'; ctx.textAlign = 'left'
  ctx.fillText('ARTISMI STUDIO', 14, h-12)
  // le istruzioni sono stampate sul tabellone, come su un gioco da tavolo
  ctx.font = '600 11px "JetBrains Mono",monospace'
  ctx.fillStyle = 'rgba(242,237,228,0.5)'; ctx.textAlign = 'right'
  ctx.fillText(touch
    ? 'TOCCA PER SALTARE — TRASCINA LA PALLINA PER SPARARLA'
    : 'CLICCA PER SALTARE — TRASCINA LA PALLINA PER SPARARLA COME UNA BILIA', w-18, h-14)
}

function drawZone(ctx: CanvasRenderingContext2D, p: Project, jitter: number[], w: number, h: number) {
  // le zone si stringono con il numero dei lavori (erano pensate per sei)
  const cx = p.mapX*w, cy = p.mapY*h, r = Math.min(w,h)*0.155*Math.min(1, Math.sqrt(6/PROJECTS.length)), N = jitter.length
  const [rr,gg,bb] = hexToRgb(p.accent)
  ctx.beginPath()
  for (let i = 0; i <= N; i++) {
    const a=(i/N)*Math.PI*2, na=((i+1)/N)*Math.PI*2
    const j=jitter[i%N], jn=jitter[(i+1)%N]
    const x1=cx+Math.cos(a)*r*j, y1=cy+Math.sin(a)*r*j
    const x2=cx+Math.cos(na)*r*jn, y2=cy+Math.sin(na)*r*jn
    const cpx=cx+Math.cos((a+na)/2)*r*j*1.08, cpy=cy+Math.sin((a+na)/2)*r*j*1.08
    if (i===0) ctx.moveTo(x1,y1); ctx.quadraticCurveTo(cpx,cpy,x2,y2)
  }
  ctx.closePath()
  const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r)
  grad.addColorStop(0,   `rgba(${rr},${gg},${bb},0.12)`)
  grad.addColorStop(0.6, `rgba(${rr},${gg},${bb},0.05)`)
  grad.addColorStop(1,   `rgba(${rr},${gg},${bb},0)`)
  ctx.fillStyle = grad; ctx.fill()
}

function drawPaths(ctx: CanvasRenderingContext2D, projects: Project[], w: number, h: number) {
  ctx.setLineDash([5,10]); ctx.lineCap = 'round'; ctx.lineWidth = 1.3
  for (const [a,b] of PATH_PAIRS) {
    if (!projects[a] || !projects[b]) continue
    const p1=projects[a], p2=projects[b]
    const x1=p1.mapX*w, y1=p1.mapY*h, x2=p2.mapX*w, y2=p2.mapY*h
    const mx=(x1+x2)/2, my=(y1+y2)/2, dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy)
    ctx.strokeStyle = 'rgba(236,230,224,0.14)'
    ctx.beginPath(); ctx.moveTo(x1,y1)
    ctx.quadraticCurveTo(mx-(dy/len)*len*0.16, my+(dx/len)*len*0.16, x2,y2); ctx.stroke()
  }
  ctx.setLineDash([])
}

/* Cache delle anteprime disegnate dentro le cartelline (file leggeri, ~30KB) */
const thumbCache = new Map<string, HTMLImageElement>()

function getThumb(src?: string): HTMLImageElement | null {
  if (!src || typeof window === 'undefined') return null
  const cached = thumbCache.get(src)
  if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null
  const img = new window.Image()
  img.src = src
  thumbCache.set(src, img)
  return null
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** Manda a capo il titolo su massimo 2 righe, troncando con "…" se non ci sta. */
function wrapTitle(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  if (ctx.measureText(text).width <= maxW) return [text]
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word
    if (ctx.measureText(next).width <= maxW) { cur = next; continue }
    if (cur) lines.push(cur)
    cur = word
    if (lines.length === 2) break
  }
  if (cur && lines.length < 2) lines.push(cur)
  if (lines.length === 2 && ctx.measureText(lines[1]).width > maxW) {
    let t = lines[1]
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1)
    lines[1] = `${t}…`
  }
  return lines.slice(0, 2)
}

function drawFolder(ctx: CanvasRenderingContext2D, p: Project, w: number, h: number, isHovered: boolean) {
  const cx = p.mapX*w, cy = p.mapY*h
  const [cr,cg,cb] = hexToRgb(p.accent)
  const seed = p.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)
  const tilt = ((seed*73)%100-50)/100*0.10
  // Cartelline piu' grandi: si vede l'anteprima e invogliano ad aprirle
  const fw=154, fh=118, br=5
  const lift = isHovered ? -10 : 0
  const bx=-fw/2, by=-fh/2

  ctx.save()
  ctx.translate(cx, cy+lift)
  ctx.rotate(tilt)
  const fs = folderScale(w, h); ctx.scale(fs, fs)

  // Alone attorno alla cartellina: fermo (la mappa si ridisegna solo quando cambia
  // qualcosa), si accende sotto il puntatore
  const pulse = 0.5
  ctx.beginPath()
  ctx.arc(0, 0, 88 + (isHovered ? 0 : pulse*9), 0, Math.PI*2)
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},${isHovered ? 0.45 : (0.06+pulse*0.08).toFixed(3)})`
  ctx.lineWidth = isHovered ? 2.2 : 1.2; ctx.stroke()

  // Linguetta con la categoria
  // shadowBlur in canvas 2D e' costoso: lo accendiamo solo sulla cartellina
  // sotto il puntatore, le altre tengono un'ombra netta che non costa nulla.
  ctx.shadowColor = `rgba(0,0,0,${isHovered?0.60:0.32})`
  ctx.shadowBlur = isHovered ? 26 : 0
  ctx.shadowOffsetX = 2; ctx.shadowOffsetY = isHovered ? 12 : 5
  // La linguetta si adatta alla lunghezza della categoria (prima il testo usciva fuori)
  const catLabel = p.category.toUpperCase()
  ctx.font='bold 6.5px "JetBrains Mono",monospace'
  const tabW = Math.min(fw-10, Math.max(40, ctx.measureText(catLabel).width + 18))
  ctx.beginPath()
  ctx.moveTo(bx,          by)
  ctx.lineTo(bx+tabW,     by)
  ctx.lineTo(bx+tabW-7,   by-15)
  ctx.lineTo(bx+5,        by-15)
  ctx.closePath()
  ctx.fillStyle = p.accent; ctx.fill()
  ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0

  ctx.textAlign='left'
  ctx.fillStyle='rgba(255,255,255,0.92)'
  ctx.fillText(catLabel, bx+8, by-5)

  // Corpo cartella — grafite scuro neutro (non piu' viola)
  ctx.shadowColor=`rgba(0,0,0,${isHovered?0.50:0.26})`
  ctx.shadowBlur=isHovered?20:0; ctx.shadowOffsetY=isHovered?9:4
  roundRectPath(ctx, bx, by, fw, fh, br)
  const bodyGrad = ctx.createLinearGradient(bx, by, bx+fw, by+fh)
  bodyGrad.addColorStop(0, 'rgba(32, 29, 36, 0.98)')
  bodyGrad.addColorStop(1, 'rgba(17, 15, 21, 0.98)')
  ctx.fillStyle=bodyGrad; ctx.fill()
  ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0

  // Anteprima del progetto dentro la cartellina
  const pad = 4, stripH = 24
  const px = bx+pad, py = by+pad, pw = fw-pad*2, ph = fh-pad*2-stripH
  const thumb = getThumb((p as { thumb?: string }).thumb)
  if (thumb) {
    ctx.save()
    roundRectPath(ctx, px, py, pw, ph, 2)
    ctx.clip()
    const ar = thumb.naturalWidth/thumb.naturalHeight, tr = pw/ph
    let sw: number, sh: number, sx: number, sy: number
    if (ar > tr) { sh = thumb.naturalHeight; sw = sh*tr; sx = (thumb.naturalWidth-sw)/2; sy = 0 }
    else         { sw = thumb.naturalWidth;  sh = sw/tr; sx = 0; sy = (thumb.naturalHeight-sh)/2 }
    ctx.drawImage(thumb, sx, sy, sw, sh, px, py, pw, ph)
    // Velo scuro a riposo, foto piena al passaggio del mouse
    ctx.fillStyle = isHovered ? 'rgba(10,8,14,0.05)' : 'rgba(10,8,14,0.24)'
    ctx.fillRect(px, py, pw, ph)
    ctx.restore()
  } else {
    // Nessuna anteprima disponibile: righe finte come prima
    ctx.strokeStyle='rgba(242,237,228,0.10)'; ctx.lineWidth=1
    for (let i=0;i<4;i++) {
      ctx.beginPath(); ctx.moveTo(px+7, py+13+i*12); ctx.lineTo(px+pw-16, py+13+i*12); ctx.stroke()
    }
  }

  // Bordo (glow sull'hover)
  if (isHovered) { ctx.shadowColor=`rgba(${cr},${cg},${cb},0.60)`; ctx.shadowBlur=16 }
  roundRectPath(ctx, bx, by, fw, fh, br)
  ctx.strokeStyle=isHovered ? p.accent : 'rgba(242,237,228,0.55)'
  ctx.lineWidth=isHovered?2.2:1.3; ctx.stroke()
  ctx.shadowBlur=0

  // Dog-ear
  const dex=fw/2, dey=fh/2, ds=12
  ctx.beginPath()
  ctx.moveTo(dex-ds, dey); ctx.lineTo(dex, dey-ds); ctx.lineTo(dex, dey)
  ctx.closePath()
  ctx.fillStyle=`rgba(${cr},${cg},${cb},0.55)`; ctx.fill()

  // Titolo nella fascia bassa, mandato a capo se serve (niente piu' testo che esce)
  ctx.textAlign='left'
  ctx.fillStyle='#FFFFFF'
  ctx.font='600 10.5px "Space Grotesk", sans-serif'
  const lines = wrapTitle(ctx, p.title.toUpperCase(), fw-26)
  if (lines.length === 1) {
    ctx.fillText(lines[0], bx+8, by+fh-8)
  } else {
    ctx.font='600 9px "Space Grotesk", sans-serif'
    const l2 = wrapTitle(ctx, p.title.toUpperCase(), fw-26)
    ctx.fillText(l2[0], bx+8, by+fh-13)
    if (l2[1]) ctx.fillText(l2[1], bx+8, by+fh-4)
  }

  // Pallino accent
  ctx.beginPath(); ctx.arc(bx+fw-10, by+fh-11, 3.2, 0, Math.PI*2)
  ctx.fillStyle=p.accent; ctx.fill()

  ctx.restore()
}


function drawTrail(ctx: CanvasRenderingContext2D, trail: Array<{x:number;y:number;speed:number}>) {
  if (trail.length === 0) return
  const prev = ctx.globalCompositeOperation
  // Screen = additivo su sfondo scuro → fuoco vero, non overlay opaco
  ctx.globalCompositeOperation = 'screen'

  for (let i = 0; i < trail.length; i++) {
    const t = i / trail.length          // 0 = coda lontana, 1 = vicino alla pallina
    const spd = Math.min(trail[i].speed, MAX_LAUNCH) / MAX_LAUNCH
    if (spd < 0.06) continue
    const { x, y } = trail[i]

    // Bloom viola — strato esterno
    const bloomR = Math.max(3, BALL_R * (0.22 + t * 1.05))
    const bloom = ctx.createRadialGradient(x, y, 0, x, y, bloomR)
    bloom.addColorStop(0,   `rgba(140,55,210,${(t * 0.52 * spd).toFixed(3)})`)
    bloom.addColorStop(0.55,`rgba(90,25,160,${(t * 0.28 * spd).toFixed(3)})`)
    bloom.addColorStop(1,   'rgba(60,10,120,0)')
    ctx.beginPath(); ctx.arc(x, y, bloomR, 0, Math.PI*2)
    ctx.fillStyle = bloom; ctx.fill()

    // Mid pink
    const midR = bloomR * 0.52
    const mid = ctx.createRadialGradient(x, y, 0, x, y, midR)
    mid.addColorStop(0,   `rgba(240,75,195,${(t * 0.65 * spd).toFixed(3)})`)
    mid.addColorStop(0.6, `rgba(180,40,155,${(t * 0.30 * spd).toFixed(3)})`)
    mid.addColorStop(1,   'rgba(140,20,120,0)')
    ctx.beginPath(); ctx.arc(x, y, midR, 0, Math.PI*2)
    ctx.fillStyle = mid; ctx.fill()

    // Core bianco-caldo — solo ultimo 38% della scia
    if (t > 0.62) {
      const ct = (t - 0.62) / 0.38
      const cR = midR * 0.38
      ctx.beginPath(); ctx.arc(x, y, cR, 0, Math.PI*2)
      ctx.fillStyle = `rgba(255,215,255,${(ct * 0.88 * spd).toFixed(3)})`; ctx.fill()
    }
  }

  ctx.globalCompositeOperation = prev
}

function drawSlingshot(
  ctx: CanvasRenderingContext2D,
  ball: Ball, origin: { x: number; y: number },
  w: number, h: number,
) {
  const dx = origin.x - ball.x
  const dy = origin.y - ball.y
  const dist = Math.hypot(dx, dy)
  if (dist < 4) return

  const spd = Math.min(dist * 0.22, MAX_LAUNCH)
  const powerPct = spd / MAX_LAUNCH

  const perpX = (-dy / dist) * 9, perpY = (dx / dist) * 9
  const alpha = 0.55 + powerPct * 0.35
  const prevComp = ctx.globalCompositeOperation
  ctx.globalCompositeOperation = 'screen'
  ctx.lineCap = 'round'; ctx.lineWidth = 2.4
  ctx.strokeStyle = `rgba(255,80,215,${alpha.toFixed(3)})`
  ctx.beginPath()
  ctx.moveTo(origin.x - perpX * 0.55, origin.y - perpY * 0.55)
  ctx.lineTo(ball.x - perpX, ball.y - perpY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(origin.x + perpX * 0.55, origin.y + perpY * 0.55)
  ctx.lineTo(ball.x + perpX, ball.y + perpY)
  ctx.stroke()

  ctx.beginPath(); ctx.arc(origin.x, origin.y, 4.5, 0, Math.PI*2)
  ctx.fillStyle = `rgba(255,80,215,${(0.65 + powerPct*0.25).toFixed(3)})`; ctx.fill()

  ctx.beginPath()
  ctx.arc(ball.x, ball.y, BALL_R + 6 + powerPct * 16, 0, Math.PI*2)
  ctx.strokeStyle = `rgba(200,70,210,${(0.28 + powerPct * 0.42).toFixed(3)})`
  ctx.lineWidth = 1.6; ctx.stroke()

  ctx.globalCompositeOperation = prevComp
  let px = origin.x, py = origin.y
  let pvx = (dx / dist) * spd, pvy = (dy / dist) * spd
  const m = BALL_R + 2
  ctx.globalCompositeOperation = 'screen'
  for (let i = 1; i <= 32; i++) {
    px += pvx; py += pvy
    pvx *= FRICTION; pvy *= FRICTION
    if (px < m || px > w - m) pvx *= -0.72
    if (py < m || py > h - m) pvy *= -0.72
    if (Math.hypot(pvx, pvy) < 0.4) break
    const a = (1 - i / 32) * 0.55
    const r = Math.max(1.2, 3.8 - i * 0.09)
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2)
    ctx.fillStyle = `rgba(200,70,210,${a.toFixed(3)})`; ctx.fill()
  }
  ctx.globalCompositeOperation = prevComp
}

/**
 * La bilia disegnata sulla mappa quando la tavola e' piatta sulla pagina (il 3D
 * e' fermo): lo stesso vetro ambra di Marble3D. Ombra a terra, corpo trasparente
 * che si scurisce verso il bordo, la luce che la attraversa e si raccoglie in
 * basso, il riflesso in alto. lift: quanto e' alta nel salto (unita' della mappa).
 */
function drawBall(ctx: CanvasRenderingContext2D, ball: Ball, lift: number, R = BALL_R) {
  const x = ball.x, y = ball.y - lift
  // l'ombra resta a terra e si allarga e schiarisce quando la bilia si alza
  const up = Math.min(lift / 120, 1)
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(ball.x + R*0.35, ball.y + R*0.55, R*(1.05 + up*0.4), R*(0.42 + up*0.15), 0, 0, Math.PI*2)
  ctx.fillStyle = `rgba(20,10,4,${(0.42 - up*0.25).toFixed(3)})`
  ctx.filter = 'blur(3px)'; ctx.fill(); ctx.filter = 'none'
  // la luce che passa nel vetro e cade sul tabellone, calda
  const caustic = ctx.createRadialGradient(ball.x + R*0.5, ball.y + R*0.4, 0, ball.x + R*0.5, ball.y + R*0.4, R*0.9)
  caustic.addColorStop(0, `rgba(255,190,110,${(0.35 - up*0.25).toFixed(3)})`)
  caustic.addColorStop(1, 'rgba(255,190,110,0)')
  ctx.fillStyle = caustic
  ctx.beginPath(); ctx.arc(ball.x + R*0.5, ball.y + R*0.4, R*0.9, 0, Math.PI*2); ctx.fill()

  // vetro trasparente, come la bilia del banco: la tavola si vede attraverso,
  // schiarita (la luce passa nel vetro); piu' spesso e piu' ambra verso il bordo
  const prev = ctx.globalCompositeOperation
  ctx.globalCompositeOperation = 'screen'
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,214,170,0.22)'; ctx.fill()
  ctx.globalCompositeOperation = prev
  const body = ctx.createRadialGradient(x, y, 0, x, y, R)
  body.addColorStop(0,    'rgba(243,166,106,0.06)')
  body.addColorStop(0.5,  'rgba(243,166,106,0.1)')
  body.addColorStop(0.78, 'rgba(214,120,62,0.3)')
  body.addColorStop(0.91, 'rgba(150,66,24,0.5)')
  body.addColorStop(0.96, 'rgba(255,240,225,0.75)')
  body.addColorStop(1,    'rgba(255,255,255,0.35)')
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2)
  ctx.fillStyle = body; ctx.fill()

  // la luce raccolta in basso, calda
  const refr = ctx.createRadialGradient(x + R*0.2, y + R*0.48, 0, x + R*0.2, y + R*0.48, R*0.5)
  refr.addColorStop(0, 'rgba(255,226,190,0.6)')
  refr.addColorStop(1, 'rgba(255,226,190,0)')
  ctx.fillStyle = refr
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2); ctx.fill()

  // i riflessi in alto: la finestra dello studio, come sul banco
  ctx.beginPath(); ctx.ellipse(x - R*0.32, y - R*0.48, R*0.32, R*0.16, -0.35, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill()
  ctx.beginPath(); ctx.ellipse(x + R*0.16, y - R*0.56, R*0.1, R*0.08, 0, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill()
  ctx.restore()
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  if (particles.length === 0) return
  const prev = ctx.globalCompositeOperation
  ctx.globalCompositeOperation = 'screen'
  for (const p of particles) {
    const [rr,gg,bb] = hexToRgb(p.color)
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
    ctx.fillStyle=`rgba(${rr},${gg},${bb},${Math.max(0,p.alpha).toFixed(3)})`; ctx.fill()
  }
  ctx.globalCompositeOperation = prev
}

export function PortfolioSection() {
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  const sectionRef    = useRef<HTMLDivElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const wrapperRef    = useRef<HTMLDivElement>(null)
  const rafRef        = useRef<number | null>(null)
  const sizeRef       = useRef({ w: 0, h: 0 })

  const ballRef       = useRef<Ball>({ x: 0, y: 0, vx: 0, vy: 0, rotation: 0 })
  const jumpRef       = useRef<JumpState | null>(null)
  const trailRef      = useRef<Array<{x:number;y:number;speed:number}>>([])
  const particlesRef  = useRef<Particle[]>([])
  const hoveredRef    = useRef<string | null>(null)
  const startTimeRef  = useRef(0)
  const redrawRef     = useRef(true)               // la mappa va ridisegnata
  const drawnHoverRef = useRef<string | null>(null) // la cartellina accesa nell'ultimo disegno
  const drawnFlatRef  = useRef(false)               // l'ultimo disegno era per la tavola piatta (con la bilia)
  const gridRevealRef = useRef(0)
  const inViewRef     = useRef(false)
  const openRef       = useRef(false)
  const flatRef       = useRef({ last: [0, 0, 0, 0, 0, 0], still: 0 })   // still: da quando la tavola e' ferma (ms)
  const desktopRef    = useRef(false)
  const projRef       = useRef<Project[]>(PROJECTS)   // le cartelline, nel verso del tabellone
  const timersRef     = useRef<number[]>([])
  const tableRef      = useRef<TableApi | null>(null)   // il tabellone nel 3D: texture e punto sotto il mouse
  const [desktop, setDesktop] = useState(true)

  const [phase, setPhase] = useState<Phase>('closed')
  const [grab, setGrab]   = useState(false)

  const isDraggingRef       = useRef(false)
  const dragPosRef          = useRef({ x: 0, y: 0 })
  const dragOriginRef       = useRef({ x: 0, y: 0 })
  const collisionCooldownRef = useRef(0)
  // la bilia apre un lavoro solo se l'hai tirata tu: i rimbalzi da soli (all'apertura) no
  const shotRef = useRef(false)

  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router

  useEffect(() => {
    const canvas=canvasRef.current, wrapper=wrapperRef.current
    if (!canvas||!wrapper) return
    const wrapperEl = wrapper
    // il tabellone ha misura fissa: e' la texture dentro il fascicolo. Da telefono
    // lo si disegna in verticale (MAP_H × MAP_W) e ruotato nella texture (vedi loop)
    canvas.width=MAP_W*MAP_SCALE; canvas.height=MAP_H*MAP_SCALE
    function resize() {
      const w=wrapperEl.clientWidth
      const desk = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches
      if (desk !== desktopRef.current || sizeRef.current.w === 0) {
        desktopRef.current = desk
        sizeRef.current = desk ? {w:MAP_W,h:MAP_H} : {w:MAP_H,h:MAP_W}
        projRef.current = desk ? PROJECTS : PROJECTS_TALL
        ballRef.current.x=sizeRef.current.w/2; ballRef.current.y=sizeRef.current.h/2
      }
      setDesktop(desk)
      // il riquadro del tavolo; da telefono e' in verticale: fascicolo sopra, console sotto
      wrapperEl.style.height = desktopRef.current
        ? `${Math.min(620, Math.max(380, Math.round(w * 0.54)))}px`
        : `${Math.round(Math.min(720, Math.max(520, w * 1.45)))}px`
    }
    resize()
    const ro=new ResizeObserver(resize); ro.observe(wrapper)
    return ()=>ro.disconnect()
  }, [])

  useEffect(() => {
    const section=sectionRef.current; if (!section) return
    const io=new IntersectionObserver(([e])=>{inViewRef.current=e.isIntersecting},{threshold:0.05})
    io.observe(section); return ()=>io.disconnect()
  }, [])

  useEffect(() => {
    const canvas=canvasRef.current; if (!canvas) return
    const canvasLoop = canvas
    startTimeRef.current=performance.now()

    function loop(now: number) {
      const ctx=canvasLoop.getContext('2d')
      if (!ctx) { rafRef.current=requestAnimationFrame(loop); return }
      const {w,h}=sizeRef.current
      if (w===0) { rafRef.current=requestAnimationFrame(loop); return }

      const PROJ=projRef.current, desk=desktopRef.current
      // da telefono il tabellone si disegna in verticale e si ruota nella texture:
      // (x, y) del disegno → (y, MAP_H - x) del canvas, che resta orizzontale
      if (desk) ctx.setTransform(MAP_SCALE,0,0,MAP_SCALE,0,0)
      else ctx.setTransform(0,-MAP_SCALE,MAP_SCALE,0,0,MAP_H*MAP_SCALE)
      const ball=ballRef.current

      // La mappa si vede solo a fascicolo aperto: entra piano, esce svelta
      const visible = inViewRef.current && openRef.current
      gridRevealRef.current+=((visible?1:0)-gridRevealRef.current)*(visible?0.06:0.2)

      // Sezione fuori schermo o fascicolo chiuso: si salta tutto il disegno.
      // Prima la mappa continuava a ridisegnare cartelline, ombre, scia e
      // particelle 60 volte al secondo anche mentre si guardava tutt'altra
      // parte del sito: era una tassa costante che faceva scattare 3D,
      // cursore e video.
      if (!visible && gridRevealRef.current < 0.02) {
        showFlat(canvasLoop)   // si toglie la tavola dalla pagina, se c'era
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      const js=jumpRef.current

      if (js && !js.landed) {
        const t=Math.min((now-js.startTime)/js.duration, 1)
        const eased=t<0.5?2*t*t:-1+(4-2*t)*t
        // l'arco del salto e' un'altezza vera: la bilia 3D si alza dal tabellone
        ball.x=js.fromX+(js.toX-js.fromX)*eased
        ball.y=js.fromY+(js.toY-js.fromY)*t
        ball.rotation+=(Math.abs(js.toX-js.fromX)/js.duration)*0.06
        js.arcNorm=4*t*(1-t)
        if      (t<0.44)  { js.scaleX=0.81; js.scaleY=1.24 }
        else if (t<0.72)  { const p=(t-0.44)/0.28; js.scaleX=0.81+0.19*p; js.scaleY=1.24-0.24*p }
        else if (t>0.87)  { const p=(t-0.87)/0.13; js.scaleX=1+0.48*p; js.scaleY=1-0.44*p }
        else              { js.scaleX=1; js.scaleY=1 }
        if (t>=1) {
          ball.x=js.toX; ball.y=js.toY
          js.scaleX=1.6; js.scaleY=0.50; js.landed=true
          const proj=PROJ.find(p=>p.id===js.projectId)
          if (proj) {
            for (let i=0; i<12; i++) {
              const a=(i/12)*Math.PI*2+Math.random()*0.4, spd=2.5+Math.random()*5
              particlesRef.current.push({x:ball.x,y:ball.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-2,r:3+Math.random()*3.5,alpha:0.9,color:proj.accent})
            }
            const fire=['#FFD9A8','#F3A66A','#C8860A','#FFF0E2']   // le scintille della bilia ambra
            for (let i=0; i<16; i++) {
              const a=Math.random()*Math.PI*2, spd=2+Math.random()*8
              particlesRef.current.push({x:ball.x,y:ball.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-3,r:1.5+Math.random()*3,alpha:1,color:fire[i%fire.length]})
            }
          }
          setTimeout(()=>{
            if (jumpRef.current) { jumpRef.current.scaleX=1; jumpRef.current.scaleY=1 }
            setTimeout(()=>{
              jumpRef.current=null
              if (proj) goProject(proj.id)
              else if (js.thenVx !== undefined) { ball.vx=js.thenVx; ball.vy=js.thenVy ?? 0 }
            }, 340)
          }, 120)
        }
      } else if (!js && isDraggingRef.current) {
        ball.x = dragPosRef.current.x
        ball.y = dragPosRef.current.y
        ball.vx = 0; ball.vy = 0
        trailRef.current = []
      } else if (!js && !isDraggingRef.current) {
        ball.x+=ball.vx; ball.y+=ball.vy
        ball.vx*=FRICTION; ball.vy*=FRICTION
        const spd=Math.hypot(ball.vx,ball.vy)
        ball.rotation+=spd*0.055
        if (spd<MIN_SPEED){ball.vx=0;ball.vy=0;shotRef.current=false}   // tiro finito
        const m=BALL_R+2
        if(ball.x<m){ball.x=m;ball.vx*=-0.72}
        if(ball.x>w-m){ball.x=w-m;ball.vx*=-0.72}
        if(ball.y<m){ball.y=m;ball.vy*=-0.72}
        if(ball.y>h-m){ball.y=h-m;ball.vy*=-0.72}
        if (spd>0.6) {
          trailRef.current.push({x:ball.x,y:ball.y,speed:spd})
          if (trailRef.current.length>28) trailRef.current.shift()
        } else if (trailRef.current.length>0) { trailRef.current.shift() }

        if (now - collisionCooldownRef.current > 900) {
          for (const p of PROJ) {
            const d=Math.hypot(ball.x-p.mapX*w, ball.y-p.mapY*h)
            if (d < FOLDER_HIT_R*folderScale(w,h)) {
              collisionCooldownRef.current=now
              const ang=Math.atan2(ball.y-p.mapY*h, ball.x-p.mapX*w)
              ball.vx=Math.cos(ang)*6; ball.vy=Math.sin(ang)*6
              for (let i=0;i<10;i++) {
                const a=(i/10)*Math.PI*2+Math.random()*0.4, sp=2+Math.random()*4
                particlesRef.current.push({x:ball.x,y:ball.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.5,r:2.5+Math.random()*3,alpha:0.85,color:p.accent})
              }
              const fire=['#FFD9A8','#F3A66A','#C8860A']
              for (let i=0;i<12;i++) {
                const a=Math.random()*Math.PI*2, sp=1.5+Math.random()*5.5
                particlesRef.current.push({x:ball.x,y:ball.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,r:1.2+Math.random()*2.5,alpha:0.95,color:fire[i%fire.length]})
              }
              if (shotRef.current) { shotRef.current=false; const proj=p; setTimeout(()=>goProject(proj.id), 300) }
              break
            }
          }
        }
      }

      const alive: Particle[]=[]
      for (const p of particlesRef.current) {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.20; p.vx*=0.95; p.vy*=0.96
        p.alpha-=0.033; p.r*=0.975; if(p.alpha>0) alive.push(p)
      }
      particlesRef.current=alive

      // la pallina e' la bilia 3D: si dice dove sta sul tabellone (che da telefono e' girato)
      const jl = jumpRef.current
      const lift = jl && !jl.landed ? jl.arcNorm*jl.arcHeight : 0
      const bm = marble.board
      if (desk) { bm.u = ball.x/MAP_W; bm.v = ball.y/MAP_H }
      else { bm.u = ball.y/MAP_W; bm.v = 1 - ball.x/MAP_H }
      bm.lift = lift/MAP_W
      const moving = !!(jl && !jl.landed) || Math.hypot(ball.vx,ball.vy) > 0 || isDraggingRef.current

      // Con la tavola piatta sulla pagina il mondo 3D e' fermo: la bilia 3D si
      // nasconde e la si disegna qui, con lo stesso vetro ambra
      const flat = worldHold.on
      // la mappa si ridisegna (e la texture si ricarica) solo quando cambia qualcosa
      const reveal = gridRevealRef.current, target = visible ? 1 : 0
      const dirty = redrawRef.current || hoveredRef.current !== drawnHoverRef.current
        || Math.abs(reveal - target) > 0.003 || particlesRef.current.length > 0
        || trailRef.current.length > 0 || isDraggingRef.current
        || flat !== drawnFlatRef.current || (flat && moving)
      if (dirty) {
        redrawRef.current = false
        drawnHoverRef.current = hoveredRef.current
        drawnFlatRef.current = flat
        // la fodera scura del fascicolo: il tabellone e' stampato li' sopra
        ctx.fillStyle='#1E1B24'; ctx.fillRect(0,0,w,h)
        drawBackground(ctx,w,h,reveal)
        for (let i=0;i<PROJ.length;i++) drawZone(ctx,PROJ[i],ZONE_JITTER[i],w,h)
        drawPaths(ctx,PROJ,w,h)
        for (const p of PROJ) drawFolder(ctx,p,w,h,hoveredRef.current===p.id)
        drawTrail(ctx,trailRef.current)
        drawParticles(ctx,particlesRef.current)
        if (isDraggingRef.current) drawSlingshot(ctx, ball, dragOriginRef.current, w, h)
        if (flat) drawBall(ctx, ball, lift, ballOnScreen())
        drawMapDecorations(ctx,w,h,!desk)
        tableRef.current?.refresh()
      } else if (moving && !flat) tableRef.current?.tick()
      showFlat(canvasLoop)

      rafRef.current=requestAnimationFrame(loop)
    }

    rafRef.current=requestAnimationFrame(loop)
    return ()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  /** la bilia sulla tavola piatta: grande sullo schermo come sul resto della pagina
   *  (MarblePage), in unita' della mappa. Il tabellone e' largo MAP_W */
  function ballOnScreen() {
    const p = tableRef.current?.boardScreen()
    const w = p ? Math.hypot(p[2] - p[0], p[3] - p[1]) : 0
    return w > 0 ? (desktopRef.current ? MARBLE_PX.desk : MARBLE_PX.touch) * MAP_W / w : BALL_R
  }

  /* ── Il tavolo: cartellina e gamepad ── */

  function later(fn: () => void, ms: number) {
    timersRef.current.push(window.setTimeout(fn, ms))
  }

  useEffect(() => () => { timersRef.current.forEach(clearTimeout) }, [])

  // La pallina era rimasta pizzicata nella piega: aperto il fascicolo, salta fuori
  function popBall() {
    const {w,h}=sizeRef.current; if (w===0) return
    const ball=ballRef.current, now=performance.now()
    const sx=w/2, sy=h*0.42
    ball.x=sx; ball.y=sy; ball.vx=0; ball.vy=0; trailRef.current=[]
    collisionCooldownRef.current=now+800
    shotRef.current=false
    const fire=['#FFD9A8','#F3A66A','#C8860A','#FFF0E2']
    for (let i=0;i<14;i++) {
      const a=Math.PI+(Math.random()-0.5)*1.6, sp=1.5+Math.random()*4
      particlesRef.current.push({x:sx,y:sy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.5,r:1.2+Math.random()*2.5,alpha:0.9,color:fire[i%fire.length]})
    }
    jumpRef.current={
      fromX:sx, fromY:sy, toX:w*0.3, toY:h*0.58,
      startTime:now, duration:640, arcHeight:120,
      scaleX:0.6, scaleY:1.5, arcNorm:0,
      landed:false, projectId:'', thenVx:-3.4, thenVy:0.8,
    }
  }

  /**
   * Fascicolo aperto e camera ferma: la tavola si mostra sulla pagina, proprio
   * sopra la sua stampa nel 3D (stessi angoli sullo schermo). Niente patina del
   * render e il mondo 3D non si ridisegna mentre si gioca con la bilia.
   */
  useEffect(() => {
    const reset = () => {
      if (!worldHold.on) return
      worldHold.on = false; flatRef.current.still = 0
      if (canvasRef.current) canvasRef.current.style.cssText = ''
    }
    window.addEventListener('resize', reset)
    return () => { window.removeEventListener('resize', reset); worldHold.on = false }
  }, [])

  function showFlat(c: HTMLCanvasElement) {
    const f = flatRef.current
    const p = openRef.current && inViewRef.current ? tableRef.current?.boardScreen() : null
    if (!p) {
      if (f.still) { c.style.cssText = ''; f.still = 0; worldHold.on = false }
      return
    }
    // gia' sulla pagina: la camera e' ferma (il mondo non si ridisegna), non si rimisura
    if (worldHold.on) return
    // ferma da un quarto di secondo: la camera e' arrivata
    const now = performance.now()
    if (p.some((v, i) => Math.abs(v - f.last[i]) > 0.5) || !f.still) f.still = now
    f.last = p
    if (now - f.still < 250) return
    const W = c.width, H = c.height
    const base = `display:block;position:fixed;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:1;border-radius:2px;`
    // un antenato trasformato sposta l'origine di «fixed»: si misura dove cade davvero
    c.style.cssText = base
    const o = c.getBoundingClientRect()
    c.style.cssText = base + `transform-origin:0 0;transform:matrix(${(p[2]-p[0])/W},${(p[3]-p[1])/W},` +
      `${(p[4]-p[0])/H},${(p[5]-p[1])/H},${p[0] - o.left},${p[1] - o.top});`
    worldHold.on = true
    // un ultimo fotogramma del mondo, senza la bilia 3D: ora la disegna la mappa
    tableRef.current?.tick()
  }

  useEffect(() => {
    openRef.current = phase === 'open'
    redrawRef.current = true
    if (phase === 'open') popBall()
  }, [phase])

  /** Il tavolo e' al centro dello schermo (la camera del mondo e' sul banco) */
  function atTable() {
    const r = wrapperRef.current?.getBoundingClientRect()
    if (!r) return false
    return Math.abs(r.top + r.height / 2 - window.innerHeight / 2) < window.innerHeight * 0.3
  }

  /**
   * Si apre un lavoro dal fascicolo: il fascicolo se lo ricorda. Tornando indietro
   * (o con «torna al portfolio») si ritrova la tavola aperta, non il fascicolo chiuso.
   */
  function goProject(id: string) {
    try { sessionStorage.setItem(FOLDER_KEY, '1') } catch { /* niente memoria: pazienza */ }
    routerRef.current.push(`/portfolio/${id}`)
  }

  useEffect(() => {
    let open = false
    try { open = sessionStorage.getItem(FOLDER_KEY) === '1' } catch { /* ignora */ }
    if (!open) return
    // di nuovo al banco, con il fascicolo gia' aperto
    const center = () => wrapperRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' })
    center()
    const t1 = window.setTimeout(center, 120)
    const t2 = window.setTimeout(() => { center(); setPhase('open') }, 260)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [])

  function openFolder() {
    if (phase === 'list') { setPhase('closed'); return }
    if (phase !== 'closed') return
    setPhase('sliding')
    later(() => setPhase('opening'), SLIDE_MS)
    later(() => setPhase('open'), SLIDE_MS + COVER_MS)
  }

  function closeFolder() {
    try { sessionStorage.removeItem(FOLDER_KEY) } catch { /* ignora */ }
    if (phase === 'list') { setPhase('closed'); return }
    if (phase !== 'open') return
    const ball=ballRef.current; ball.vx=0; ball.vy=0; jumpRef.current=null
    hoveredRef.current=null
    setPhase('closing')
    later(() => setPhase('returning'), FADE_MS + COVER_MS)
    later(() => setPhase('closed'), FADE_MS + COVER_MS + SLIDE_MS)
  }

  // a fascicolo aperto la tavola sta ferma sulla pagina: se si scorre (su o giu') il
  // fascicolo si chiude e la bilia ne esce, poi scende con la pagina
  useEffect(() => {
    if (phase !== 'open') return
    const y0 = window.scrollY
    const onScroll = () => { if (Math.abs(window.scrollY - y0) > 30) closeFolder() }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase !== 'open') return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeFolder() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Il gioco si apre dentro il Game Boy, qui sulla home (vedi GameBoy): la console
  // si prende in mano, viene davanti alla camera, e dal suo schermo nasce il gioco.
  // Da computer il gioco e' gia' partito in sottofondo, nascosto: arriva al menu subito.
  const [warm, setWarm] = useState(false)
  const [gameOn, setGameOn] = useState(false)      // il gioco e' montato (anche nascosto)
  const [gameFrom, setGameFrom] = useState<Rect | null>(null)
  const [gameKey, setGameKey] = useState(0)

  useEffect(() => {
    if (!gameWarmable()) return
    setWarm(true)
    // il gioco si scalda quando il banco e' a uno schermo di distanza, non appena
    // aperto il sito: sono ~20 MB e un secondo mondo 3D da preparare, che nei primi
    // secondi rubavano processore, memoria e banda alla home, anche a chi il Game Boy
    // non lo prende mai. Arrivati al banco ha gia' cominciato, e lo schermo della
    // console mostra a che punto e'
    const section = sectionRef.current
    if (!section) return
    let t = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const go = () => setGameOn(true)
      t = window.setTimeout(() => {
        if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(go, { timeout: 1500 })
        else go()
      }, 300)
    }, { rootMargin: '100% 0px' })
    io.observe(section)
    return () => { io.disconnect(); window.clearTimeout(t) }
  }, [])
  useGamePreload(!warm, sectionRef)

  function centerRect(): Rect {
    const w = window.innerWidth, h = window.innerHeight
    return { top: h * 0.35, left: w * 0.35, width: w * 0.3, height: h * 0.3 }
  }

  function grabGamepad() {
    if (grab || gameFrom) return
    setGrab(true)
    setGameOn(true)
    later(() => setGameFrom(consoleScreen.rect ?? centerRect()), OPEN_MS)
  }

  function closeGame() {
    setGameFrom(null)
    // lo schermo torna sulla console, poi il coperchio si richiude
    later(() => setGrab(false), 120)
    if (window.location.hash === `#${PROGETTI.game.id}`) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    // il gioco si rimonta da capo (si ferma, musica compresa); da computer riparte in sottofondo
    if (warm) setGameKey((k) => k + 1)
    else setGameOn(false)
  }

  // Link diretto (/#porto-vecchio): si arriva al tavolo e il Game Boy arriva subito in mano
  useEffect(() => {
    function fromHash() {
      if (window.location.hash !== `#${PROGETTI.game.id}`) return
      const el = wrapperRef.current
      el?.scrollIntoView({ block: 'center', behavior: 'instant' })
      window.setTimeout(() => {
        el?.scrollIntoView({ block: 'center', behavior: 'instant' })
        grabGamepad()
      }, 400)
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function jumpToPoint(lx: number, ly: number) {
    if (jumpRef.current) return
    const ball=ballRef.current
    const {w,h}=sizeRef.current; if(w===0) return

    let clicked: Project|null=null, minD=Infinity
    for (const p of projRef.current) {
      const d=Math.hypot(lx-p.mapX*w, ly-p.mapY*h)
      if (d<FOLDER_HIT_R*folderScale(w,h)&&d<minD) {minD=d;clicked=p}
    }
    const tx=clicked?clicked.mapX*w:lx, ty=clicked?clicked.mapY*h:ly
    const dist=Math.hypot(tx-ball.x, ty-ball.y)
    if (dist<4) return

    ball.vx=0; ball.vy=0; trailRef.current=[]
    jumpRef.current={
      fromX:ball.x, fromY:ball.y, toX:tx, toY:ty,
      startTime:performance.now(),
      duration:Math.max(420,Math.min(750,dist*1.3)),
      arcHeight:Math.min(dist*0.36,130),
      scaleX:1, scaleY:1, arcNorm:0,
      landed:false, projectId:clicked?.id??'',
    }
  }

  function fireSlingshot() {
    isDraggingRef.current=false
    shotRef.current=true
    const ball=ballRef.current
    const origin=dragOriginRef.current
    const pullX=dragPosRef.current.x, pullY=dragPosRef.current.y
    const dx=origin.x-pullX, dy=origin.y-pullY
    const dist=Math.hypot(dx,dy)
    ball.x=origin.x; ball.y=origin.y
    if (dist>6) {
      const spd=Math.min(dist*0.22, MAX_LAUNCH)
      ball.vx=(dx/dist)*spd; ball.vy=(dy/dist)*spd
    } else { ball.vx=0; ball.vy=0 }
  }

  /* ── Mouse e dita sul tabellone: dallo schermo al fascicolo 3D ── */

  useEffect(() => {
    if (phase !== 'open') return
    const body = document.body

    // da telefono il tabellone e' girato: vedi la rotazione nel loop
    const desk = desktopRef.current
    function toMap(e: PointerEvent) {
      const p = tableRef.current?.toBoard(e.clientX, e.clientY)
      if (!p) return null
      return desk
        ? { lx: p.u*MAP_W, ly: p.v*MAP_H, inside: p.inside }
        : { lx: (1-p.v)*MAP_H, ly: p.u*MAP_W, inside: p.inside }
    }

    // da telefono, a fascicolo aperto, il dito gioca: la pagina sta ferma
    const html = document.documentElement
    const prev = { overflow: html.style.overflow, touch: html.style.touchAction }
    if (!desk) { html.style.overflow = 'hidden'; html.style.touchAction = 'none' }
    // pulsanti, link e menu della pagina restano loro
    function ours(e: PointerEvent) {
      const t = e.target as Element | null
      return !t?.closest?.('a, button, input, textarea, select, nav, header, [role="dialog"]')
    }

    let pressed = false
    function down(e: PointerEvent) {
      if (e.button !== 0 || !ours(e)) return
      const p = toMap(e); if (!p?.inside) return
      pressed = true
      const ball = ballRef.current
      if (Math.hypot(p.lx-ball.x, p.ly-ball.y) < BALL_R+(desk ? 16 : 40)) {
        isDraggingRef.current = true
        dragOriginRef.current = { x: ball.x, y: ball.y }
        dragPosRef.current = { x: p.lx, y: p.ly }
        jumpRef.current = null
        body.style.cursor = 'grabbing'
      }
    }
    function move(e: PointerEvent) {
      const p = toMap(e); if (!p) return
      if (isDraggingRef.current) { dragPosRef.current = { x: p.lx, y: p.ly }; return }
      hoveredRef.current = null
      if (!p.inside || !ours(e)) { body.style.cursor = ''; return }
      const {w,h} = sizeRef.current
      for (const pr of projRef.current) {
        if (Math.hypot(p.lx-pr.mapX*w, p.ly-pr.mapY*h) < FOLDER_HIT_R*folderScale(w,h)) { hoveredRef.current = pr.id; break }
      }
      const ball = ballRef.current
      body.style.cursor = Math.hypot(p.lx-ball.x, p.ly-ball.y) < BALL_R+12 ? 'grab' : hoveredRef.current ? 'pointer' : 'crosshair'
    }
    function up(e: PointerEvent) {
      if (isDraggingRef.current) { fireSlingshot(); body.style.cursor = 'grab'; pressed = false; return }
      if (!pressed) return
      pressed = false
      const p = toMap(e)
      if (p?.inside) jumpToPoint(p.lx, p.ly)
    }

    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      isDraggingRef.current = false
      hoveredRef.current = null
      body.style.cursor = ''
      html.style.overflow = prev.overflow; html.style.touchAction = prev.touch
    }
  }, [phase])

  return (
    <div ref={sectionRef} className={styles.section}>
      {/* Niente titolo a vista: la sezione e' il piano di lavoro. Il titolo resta per chi legge con lo screen reader */}
      <h2 className={styles.srOnly}>{PROGETTI.heading}</h2>

      <div ref={wrapperRef} className={styles.stage} data-phase={phase} data-world-stage>
        {/* Il tavolo in 3D sta nel mondo dietro la pagina (Table3D fa un portale su body):
            qui resta il riquadro che lo inquadra. I clic sul 3D arrivano da tutta la
            pagina, quindi contano solo quando il tavolo e' davvero sullo schermo. */}
        <Table3D
          phase={phase}
          grab={grab}
          mobile={!desktop}
          thumbs={THUMBS}
          count={PROJECTS.length}
          folderLabel={PROGETTI.folderLabel}
          folderHint={PROGETTI.folderHint}
          game={PROGETTI.game}
          onFolder={() => { if (atTable()) openFolder() }}
          onConsole={() => { if (atTable()) grabGamepad() }}
          api={tableRef}
          board={canvasRef}
          stage={wrapperRef}
        />

        {/* Gli stessi comandi da tastiera e per chi usa un lettore di schermo */}
        <button
          type="button"
          className={`${styles.hit} ${styles.hitFolder}`}
          onClick={openFolder}
          aria-expanded={phase === 'open' || phase === 'list'}
          tabIndex={phase === 'closed' || phase === 'list' ? 0 : -1}
        >
          {phase === 'list' ? PROGETTI.folderClose : PROGETTI.folderHint}
        </button>
        <button
          id={PROGETTI.game.id}
          type="button"
          className={`${styles.hit} ${styles.hitConsole}`}
          onClick={grabGamepad}
          tabIndex={phase === 'closed' || phase === 'list' ? 0 : -1}
        >
          {PROGETTI.game.title} — {PROGETTI.game.hint}
        </button>

        {/* il tabellone si disegna qui ma si vede nel 3D, stampato dentro il fascicolo */}
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

        <button type="button" className={styles.folderClose} onClick={closeFolder} tabIndex={phase === 'open' ? 0 : -1}>
          {PROGETTI.folderClose} ✕
        </button>

      </div>

      {gameOn && <GameBoy key={gameKey} from={gameFrom} onClose={closeGame} warm={warm} />}

      <div className={styles.mobileGrid} data-show={phase === 'list' ? 'true' : undefined}>
        {PROJECTS.map(p=>(
          <button key={p.id} type="button" className={styles.mobileCard}
            style={{'--ca':p.accent} as React.CSSProperties}
            onClick={()=>router.push(`/portfolio/${p.id}`)}>
            {(p as { thumb?: string }).thumb && (
              <span className={styles.mobileCardMedia}>
                <img src={(p as { thumb?: string }).thumb} alt="" loading="lazy" decoding="async" />
              </span>
            )}
            <span className={styles.mobileCardCat}>{p.category}</span>
            <span className={styles.mobileCardTitle}>{p.title}</span>
            <span className={styles.mobileCardTagline}>{p.tagline}</span>
            <span className={styles.mobileCardCta}>Apri →</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Porto Vecchio si carica in sottofondo quando il banco e' a uno schermo di
 * distanza (prima, 4 secondi dopo l'apertura: ~18 MB anche a chi non arriva mai
 * al banco), un file alla volta, a bassa priorita', solo quando il browser e'
 * libero. Cosi' il sito non ne risente e, aprendo il gioco, i file arrivano
 * dalla cache. Niente con il risparmio dati o la rete lenta.
 */
function useGamePreload(on: boolean, section: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!on) return
    const net = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    // niente anticipo: lo schermo del Game Boy mostra subito la schermata di lancio
    if (net?.saveData || /(^|-)2g$/.test(net?.effectiveType ?? '')) { gameLoad.ready = true; return }
    const base = PROGETTI.game.path.replace(/[^/]*$/, '')
    const ctrl = new AbortController()
    const idle = (cb: () => void) => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(cb, { timeout: 3000 })
      else window.setTimeout(cb, 200)   // Safari non ce l'ha
    }
    let timer = 0

    async function run() {
      const files = PROGETTI.game.preload
      for (let i = 0; i < files.length; i++) {
        if (ctrl.signal.aborted) return
        await new Promise<void>((ok) => idle(ok))
        try {
          const res = await fetch(base + files[i], { signal: ctrl.signal, priority: 'low' } as RequestInit)
          await res.arrayBuffer()   // letto fino in fondo, cosi' resta in cache
        } catch { if (ctrl.signal.aborted) return }
        // lo schermo del Game Boy sul banco segue lo scaricamento
        gameLoad.p = (i + 1) / files.length
      }
      gameLoad.ready = true
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      timer = window.setTimeout(run, 300)
    }, { rootMargin: '100% 0px' })
    if (section.current) io.observe(section.current)
    return () => { ctrl.abort(); window.clearTimeout(timer); io.disconnect() }
  }, [on, section])
}
