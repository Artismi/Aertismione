'use client'

/**
 * La bilia sulla pagina. Appena sotto il logo compare il testo, il pallino della
 * i si stacca e salta sulla pagina, piu' piccola che sul banco; li' segue il
 * cursore, con un filo di slancio. Arrivati al banco ci salta dentro (poi e' di
 * Marble3D), uscendone torna sulla pagina, e tornando in cima risale sulla i.
 *
 * E' fuori dal 3D apposta: due div spostati con transform, niente da ridisegnare,
 * cosi' resta fluida anche quando il mondo dietro e' pesante. Il tempo e' quello
 * vero (non i fotogrammi): con qualche fotogramma perso la bilia non rallenta.
 *
 * Dal telefono sta in basso a destra; un tocco su un punto libero e ci salta.
 */

import { useEffect, useRef } from 'react'
import { marble, type Spot } from '@/components/canvas/table/marble'
import { useStore } from '@/stores/useStore'
import styles from './MarblePage.module.css'

/** meta' del lato del disegno: la bilia si fa grande o piccola con scale() */
const RB = 40
/** la bilia appoggiata accanto al cursore, un po' sotto e a destra, per non coprirlo */
const AIM = { x: 22, y: 26 }
/** la molla che la tira verso il cursore: rigidezza e smorzamento (meno di 1: un piccolo slancio) */
const SPRING = 55
const DAMP = 2 * 0.62 * Math.sqrt(SPRING)

type Jump = {
  /** dove va: sulla pagina, sul banco o sulla i */
  kind: 'page' | 'bench' | 'logo'
  x0: number; y0: number; r0: number
  to: () => Spot | { x: number; y: number; r: number }
  t: number; dur: number; h: number
  then: (() => void) | null
}

const busy = (t: EventTarget | null) =>
  !!(t as Element | null)?.closest?.('a, button, input, textarea, select, label, nav, header, [role="dialog"]')

export function MarblePage() {
  const ballRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ballRef.current || !shadowRef.current) return
    const ball: HTMLDivElement = ballRef.current, shadow: HTMLDivElement = shadowRef.current

    const fine = window.matchMedia('(pointer: fine)').matches
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const R = fine ? 9 : 8

    const st = { x: 0, y: 0, r: R, vx: 0, vy: 0, gx: 0, gy: 0, lift: 0, jump: null as Jump | null }
    const mouse = { x: 0, y: 0, ok: false }
    /** dove si posa quando non c'e' un cursore da seguire */
    const rest = { x: 0, y: 0, set: false }
    let shown = false, hideIn = 0, scrollY = window.scrollY, raf = 0, last = performance.now()

    function restPoint() {
      const w = window.innerWidth, h = window.innerHeight
      if (fine && mouse.ok && !still) {
        return { x: clamp(mouse.x + AIM.x, R + 6, w - R - 6), y: clamp(mouse.y + AIM.y, R + 6, h - R - 6), r: R }
      }
      if (!rest.set) return { x: w - 34, y: h - 40, r: R }
      return { x: clamp(rest.x, R + 6, w - R - 6), y: clamp(rest.y, R + 6, h - R - 6), r: R }
    }

    function jump(kind: Jump['kind'], from: { x: number; y: number; r: number }, to: Jump['to'], then: Jump['then'] = null, dur?: number) {
      const t0 = to()
      const d = Math.hypot(t0.x - from.x, t0.y - from.y)
      st.jump = {
        kind, x0: from.x, y0: from.y, r0: from.r, to, t: 0,
        dur: dur ?? clamp(0.42 + d / 1400, 0.5, 0.85),
        h: clamp(d * 0.32, 50, 240),
        then,
      }
      st.vx = st.vy = 0
    }

    function zones() {
      const vh = window.innerHeight
      const y = window.scrollY
      const stg = marble.stage?.getBoundingClientRect()
      return {
        // in cima il testo e' appena accennato sotto il logo: appena la pagina comincia a
        // salire e il testo entra, la bilia salta; tornati del tutto in cima torna sulla i
        textIn: y > vh * 0.06,
        textOut: y < vh * 0.015,
        // il banco e' in mezzo allo schermo / ne e' uscito (con un margine: niente avanti e indietro)
        benchIn: !!stg && stg.top < vh * 0.72 && stg.bottom > vh * 0.2,
        benchOut: !stg || stg.top > vh * 0.85 || stg.bottom < vh * 0.12,
      }
    }

    /** le strade fra la i, la pagina e il banco */
    function route() {
      const z = zones()
      if (st.jump) {
        // cambia idea a mezz'aria: il banco e' uscito mentre ci saltava, o la pagina
        // e' ridiscesa mentre tornava sulla i. Riparte da dov'e' verso la pagina
        const j = st.jump
        if ((j.kind === 'bench' && z.benchOut) || (j.kind === 'logo' && z.textIn)) toPage()
        return
      }
      const m = marble.mode
      if (m === 'logo') {
        if (!marble.logoAt.ok) return
        if (z.benchIn && marble.enterBench && marble.landAt.ok) {
          // un link diretto al banco: dalla i dritta sul banco
          take(marble.logoAt)
          toBench(marble.logoAt)
        } else if (z.textIn && !z.benchIn) {
          take(marble.logoAt)
          jump('page', marble.logoAt, restPoint)
        }
      } else if (m === 'page') {
        if (z.benchIn && marble.enterBench && marble.landAt.ok && marble.benchFree) {
          toBench(st)
        } else if (z.textOut && marble.logoAt.ok) {
          jump('logo', st, () => marble.logoAt, () => {
            marble.mode = 'logo'
            hideIn = 2   // la bilia del 3D ricompare al prossimo fotogramma: fino ad allora resta questa
            marble.invalidate?.()
          })
        }
      } else if ((m === 'roll' || m === 'fall') && z.benchOut && marble.benchFree && marble.benchAt.ok) {
        // fuori dal banco: torna sulla pagina
        take(marble.benchAt)
        jump('page', marble.benchAt, restPoint)
      }
    }

    function toBench(from: { x: number; y: number; r: number }) {
      jump('bench', from, () => marble.landAt, () => land())
    }
    /** da dov'e' adesso, a mezz'aria compresa, verso il suo posto sulla pagina */
    function toPage() {
      const from = { x: st.x, y: st.y, r: st.r }
      st.lift = 0
      jump('page', from, restPoint)
    }

    /** la bilia passa alla pagina, da dove si vedeva nel 3D */
    function take(from: Spot) {
      marble.mode = 'page'
      st.x = st.gx = from.x; st.y = st.gy = from.y; st.r = from.r
      marble.invalidate?.()   // il 3D nasconde la sua
    }

    function land() {
      marble.enterBench?.()
      hideIn = 2
    }

    function step(dt: number) {
      const j = st.jump
      if (j) {
        j.t = Math.min(1, j.t + dt / j.dur)
        const t = j.t, to = j.to()
        // la base del salto va dritta da qui a li', la bilia sale e scende sopra: l'ombra resta sulla base
        st.gx = j.x0 + (to.x - j.x0) * t
        st.gy = j.y0 + (to.y - j.y0) * t
        st.lift = 4 * j.h * t * (1 - t)
        st.x = st.gx
        st.y = st.gy - st.lift
        st.r = j.r0 + (to.r - j.r0) * (t * t * (3 - 2 * t))
        if (t >= 1) {
          st.jump = null
          st.lift = 0
          j.then?.()
        }
        return
      }
      if (marble.mode !== 'page') return
      // sulla pagina: una molla verso il cursore (o verso il suo posto)
      const p = restPoint()
      st.vx += (SPRING * (p.x - st.x) - DAMP * st.vx) * dt
      st.vy += (SPRING * (p.y - st.y) - DAMP * st.vy) * dt
      st.x += st.vx * dt
      st.y += st.vy * dt
      st.gx = st.x; st.gy = st.y
      st.r += (R - st.r) * Math.min(1, dt * 10)
    }

    const layer = ball.parentElement
    function draw() {
      // dove sta la bilia, per chi ispeziona la pagina (e per le prove)
      if (layer && layer.dataset.mode !== marble.mode) layer.dataset.mode = marble.mode
      const on = marble.mode === 'page' || hideIn > 0
      if (hideIn > 0 && marble.mode !== 'page') hideIn--
      const vis = on && !useStore.getState().gameOpen
      if (vis !== shown) {
        shown = vis
        ball.style.opacity = shadow.style.opacity = vis ? '' : '0'
      }
      if (!vis) return
      const s = st.r / RB
      ball.style.transform = `translate3d(${(st.x - RB).toFixed(2)}px,${(st.y - RB).toFixed(2)}px,0) scale(${s.toFixed(4)})`
      // l'ombra: a terra sotto la bilia, si allarga e schiarisce quando si alza
      const up = Math.min(st.lift / 160, 1)
      shadow.style.transform = `translate3d(${(st.gx + st.r * 0.3 - RB).toFixed(2)}px,${(st.gy + st.r * 0.62 - RB).toFixed(2)}px,0) scale(${(s * (1 + up * 0.5)).toFixed(4)})`
      shadow.style.opacity = (0.9 - up * 0.6).toFixed(3)
    }

    function tick(now: number) {
      // il tempo vero, a passi piccoli: la molla resta stabile anche con un fotogramma lungo
      let left = Math.min((now - last) / 1000, 0.1)
      last = now
      route()
      while (left > 1e-6) {
        const dt = Math.min(left, 1 / 120)
        left -= dt
        step(dt)
      }
      draw()
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.ok = true
    }
    // la pagina che scorre le da' una spinta: e' appoggiata sopra
    const onScroll = () => {
      const y = window.scrollY
      const dy = clamp(y - scrollY, -120, 120)
      scrollY = y
      if (marble.mode === 'page' && !st.jump && !still) st.vy -= dy * 3
    }
    // dal telefono: un tocco su un punto libero e la bilia ci salta
    let press: { x: number; y: number } | null = null
    const onDown = (e: PointerEvent) => { press = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY } }
    const onUp = (e: PointerEvent) => {
      const p = press
      press = null
      if (!p || fine || busy(e.target) || marble.mode !== 'page' || st.jump) return
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) return
      rest.x = e.clientX; rest.y = e.clientY; rest.set = true
      jump('page', st, restPoint)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <div className={styles.layer} aria-hidden="true">
      <div ref={shadowRef} className={styles.shadow} style={{ opacity: 0 }} />
      <div ref={ballRef} className={styles.ball} style={{ opacity: 0 }} data-marble="" />
    </div>
  )
}

function clamp(v: number, a: number, b: number) { return v < a ? a : v > b ? b : v }
