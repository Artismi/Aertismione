'use client'

/**
 * La bilia sulla pagina. Appena sotto il logo compare il testo, il pallino della
 * i si stacca e salta sulla pagina, piu' piccola che sul banco. Li' fa come sul
 * banco: sta appoggiata sulle parti viola scuro (i «piani»: il testo sotto il
 * logo, i servizi, i contatti) e scorre con loro; un clic su un punto libero e ci
 * salta, premuta e tirata e' una fionda, rotola, rallenta e rimbalza sui bordi
 * del piano. Se il suo piano esce dallo schermo cade su quello che si vede.
 * Arrivati al banco ci salta dentro (poi e' di Marble3D), uscendone torna su un
 * piano, e tornando in cima risale sulla i.
 *
 * E' fuori dal 3D apposta: tre div spostati con transform, niente da ridisegnare,
 * cosi' resta fluida anche quando il mondo dietro e' pesante. Il tempo e' quello
 * vero (non i fotogrammi): con qualche fotogramma perso la bilia non rallenta.
 * Le posizioni sono quelle della pagina (non dello schermo): scorrendo, la bilia
 * va su e giu' con il suo piano.
 */

import { useEffect, useRef } from 'react'
import { marble, type Spot } from '@/components/canvas/table/marble'
import { useStore } from '@/stores/useStore'
import styles from './MarblePage.module.css'

/** meta' del lato del disegno: la bilia si fa grande o piccola con scale() */
const RB = 40
/** i piani: le parti viola scuro e quanto sfuma il velo in cima e in fondo (in altezze di schermo) */
const FLOORS = [
  { sel: '#visione', top: 0.3, bottom: 0.26 },
  { sel: '#servizi', top: 0.22, bottom: 0.22 },
  { sel: '#contatti', top: -0.1, bottom: 0 },
]
/** come sul banco: la velocita' si dimezza in mezzo secondo, i bordi restituiscono poco piu' di meta' */
const ROLL_DRAG = 1.4
const BOUNCE = 0.55
/** la fionda: quanto si tende al massimo e quanto spinge */
const PULL_MAX = 150
const SHOT = 9
const SHOT_MAX = 2400

type P = { x: number; y: number; r: number }
type Floor = { top: number; bottom: number; left: number; right: number }
type Jump = {
  /** dove va: su un piano, sul banco o sulla i */
  kind: 'page' | 'bench' | 'logo'
  /** da dove parte, in coordinate della pagina */
  x0: number; y0: number; r0: number
  /** dove arriva, in coordinate dello schermo (il banco e la i si misurano li') */
  to: () => P
  t: number; dur: number; h: number
  then: (() => void) | null
}

const busy = (t: EventTarget | null) =>
  !!(t as Element | null)?.closest?.('a, button, input, textarea, select, label, nav, header, [role="dialog"], [contenteditable]')

export function MarblePage() {
  const ballRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const bandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ballRef.current || !shadowRef.current || !bandRef.current) return
    const ball: HTMLDivElement = ballRef.current
    const shadow: HTMLDivElement = shadowRef.current
    const band: HTMLDivElement = bandRef.current
    const body = document.body

    const fine = window.matchMedia('(pointer: fine)').matches
    const R = fine ? 8 : 7

    // x, y: la bilia nella pagina; gx, gy: il punto a terra sotto di lei (nei salti resta giu')
    const st = {
      x: 0, y: 0, r: R, vx: 0, vy: 0, gx: 0, gy: 0, lift: 0,
      floor: -1, jump: null as Jump | null,
      drag: false, px: 0, py: 0,
    }
    let shown = false, hideIn = 0, raf = 0, last = performance.now(), sy = window.scrollY

    /** i piani in coordinate della pagina, misurati una volta per fotogramma */
    let floors: (Floor | null)[] = []
    function measure() {
      const vh = window.innerHeight
      sy = window.scrollY
      floors = FLOORS.map((f) => {
        const r = document.querySelector(f.sel)?.getBoundingClientRect()
        if (!r || r.height <= 0) return null
        const top = r.top + sy + f.top * vh, bottom = r.bottom + sy - f.bottom * vh
        if (bottom - top < 4 * R) return null
        return { top, bottom, left: r.left + 6, right: r.right - 6 }
      })
    }
    /** quanto di un piano si vede, in px */
    const seen = (f: Floor) => Math.max(0, Math.min(f.bottom, sy + window.innerHeight) - Math.max(f.top, sy))
    /** il piano che si vede di piu' (almeno un po'), o -1 */
    function bestFloor() {
      let best = -1, most = 6 * R
      floors.forEach((f, i) => { if (f && seen(f) > most) { most = seen(f); best = i } })
      return best
    }
    /** il piano sotto un punto della pagina, o -1 */
    function floorAt(x: number, y: number) {
      return floors.findIndex((f) => !!f && x >= f.left && x <= f.right && y >= f.top && y <= f.bottom)
    }
    /** dove posarsi su un piano: la parte che si vede, entrando dal lato da cui si arriva */
    function landOn(i: number, x: number, fromAbove: boolean): P {
      const f = floors[i]!
      const vh = window.innerHeight
      const lo = Math.max(f.top, sy) + R + 2, hi = Math.min(f.bottom, sy + vh) - R - 2
      const y = fromAbove ? Math.min(hi, lo + vh * 0.18) : Math.max(lo, hi - vh * 0.18)
      return { x: clamp(x, f.left + R, f.right - R), y, r: R }
    }

    function jump(kind: Jump['kind'], from: P, to: Jump['to'], then: Jump['then'] = null, dur?: number) {
      const t0 = to()
      const d = Math.hypot(t0.x - from.x, t0.y + sy - from.y)
      st.jump = {
        kind, x0: from.x, y0: from.y, r0: from.r, to, t: 0,
        dur: dur ?? clamp(0.42 + d / 1500, 0.48, 0.9),
        h: clamp(d * 0.3, 40, 220),
        then,
      }
      st.vx = st.vy = 0
      st.drag = false
    }
    /** un salto verso un punto della pagina (si sposta con lei mentre si scorre) */
    function jumpOnPage(from: P, at: P, floor: number) {
      jump('page', from, () => ({ x: at.x, y: at.y - sy, r: R }), () => { st.floor = floor })
    }
    const here = (): P => ({ x: st.x, y: st.y, r: st.r })

    function zones() {
      const vh = window.innerHeight
      const stg = marble.stage?.getBoundingClientRect()
      return {
        // in cima il testo e' appena accennato sotto il logo: appena la pagina comincia a
        // salire e il testo entra, la bilia salta; tornati del tutto in cima torna sulla i
        textIn: sy > vh * 0.06,
        textOut: sy < vh * 0.015,
        // il banco e' in mezzo allo schermo / ne e' uscito (con un margine: niente avanti e indietro)
        benchIn: !!stg && stg.top < vh * 0.72 && stg.bottom > vh * 0.2,
        benchOut: !stg || stg.top > vh * 0.85 || stg.bottom < vh * 0.12,
      }
    }

    /** le strade fra la i, i piani e il banco */
    function route() {
      const z = zones()
      const vh = window.innerHeight
      // nel frattempo la bilia l'ha presa il 3D (il fascicolo aperto, il Game Boy): il salto finisce qui
      if (st.jump && marble.mode !== 'page') { st.jump = null; st.lift = 0 }
      if (st.jump) {
        // cambia idea a mezz'aria: il banco e' uscito mentre ci saltava, o la pagina
        // e' ridiscesa mentre tornava sulla i. Riparte da dov'e' verso un piano
        const j = st.jump
        if ((j.kind === 'bench' && z.benchOut) || (j.kind === 'logo' && z.textIn)) toFloor(true)
        return
      }
      const m = marble.mode
      if (m === 'logo') {
        if (!marble.logoAt.ok) return
        if (z.benchIn && marble.enterBench && marble.landAt.ok) {
          // un link diretto al banco: dalla i dritta sul banco
          take(marble.logoAt)
          toBench()
        } else if (z.textIn && !z.benchIn) {
          // dalla i sul piano del testo, sotto di lei
          const i = bestFloor()
          if (i < 0) return
          take(marble.logoAt)
          jumpOnPage(here(), landOn(i, marble.logoAt.x, true), i)
        }
      } else if (m === 'page') {
        if (st.drag) return
        if (z.benchIn && marble.enterBench && marble.landAt.ok && marble.benchFree) {
          toBench()
        } else if (z.textOut && marble.logoAt.ok) {
          jump('logo', here(), () => marble.logoAt, () => {
            marble.mode = 'logo'
            hideIn = 2   // la bilia del 3D ricompare al prossimo fotogramma: fino ad allora resta questa
            marble.invalidate?.()
          })
        } else {
          // uscita dallo schermo insieme al suo piano: cade su quello che si vede
          const sy0 = st.y - sy
          if (sy0 < -2 * st.r || sy0 > vh + 2 * st.r) toFloor(sy0 < 0)
        }
      } else if ((m === 'roll' || m === 'fall') && z.benchOut && marble.benchFree && marble.benchAt.ok) {
        // fuori dal banco: torna su un piano, se se ne vede uno
        const i = bestFloor()
        if (i < 0) return
        take(marble.benchAt)
        jumpOnPage(here(), landOn(i, st.x, st.y - sy < vh / 2), i)
      }
    }

    function toBench() {
      st.floor = -1
      jump('bench', here(), () => marble.landAt, () => land())
    }
    /** da dov'e' adesso, a mezz'aria compresa, sul piano che si vede. Se e' fuori
     *  dallo schermo cade dal bordo da cui e' uscita: dall'alto, o risale dal basso */
    function toFloor(fromAbove: boolean) {
      const i = bestFloor()
      if (i < 0) { st.jump = null; return }
      st.lift = 0
      const vh = window.innerHeight
      const from = here()
      const off = from.y - sy < -st.r || from.y - sy > vh + st.r
      if (off) from.y = sy + (fromAbove ? -3 * st.r : vh + 3 * st.r)
      const at = landOn(i, st.x, fromAbove)
      jumpOnPage(from, at, i)
      // una caduta: poco arco, e svelta
      if (off && st.jump) { st.jump.h = fromAbove ? 12 : 60; st.jump.dur = 0.5 }
    }

    /** la bilia passa alla pagina, da dove si vedeva nel 3D */
    function take(from: Spot) {
      marble.mode = 'page'
      st.x = st.gx = from.x; st.y = st.gy = from.y + sy; st.r = from.r
      st.floor = -1
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
        st.gy = j.y0 + (to.y + sy - j.y0) * t
        st.lift = 4 * j.h * t * (1 - t)
        st.x = st.gx
        st.y = st.gy - st.lift
        st.r = j.r0 + (to.r - j.r0) * (t * t * (3 - 2 * t))
        if (t >= 1) {
          st.jump = null
          st.lift = 0
          st.y = st.gy
          j.then?.()
        }
        return
      }
      if (marble.mode !== 'page' || st.drag) return
      st.r += (R - st.r) * Math.min(1, dt * 10)
      const f = floors[st.floor]
      if (!f) { st.vx = st.vy = 0; return }
      // rotola e rallenta; i bordi del piano la respingono
      const sp = Math.hypot(st.vx, st.vy)
      if (sp < 4) { st.vx = st.vy = 0; return }
      st.x += st.vx * dt; st.y += st.vy * dt
      const k = Math.exp(-ROLL_DRAG * dt)
      st.vx *= k; st.vy *= k
      if (st.x < f.left + R) { st.x = f.left + R; st.vx = Math.abs(st.vx) * BOUNCE }
      if (st.x > f.right - R) { st.x = f.right - R; st.vx = -Math.abs(st.vx) * BOUNCE }
      if (st.y < f.top + R) { st.y = f.top + R; st.vy = Math.abs(st.vy) * BOUNCE }
      if (st.y > f.bottom - R) { st.y = f.bottom - R; st.vy = -Math.abs(st.vy) * BOUNCE }
      st.gx = st.x; st.gy = st.y
    }

    const layer = ball.parentElement
    function draw() {
      // dove sta la bilia, per chi ispeziona la pagina (e per le prove)
      if (layer) {
        if (layer.dataset.mode !== marble.mode) layer.dataset.mode = marble.mode
        const f = String(st.jump ? st.jump.kind : st.floor)
        if (layer.dataset.floor !== f) layer.dataset.floor = f
      }
      const on = marble.mode === 'page' || hideIn > 0
      if (hideIn > 0 && marble.mode !== 'page') hideIn--
      const vis = on && !useStore.getState().gameOpen
      if (vis !== shown) {
        shown = vis
        ball.style.opacity = shadow.style.opacity = vis ? '' : '0'
      }
      band.style.opacity = vis && st.drag ? '1' : '0'
      if (!vis) return
      const s = st.r / RB
      const x = st.x, y = st.y - sy
      ball.style.transform = `translate3d(${(x - RB).toFixed(2)}px,${(y - RB).toFixed(2)}px,0) scale(${s.toFixed(4)})`
      // l'ombra: a terra sotto la bilia, si allarga e schiarisce quando si alza
      const up = Math.min(st.lift / 160, 1)
      shadow.style.transform = `translate3d(${(st.gx + st.r * 0.3 - RB).toFixed(2)}px,${(st.gy - sy + st.r * 0.62 - RB).toFixed(2)}px,0) scale(${(s * (1 + up * 0.5)).toFixed(4)})`
      shadow.style.opacity = (0.9 - up * 0.6).toFixed(3)
      if (st.drag) {
        // l'elastico della fionda, dalla bilia al punto tirato
        const dx = st.px - x, dy = st.py - y
        band.style.width = `${Math.hypot(dx, dy).toFixed(1)}px`
        band.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${Math.atan2(dy, dx).toFixed(4)}rad)`
      }
    }

    function tick(now: number) {
      // il tempo vero, a passi piccoli: anche con un fotogramma lungo la bilia va giusta
      let left = Math.min((now - last) / 1000, 0.1)
      last = now
      measure()
      route()
      while (left > 1e-6) {
        const dt = Math.min(left, 1 / 120)
        left -= dt
        step(dt)
      }
      draw()
      raf = requestAnimationFrame(tick)
    }

    /* ── il mirino: il cursore, come sul banco ── */

    const ready = () => marble.mode === 'page' && !st.jump && st.floor >= 0 && !useStore.getState().gameOpen
    /** il punto e' sulla bilia (sullo schermo, con un margine per prenderla bene) */
    const onBall = (cx: number, cy: number) => Math.hypot(cx - st.x, cy - (st.y - sy)) < Math.max(20, st.r * 2.2)
    let press: { x: number; y: number } | null = null

    const onDown = (e: PointerEvent) => {
      press = null
      if (e.button !== 0 || !ready() || busy(e.target)) return
      // la fionda solo con il mouse: con il dito si scorre la pagina
      if (e.pointerType === 'mouse' && onBall(e.clientX, e.clientY)) {
        st.drag = true
        st.vx = st.vy = 0
        st.px = e.clientX; st.py = e.clientY
        body.style.cursor = 'grabbing'
        e.preventDefault()   // niente testo selezionato mentre si tira
        return
      }
      press = { x: e.clientX, y: e.clientY }
    }
    const onMove = (e: PointerEvent) => {
      if (st.drag) {
        // la fionda si tende al massimo di un palmo
        const x = st.x, y = st.y - sy
        let dx = e.clientX - x, dy = e.clientY - y
        const d = Math.hypot(dx, dy)
        if (d > PULL_MAX) { dx *= PULL_MAX / d; dy *= PULL_MAX / d }
        st.px = x + dx; st.py = y + dy
        return
      }
      if (e.pointerType === 'mouse') {
        const near = ready() && onBall(e.clientX, e.clientY)
        if (near) body.style.cursor = 'grab'
        else if (body.style.cursor === 'grab') body.style.cursor = ''
      }
    }
    const onUp = (e: PointerEvent) => {
      if (st.drag) {
        st.drag = false
        body.style.cursor = 'grab'
        const dx = st.x - st.px, dy = st.y - sy - st.py
        const d = Math.hypot(dx, dy)
        if (d > 6) {
          const v = Math.min(SHOT_MAX, d * SHOT)
          st.vx = dx / d * v; st.vy = dy / d * v
        }
        return
      }
      const p = press
      press = null
      if (!p || !ready() || busy(e.target) || Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) return
      // non se si sta selezionando del testo
      if (window.getSelection()?.toString()) return
      // un clic su un piano: la bilia ci salta, anche da un piano all'altro
      const x = e.clientX, y = e.clientY + sy
      const i = floorAt(x, y)
      if (i < 0) return
      const f = floors[i]!
      jumpOnPage(here(), { x: clamp(x, f.left + R, f.right - R), y: clamp(y, f.top + R, f.bottom - R), r: R }, i)
    }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (body.style.cursor === 'grab' || body.style.cursor === 'grabbing') body.style.cursor = ''
    }
  }, [])

  return (
    <div className={styles.layer} aria-hidden="true">
      <div ref={bandRef} className={styles.band} style={{ opacity: 0 }} />
      <div ref={shadowRef} className={styles.shadow} style={{ opacity: 0 }} />
      <div ref={ballRef} className={styles.ball} style={{ opacity: 0 }} data-marble="" />
    </div>
  )
}

function clamp(v: number, a: number, b: number) { return v < a ? a : v > b ? b : v }
