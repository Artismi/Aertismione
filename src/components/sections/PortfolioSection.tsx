'use client'

/**
 * PortfolioSection â€” Mappa con due meccaniche di movimento:
 * 1. CLICK  â€” su qualunque punto â†’ salto parabolico verso quel punto
 * 2. DRAG   â€” tieni premuto sulla pallina e trascina per mirare.
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './PortfolioSection.module.css'
import { PORTFOLIO } from '@/config/content'

/* â”€â”€â”€ Costanti â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const BALL_R        = 15
const FOLDER_HIT_R  = 40   // raggio collisione/hover cartellina
const FRICTION      = 0.972
const MIN_SPEED     = 0.07
const MAX_LAUNCH    = 38

/* â”€â”€â”€ Tipi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type Project = typeof PORTFOLIO.projects[number]

interface Ball { x: number; y: number; vx: number; vy: number; rotation: number }

interface JumpState {
  fromX: number; fromY: number; toX: number; toY: number
  startTime: number; duration: number; arcHeight: number
  scaleX: number; scaleY: number; arcNorm: number
  landed: boolean; projectId: string
}

interface Particle { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }

/* â”€â”€â”€ Dati â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const PROJECTS: Project[] = PORTFOLIO.projects as unknown as Project[]

const ZONE_JITTER = PROJECTS.map((p) => {
  const seed = p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return Array.from({ length: 9 }, (_, i) => 0.68 + ((seed * (i+1) * 137 + 41) % 100) / 175)
})

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

function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>): { lx: number; ly: number } {
  const rect = e.currentTarget.getBoundingClientRect()
  return { lx: e.clientX - rect.left, ly: e.clientY - rect.top }
}

function getTouchCanvasPos(e: React.TouchEvent<HTMLCanvasElement>, touch: React.Touch): { lx: number; ly: number } {
  const rect = e.currentTarget.getBoundingClientRect()
  return { lx: touch.clientX - rect.left, ly: touch.clientY - rect.top }
}

/* â”€â”€â”€ Disegno: sfondo con hex dots + reveal radiale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, reveal: number) {
  if (reveal <= 0) return
  const maxR = Math.hypot(w/2, h/2) * Math.min(reveal * 1.35, 1)
  const cx = w/2, cy = h/2, sp = 29, rowH = sp * 0.866
  // Dot rosa tenue visibili su sfondo scuro
  ctx.fillStyle = 'rgba(232,168,191,0.09)'
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

function drawMapDecorations(ctx: CanvasRenderingContext2D, w: number, h: number) {
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
}

function drawZone(ctx: CanvasRenderingContext2D, p: Project, jitter: number[], w: number, h: number) {
  const cx = p.mapX*w, cy = p.mapY*h, r = Math.min(w,h)*0.155, N = jitter.length
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
    ctx.strokeStyle = 'rgba(232,168,191,0.18)'
    ctx.beginPath(); ctx.moveTo(x1,y1)
    ctx.quadraticCurveTo(mx-(dy/len)*len*0.16, my+(dx/len)*len*0.16, x2,y2); ctx.stroke()
  }
  ctx.setLineDash([])
}

function drawFolder(ctx: CanvasRenderingContext2D, p: Project, w: number, h: number, time: number, isHovered: boolean) {
  const cx = p.mapX*w, cy = p.mapY*h
  const [cr,cg,cb] = hexToRgb(p.accent)
  const seed = p.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)
  const tilt = ((seed*73)%100-50)/100*0.13
  const fw=82, fh=58, br=4
  const lift = isHovered ? -8 : 0

  ctx.save()
  ctx.translate(cx, cy+lift)
  ctx.rotate(tilt)

  const pulse = 0.5+0.5*Math.sin(time*0.0019+p.mapX*8)
  ctx.beginPath()
  ctx.arc(0, 0, 52 + (isHovered ? 0 : pulse*9), 0, Math.PI*2)
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},${isHovered ? 0.50 : (0.07+pulse*0.10).toFixed(3)})`
  ctx.lineWidth = isHovered ? 2.2 : 1.2; ctx.stroke()

  // Shadow — viola scuro (non grigio)
  ctx.shadowColor = `rgba(0,0,0,${isHovered?0.65:0.35})`
  ctx.shadowBlur = isHovered ? 28 : 12
  ctx.shadowOffsetX = 2; ctx.shadowOffsetY = isHovered ? 12 : 6

  // Tab categoria — colore accent del progetto
  ctx.beginPath()
  ctx.moveTo(-fw/2,      -fh/2)
  ctx.lineTo(-fw/2+32,   -fh/2)
  ctx.lineTo(-fw/2+27,   -fh/2-13)
  ctx.lineTo(-fw/2+4,    -fh/2-13)
  ctx.closePath()
  ctx.fillStyle = p.accent; ctx.fill()

  ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0
  ctx.textAlign='center'
  ctx.fillStyle='rgba(255,255,255,0.90)'
  ctx.font='bold 6px "JetBrains Mono",monospace'
  ctx.fillText(p.category.toUpperCase(), -fw/2+16, -fh/2-4)

  // Corpo cartella — viola scuro con sfumatura
  ctx.shadowColor=`rgba(0,0,0,${isHovered?0.45:0.22})`
  ctx.shadowBlur=isHovered?18:7; ctx.shadowOffsetY=isHovered?8:4
  const bx=-fw/2, by=-fh/2
  ctx.beginPath()
  ctx.moveTo(bx+br, by); ctx.lineTo(bx+fw-br, by)
  ctx.quadraticCurveTo(bx+fw, by, bx+fw, by+br)
  ctx.lineTo(bx+fw, by+fh-br)
  ctx.quadraticCurveTo(bx+fw, by+fh, bx+fw-br, by+fh)
  ctx.lineTo(bx+br, by+fh)
  ctx.quadraticCurveTo(bx, by+fh, bx, by+fh-br)
  ctx.lineTo(bx, by+br)
  ctx.quadraticCurveTo(bx, by, bx+br, by)
  ctx.closePath()
  // Gradiente viola scuro — carta nera del portfolio
  const bodyGrad = ctx.createLinearGradient(bx, by, bx+fw, by+fh)
  // Schiarito il gradiente per farlo staccare dallo sfondo che è anch'esso scuro (migliorata la distinzione)
  bodyGrad.addColorStop(0, 'rgba(54, 24, 82, 0.97)')
  bodyGrad.addColorStop(1, 'rgba(28, 12, 42, 0.97)')
  ctx.fillStyle=bodyGrad; ctx.fill()
  ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0
  // Border accent con glow su hover
  if (isHovered) {
    ctx.shadowColor=`rgba(${cr},${cg},${cb},0.65)`; ctx.shadowBlur=16
  }
  // Aumentata l'opacità del bordo di base da 0.45 a 0.75 affinché le cartelline "disegnino" lo stacco visivo
  ctx.strokeStyle=isHovered ? p.accent : 'rgba(242, 237, 228, 0.75)'
  ctx.lineWidth=isHovered?2.5:1.5; ctx.stroke()
  ctx.shadowBlur=0

  // Dog-ear accent
  const dex=fw/2, dey=fh/2, ds=11
  ctx.beginPath()
  ctx.moveTo(dex-ds, dey); ctx.lineTo(dex, dey-ds); ctx.lineTo(dex, dey)
  ctx.closePath()
  ctx.fillStyle=`rgba(${cr},${cg},${cb},0.55)`; ctx.fill()

  // Linee contenuto — chiare su scuro
  ctx.strokeStyle='rgba(242,237,228,0.10)'; ctx.lineWidth=1
  for (let i=0;i<3;i++) {
    ctx.beginPath()
    ctx.moveTo(-fw/2+11, -fh/2+28+i*9); ctx.lineTo(fw/2-15, -fh/2+28+i*9)
    ctx.stroke()
  }

  // Titolo — crema su viola scuro
  ctx.textAlign='center'
  ctx.fillStyle='#FFFFFF' // Bianco puro per contrasto perfetto
  // Font cambiato da Anton/Impact a Space Grotesk (leggibile) maggiorato
  ctx.font='600 12.5px "Space Grotesk", sans-serif'
  ctx.fillText(p.title.toUpperCase(), 0, -fh/2+18)

  // Dot accent
  ctx.beginPath(); ctx.arc(-fw/2+11, fh/2-9, 3.5, 0, Math.PI*2)
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

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball, js: JumpState | null) {
  const speed = Math.hypot(ball.vx, ball.vy)
  let drawX=ball.x, drawY=ball.y, sx=1, sy=1
  let shadowX=ball.x, shadowY: number, shadowSx: number, shadowSy: number

  if (js && !js.landed) {
    sx=js.scaleX; sy=js.scaleY
    const ss = 0.45 + 0.55*(1-js.arcNorm)
    shadowX=ball.x; shadowY=ball.y+(BALL_R*sy)+6; shadowSx=ss; shadowSy=ss*0.35
  } else if (js?.landed) {
    sx=js.scaleX; sy=js.scaleY
    shadowX=ball.x; shadowY=ball.y+4; shadowSx=1.5; shadowSy=0.22
  } else {
    const lift = Math.min(speed*0.95, 15)
    drawY=ball.y-lift
    const ss = Math.max(0.38, 1-lift*0.025)
    shadowX=ball.x; shadowY=ball.y+3; shadowSx=ss; shadowSy=ss*0.28
  }

  const spd = Math.hypot(ball.vx, ball.vy)
  const speedF = Math.min(spd / 14, 1)
  const prev = ctx.globalCompositeOperation

  // ── Glow plasma esterno — screen composite (luce additiva su dark) ──
  ctx.globalCompositeOperation = 'screen'
  const glowR = BALL_R * (2.0 + speedF * 1.6)
  const glow = ctx.createRadialGradient(drawX, drawY, BALL_R*0.5, drawX, drawY, glowR)
  glow.addColorStop(0,   `rgba(200,70,200,${(0.38 + speedF*0.40).toFixed(3)})`)
  glow.addColorStop(0.45,`rgba(110,30,175,${(0.18 + speedF*0.20).toFixed(3)})`)
  glow.addColorStop(1,   'rgba(60,0,100,0)')
  ctx.beginPath(); ctx.arc(drawX, drawY, glowR, 0, Math.PI*2)
  ctx.fillStyle = glow; ctx.fill()
  ctx.globalCompositeOperation = prev

  // ── Shadow viola (normale, non screen) ──
  ctx.beginPath()
  ctx.ellipse(shadowX, shadowY, BALL_R*shadowSx, BALL_R*shadowSy, 0, 0, Math.PI*2)
  ctx.fillStyle = `rgba(60,0,80,${(0.45*shadowSx).toFixed(3)})`; ctx.fill()

  ctx.save(); ctx.translate(drawX, drawY); ctx.scale(sx, sy)

  // ── Corpo meteorite — gradiente viola-rosa rocky ──
  const body = ctx.createRadialGradient(-BALL_R*0.28,-BALL_R*0.32, BALL_R*0.05, 0, 0, BALL_R)
  body.addColorStop(0,    '#D068DC')  // rosa-viola caldo
  body.addColorStop(0.30, '#8228B0')  // viola profondo
  body.addColorStop(0.65, '#3A0E58')  // quasi nero viola
  body.addColorStop(1,    '#120620')  // bordo scurissimo
  ctx.beginPath(); ctx.arc(0, 0, BALL_R, 0, Math.PI*2)
  ctx.fillStyle = body; ctx.fill()

  // ── Texture superficie — ruota con la fisica ──
  ctx.save(); ctx.rotate(ball.rotation)

  // Crepe
  ctx.strokeStyle = 'rgba(210,110,230,0.28)'; ctx.lineWidth = 0.9
  ctx.beginPath()
  ctx.moveTo(-BALL_R*0.42, -BALL_R*0.06)
  ctx.lineTo(-BALL_R*0.05,  BALL_R*0.26)
  ctx.lineTo( BALL_R*0.32,  BALL_R*0.12)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo( BALL_R*0.16, -BALL_R*0.40)
  ctx.lineTo(-BALL_R*0.08, -BALL_R*0.02)
  ctx.stroke()

  // Crateri
  const craters: Array<{x:number;y:number;r:number}> = [
    {x:-0.28, y:0.22,  r:0.20},
    {x: 0.30, y:-0.20, r:0.13},
    {x:-0.08, y:-0.30, r:0.09},
  ]
  for (const c of craters) {
    ctx.beginPath(); ctx.arc(c.x*BALL_R, c.y*BALL_R, c.r*BALL_R, 0, Math.PI*2)
    ctx.fillStyle = 'rgba(6,0,14,0.58)'; ctx.fill()
    ctx.beginPath(); ctx.arc(
      (c.x-c.r*0.32)*BALL_R, (c.y-c.r*0.32)*BALL_R, c.r*BALL_R*0.52, 0, Math.PI*2
    )
    ctx.strokeStyle = 'rgba(210,110,230,0.20)'; ctx.lineWidth=0.5; ctx.stroke()
  }
  ctx.restore()

  // ── Specular — screen per brillantezza additiva ──
  ctx.globalCompositeOperation = 'screen'
  const spec = ctx.createRadialGradient(-BALL_R*0.32,-BALL_R*0.36, 0, -BALL_R*0.26,-BALL_R*0.28, BALL_R*0.46)
  spec.addColorStop(0,   'rgba(255,200,255,0.72)')
  spec.addColorStop(0.42,'rgba(220,130,255,0.25)')
  spec.addColorStop(1,   'rgba(180,70,220,0)')
  ctx.beginPath(); ctx.arc(0, 0, BALL_R, 0, Math.PI*2)
  ctx.fillStyle = spec; ctx.fill()
  ctx.globalCompositeOperation = prev

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
  const gridRevealRef = useRef(0)
  const inViewRef     = useRef(false)

  const isDraggingRef       = useRef(false)
  const dragPosRef          = useRef({ x: 0, y: 0 })
  const dragOriginRef       = useRef({ x: 0, y: 0 })
  const collisionCooldownRef = useRef(0)
  const winMoveRef = useRef<((e: MouseEvent) => void) | null>(null)
  const winUpRef   = useRef<((e: MouseEvent) => void) | null>(null)

  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router

  useEffect(() => {
    const canvas=canvasRef.current, wrapper=wrapperRef.current
    if (!canvas||!wrapper) return
    const canvasEl = canvas, wrapperEl = wrapper
    function resize() {
      const dpr=window.devicePixelRatio||1, w=wrapperEl.clientWidth
      // On narrow screens give more vertical room so the ball playground is playable
      const isMobile = w < 768
      const h = isMobile
        ? Math.min(700, Math.max(480, Math.round(w * 0.78)))
        : Math.min(620, Math.max(380, Math.round(w * 0.54)))
      canvasEl.width=w*dpr; canvasEl.height=h*dpr
      canvasEl.style.width=`${w}px`; canvasEl.style.height=`${h}px`
      sizeRef.current={w,h}
      const b=ballRef.current
      if (b.x===0&&b.y===0) { b.x=w/2; b.y=h/2 }
      else { b.x=Math.min(Math.max(b.x,BALL_R+2),w-BALL_R-2); b.y=Math.min(Math.max(b.y,BALL_R+2),h-BALL_R-2) }
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

      const dpr=window.devicePixelRatio||1
      ctx.setTransform(dpr,0,0,dpr,0,0)
      const time=now-startTimeRef.current
      const ball=ballRef.current

      gridRevealRef.current+=(( inViewRef.current?1:0)-gridRevealRef.current)*0.03
      canvasLoop.style.opacity=Math.max(0, gridRevealRef.current).toFixed(3)

      const js=jumpRef.current

      if (js && !js.landed) {
        const t=Math.min((now-js.startTime)/js.duration, 1)
        const eased=t<0.5?2*t*t:-1+(4-2*t)*t
        ball.x=js.fromX+(js.toX-js.fromX)*eased
        ball.y=js.fromY+(js.toY-js.fromY)*t - 4*js.arcHeight*t*(1-t)
        ball.rotation+=(Math.abs(js.toX-js.fromX)/js.duration)*0.06
        js.arcNorm=4*t*(1-t)
        if      (t<0.44)  { js.scaleX=0.81; js.scaleY=1.24 }
        else if (t<0.72)  { const p=(t-0.44)/0.28; js.scaleX=0.81+0.19*p; js.scaleY=1.24-0.24*p }
        else if (t>0.87)  { const p=(t-0.87)/0.13; js.scaleX=1+0.48*p; js.scaleY=1-0.44*p }
        else              { js.scaleX=1; js.scaleY=1 }
        if (t>=1) {
          ball.x=js.toX; ball.y=js.toY
          js.scaleX=1.6; js.scaleY=0.50; js.landed=true
          const proj=PROJECTS.find(p=>p.id===js.projectId)
          if (proj) {
            for (let i=0; i<12; i++) {
              const a=(i/12)*Math.PI*2+Math.random()*0.4, spd=2.5+Math.random()*5
              particlesRef.current.push({x:ball.x,y:ball.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-2,r:3+Math.random()*3.5,alpha:0.9,color:proj.accent})
            }
            const fire=['#FF55E0','#CC44FF','#FF99EE','#EE44CC']
            for (let i=0; i<16; i++) {
              const a=Math.random()*Math.PI*2, spd=2+Math.random()*8
              particlesRef.current.push({x:ball.x,y:ball.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-3,r:1.5+Math.random()*3,alpha:1,color:fire[i%fire.length]})
            }
          }
          setTimeout(()=>{
            if (jumpRef.current) { jumpRef.current.scaleX=1; jumpRef.current.scaleY=1 }
            setTimeout(()=>{
              jumpRef.current=null
              if (proj) routerRef.current.push(`/portfolio/${proj.id}`)
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
        if (spd<MIN_SPEED){ball.vx=0;ball.vy=0}
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
          for (const p of PROJECTS) {
            const d=Math.hypot(ball.x-p.mapX*w, ball.y-p.mapY*h)
            if (d < FOLDER_HIT_R) {
              collisionCooldownRef.current=now
              const ang=Math.atan2(ball.y-p.mapY*h, ball.x-p.mapX*w)
              ball.vx=Math.cos(ang)*6; ball.vy=Math.sin(ang)*6
              for (let i=0;i<10;i++) {
                const a=(i/10)*Math.PI*2+Math.random()*0.4, sp=2+Math.random()*4
                particlesRef.current.push({x:ball.x,y:ball.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.5,r:2.5+Math.random()*3,alpha:0.85,color:p.accent})
              }
              const fire=['#FF55E0','#CC44FF','#FF99EE']
              for (let i=0;i<12;i++) {
                const a=Math.random()*Math.PI*2, sp=1.5+Math.random()*5.5
                particlesRef.current.push({x:ball.x,y:ball.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,r:1.2+Math.random()*2.5,alpha:0.95,color:fire[i%fire.length]})
              }
              const proj=p; setTimeout(()=>routerRef.current.push(`/portfolio/${proj.id}`), 300)
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

      ctx.clearRect(0,0,w,h)
      drawBackground(ctx,w,h,gridRevealRef.current)
      for (let i=0;i<PROJECTS.length;i++) drawZone(ctx,PROJECTS[i],ZONE_JITTER[i],w,h)
      drawPaths(ctx,PROJECTS,w,h)
      for (const p of PROJECTS) drawFolder(ctx,p,w,h,time,hoveredRef.current===p.id)
      drawTrail(ctx,trailRef.current)
      drawParticles(ctx,particlesRef.current)
      if (isDraggingRef.current) drawSlingshot(ctx, ball, dragOriginRef.current, w, h)
      drawBall(ctx,ball,jumpRef.current)
      drawMapDecorations(ctx,w,h)

      rafRef.current=requestAnimationFrame(loop)
    }

    rafRef.current=requestAnimationFrame(loop)
    return ()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  function jumpToPoint(lx: number, ly: number) {
    if (jumpRef.current) return
    const ball=ballRef.current
    const {w,h}=sizeRef.current; if(w===0) return

    let clicked: Project|null=null, minD=Infinity
    for (const p of PROJECTS) {
      const d=Math.hypot(lx-p.mapX*w, ly-p.mapY*h)
      if (d<FOLDER_HIT_R&&d<minD) {minD=d;clicked=p}
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
    if (canvasRef.current) canvasRef.current.style.cursor='crosshair'
    if (winMoveRef.current) { window.removeEventListener('mousemove',winMoveRef.current); winMoveRef.current=null }
    if (winUpRef.current)   { window.removeEventListener('mouseup',winUpRef.current);   winUpRef.current=null }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const {lx,ly}=getCanvasPos(e)
    const ball=ballRef.current
    if (Math.hypot(lx-ball.x, ly-ball.y) < BALL_R+14) {
      isDraggingRef.current=true
      dragOriginRef.current={x:ball.x, y:ball.y}
      dragPosRef.current={x:lx,y:ly}
      jumpRef.current=null
      e.currentTarget.style.cursor='grabbing'

      const canvas=canvasRef.current
      winMoveRef.current=(ev:MouseEvent)=>{
        if (!canvas) return
        const rect=canvas.getBoundingClientRect()
        dragPosRef.current={x:ev.clientX-rect.left, y:ev.clientY-rect.top}
      }
      winUpRef.current=()=>fireSlingshot()
      window.addEventListener('mousemove',winMoveRef.current)
      window.addEventListener('mouseup',winUpRef.current)
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const {lx,ly}=getCanvasPos(e)
    const {w,h}=sizeRef.current
    const ball=ballRef.current

    if (isDraggingRef.current) {
      dragPosRef.current={x:lx,y:ly}
      e.currentTarget.style.cursor='grabbing'
      return
    }

    const onBall=Math.hypot(lx-ball.x, ly-ball.y)<BALL_R+10
    hoveredRef.current=null
    for (const p of PROJECTS) {
      if (Math.hypot(lx-p.mapX*w, ly-p.mapY*h)<FOLDER_HIT_R) {hoveredRef.current=p.id;break}
    }
    e.currentTarget.style.cursor=onBall?'grab':hoveredRef.current?'pointer':'crosshair'
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (isDraggingRef.current) {
      fireSlingshot(); return
    }
    const {lx,ly}=getCanvasPos(e)
    jumpToPoint(lx, ly)
  }

  function handleMouseLeave() {
    hoveredRef.current=null
    if (!isDraggingRef.current && canvasRef.current) canvasRef.current.style.cursor='crosshair'
  }

  /* ── Touch handlers (mirror mouse logic for mobile) ── */

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    if (e.touches.length === 0) return
    e.preventDefault()
    const touch = e.touches[0]
    const {lx,ly} = getTouchCanvasPos(e, touch)
    const ball = ballRef.current
    if (Math.hypot(lx-ball.x, ly-ball.y) < BALL_R+20) {
      isDraggingRef.current = true
      dragOriginRef.current = {x: ball.x, y: ball.y}
      dragPosRef.current = {x: lx, y: ly}
      jumpRef.current = null
    }
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    if (!isDraggingRef.current || e.touches.length === 0) return
    e.preventDefault()
    const touch = e.touches[0]
    const {lx,ly} = getTouchCanvasPos(e, touch)
    dragPosRef.current = {x: lx, y: ly}
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (isDraggingRef.current) {
      fireSlingshot()
    } else {
      // Tap: jump to tapped point
      const touch = e.changedTouches[0]
      if (touch) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          const lx = touch.clientX - rect.left
          const ly = touch.clientY - rect.top
          jumpToPoint(lx, ly)
        }
      }
    }
  }

  return (
    <div ref={sectionRef} className={styles.section}>
      <div className="container">
        <span className="accent-bar" />
        <h2 className={styles.heading}>Portfolio</h2>
        <p className={styles.intro}>
          Ogni progetto è un territorio.{' '}
          <em>Clicca per saltare — trascina la pallina per spararla come una bilia.</em>
        </p>
      </div>

      <div ref={wrapperRef} className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        />
        <div className={styles.legend}>
          {PROJECTS.map(p=>(
            <span key={p.id} className={styles.legendItem} style={{'--lc':p.accent} as React.CSSProperties}>
              <span className={styles.legendDot}/>{p.title}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.mobileGrid}>
        {PROJECTS.map(p=>(
          <button key={p.id} type="button" className={styles.mobileCard}
            style={{'--ca':p.accent} as React.CSSProperties}
            onClick={()=>router.push(`/portfolio/${p.id}`)}>
            <span className={styles.mobileCardCat}>{p.category}</span>
            <span className={styles.mobileCardTitle}>{p.title}</span>
            <span className={styles.mobileCardTagline}>{p.tagline}</span>
            <span className={styles.mobileCardCta}>Apri â†’</span>
          </button>
        ))}
      </div>

    </div>
  )
}
