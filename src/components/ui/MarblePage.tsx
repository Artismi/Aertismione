'use client'

/**
 * La bilia: una sola, sempre la stessa, su un unico piano di gioco che e' tutta
 * la pagina, banco compreso.
 *
 * Nasce come pallino della i del logo; appena la pagina sale e compare il testo
 * si stacca e cade sul piano. Li' fa come una bilia vera: un clic su un punto
 * libero e ci salta, premuta e tirata e' una fionda, rotola, rallenta, rimbalza
 * sui bordi. Scorrendo, i bordi dello schermo la spingono come pareti: se la
 * porta dietro e le danno un po' di slancio, cosi' resta sempre in vista e la
 * pagina e la bilia scorrono insieme. Sul banco il fascicolo e il Game Boy sono
 * ostacoli (li misura Marble3D): colpito forte, o cliccato, il Game Boy se la
 * prende e si accende; aperto il fascicolo ci salta dentro e li' la muove la
 * mappa, richiuso ne esce. Tornando in cima risale sulla i.
 *
 * E' fuori dal 3D apposta: tre div spostati con transform, niente da ridisegnare,
 * cosi' resta fluida anche quando il mondo dietro e' pesante. Il tempo e' quello
 * vero (non i fotogrammi): con qualche fotogramma perso la bilia non rallenta.
 */

import { useEffect, useRef } from 'react'
import { marble, type Spot, type Quad } from '@/components/canvas/table/marble'
import { worldHold } from '@/components/canvas/table/shared'
import { useStore } from '@/stores/useStore'
import styles from './MarblePage.module.css'

/** meta' del lato del disegno: la bilia si fa grande o piccola con scale() */
const RB = 40
/** la bilia sullo schermo: la stessa dappertutto (anche la mappa del fascicolo la disegna cosi') */
export const MARBLE_PX = { desk: 14, touch: 11 }
/** come sul banco: la velocita' si dimezza in mezzo secondo, i bordi restituiscono poco piu' di meta' */
const ROLL_DRAG = 1.4
const BOUNCE = 0.55
/** la fionda: quanto si tende al massimo e quanto spinge */
const PULL_MAX = 150
const SHOT = 9
const SHOT_MAX = 2400
/** colpito piu' forte di cosi', il Game Boy se la prende */
const CONSOLE_HIT = 700
/** sotto la barra del menu la bilia non va */
const NAV = 72

type P = { x: number; y: number; r: number }
type Jump = {
  /** dove va: sul piano, sulla i, nel fascicolo, sul Game Boy */
  kind: 'page' | 'logo' | 'board' | 'console'
  /** da dove parte, in coordinate della pagina */
  x0: number; y0: number; r0: number
  /** dove arriva, in coordinate della pagina */
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
  const aimRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ballRef.current || !shadowRef.current || !bandRef.current || !aimRef.current || !coreRef.current) return
    const ball: HTMLDivElement = ballRef.current
    const shadow: HTMLDivElement = shadowRef.current
    const band: HTMLDivElement = bandRef.current
    const aim: HTMLDivElement = aimRef.current
    const core: HTMLDivElement = coreRef.current
    const body = document.body
    const layer = ball.parentElement

    const fine = window.matchMedia('(pointer: fine)').matches
    const R = fine ? MARBLE_PX.desk : MARBLE_PX.touch

    // x, y: la bilia nella pagina; gx, gy: il punto a terra sotto di lei (nei salti resta giu')
    const st = {
      x: 0, y: 0, r: R, vx: 0, vy: 0, gx: 0, gy: 0, lift: 0,
      jump: null as Jump | null, drag: false, px: 0, py: 0,
      /** si muove perche' e' stata tirata (fionda), non perche' la spinge lo schermo */
      shot: false,
      /** quanto ha rotolato (px sul piano): la spirale dentro il vetro gira di tanto */
      rx: 0, ry: 0,
    }
    let shown = false, raf = 0, last = performance.now()
    let sy = window.scrollY, prevSy = sy, scrollV = 0

    /** il piano: da dove comincia il testo sotto il logo fino in fondo alla pagina */
    const plane = { top: 0, bottom: 0, left: 0, right: 0 }
    /** il piano si rimisura ogni mezzo secondo (e quando cambia la finestra), non a ogni
     *  fotogramma: leggere le misure della pagina mentre scorre obbliga il browser a
     *  rifare l'impaginazione, e lo scroll scattava */
    let measuredAt = -Infinity
    function measure(now: number) {
      sy = window.scrollY
      if (now - measuredAt < 500) return
      measuredAt = now
      const vh = window.innerHeight
      const vis = document.getElementById('visione')?.getBoundingClientRect()
      plane.top = (vis ? vis.top + sy + vh * 0.3 : vh * 0.8) + R
      plane.bottom = document.documentElement.scrollHeight - R - 4
      plane.left = R + 4
      plane.right = window.innerWidth - R - 4
    }
    /** dove la bilia puo' stare adesso: il piano, e dentro lo schermo (sotto il menu) */
    const lo = () => Math.max(plane.top, sy + NAV + R)
    const hi = () => Math.min(plane.bottom, sy + window.innerHeight - R - 6)
    const inView = (x: number, y: number): P => ({ x: clamp(x, plane.left, plane.right), y: clamp(y, lo(), Math.max(lo(), hi())), r: R })
    /** I punti che misura il 3D arrivano ai suoi fotogrammi, che sono meno di quelli
     *  della pagina: seguirli cosi' com'e' fa scattare la bilia. La si fa andare verso
     *  di loro morbida, e se saltano lontano (un'altra inquadratura) li si prende subito */
    const smooth = new Map<Spot, { x: number; y: number }>()
    function follow(dt: number) {
      const k = 1 - Math.exp(-dt * 28)
      for (const s of [marble.logoAt, marble.boardAt, marble.boardMid, marble.consoleAt, marble.consoleOut]) {
        if (!s.ok) continue
        const m = smooth.get(s)
        if (!m || Math.hypot(s.x - m.x, s.y - m.y) > 260) { smooth.set(s, { x: s.x, y: s.y }); continue }
        m.x += (s.x - m.x) * k; m.y += (s.y - m.y) * k
      }
    }
    /** un punto dello schermo (dal 3D) in coordinate della pagina */
    const fromScreen = (s: Spot): P => {
      const m = smooth.get(s) ?? s
      return { x: m.x, y: m.y + sy, r: R }
    }

    /** la visuale segue il tiro: la pagina scorre per tenere la bilia nella fascia di
     *  mezzo dello schermo. Si ferma appena si scorre a mano (rotella, dito, tasti) */
    let userAt = 0
    function chase(dt: number) {
      if (!st.shot || st.drag || st.jump || marble.mode !== 'page') return
      if (performance.now() - userAt < 600) return
      const vh = window.innerHeight, y = st.y - sy
      const want = y < vh * 0.35 ? y - vh * 0.35 : y > vh * 0.65 ? y - vh * 0.65 : 0
      if (Math.abs(want) < 0.5) return
      const max = document.documentElement.scrollHeight - vh
      const to = clamp(sy + want * Math.min(1, dt * 9), 0, max)
      const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }).__lenis
      if (lenis) lenis.scrollTo(to, { immediate: true, force: true })
      else window.scrollTo(0, to)
      sy = window.scrollY
    }
    const here = (): P => ({ x: st.x, y: st.y, r: st.r })

    function jump(kind: Jump['kind'], from: P, to: Jump['to'], then: Jump['then'] = null, dur?: number) {
      const t0 = to()
      const d = Math.hypot(t0.x - from.x, t0.y - from.y)
      st.jump = {
        kind, x0: from.x, y0: from.y, r0: from.r, to, t: 0,
        dur: dur ?? clamp(0.4 + d / 1500, 0.45, 0.85),
        h: clamp(d * 0.3, 30, 200),
        then,
      }
      st.vx = st.vy = 0
      st.drag = false
    }
    /** un salto verso un punto fermo della pagina */
    const jumpTo = (at: P) => jump('page', here(), () => at)

    /** la bilia passa al piano, da dove si vedeva (la i, il tabellone, il Game Boy) */
    function take(from: Spot) {
      marble.mode = 'page'
      const p = fromScreen(from)
      st.x = st.gx = p.x; st.y = st.gy = p.y; st.r = R
      st.vx = st.vy = 0
      marble.invalidate?.()   // il 3D nasconde la sua (la i)
    }

    // il Game Boy cliccato: se la bilia e' sul banco ci salta sopra e lo accende all'atterraggio
    marble.toConsole = () => {
      const stg = marble.stage?.getBoundingClientRect()
      const onBench = !!stg && st.y - sy > stg.top && st.y - sy < stg.bottom
      if (marble.mode !== 'page' || st.jump || st.drag || !onBench || !marble.consoleAt.ok) return false
      jump('console', here(), () => fromScreen(marble.consoleAt), () => {
        marble.mode = 'console'
        marble.onConsole?.()
      })
      return true
    }

    /** le strade fra la i, il piano, il fascicolo e il Game Boy */
    function route() {
      const vh = window.innerHeight
      const ph = marble.phase
      const opening = ph === 'sliding' || ph === 'opening' || ph === 'open'
      const m = marble.mode
      if (st.jump) {
        // cambia idea a mezz'aria: la pagina e' ridiscesa mentre tornava sulla i, o il
        // fascicolo si e' richiuso mentre ci saltava dentro. Ricade sul piano, dov'e'
        const k = st.jump.kind
        if ((k === 'logo' && sy > vh * 0.06) || (k === 'board' && !opening)) {
          st.jump = null; st.lift = 0
          jumpTo(inView(st.x, st.y))
        }
        return
      }
      if (m === 'logo') {
        // appena la pagina sale e il testo entra: la i si stacca e cade sul piano
        if (sy > vh * 0.06 && marble.logoAt.ok) {
          take(marble.logoAt)
          jumpTo(inView(st.x, sy + vh * 0.72))
        }
      } else if (m === 'page') {
        if (st.drag) return
        if (opening && marble.boardMid.ok) {
          // si apre il fascicolo: la bilia ci salta dentro, al centro del tabellone
          jump('board', here(), () => fromScreen(marble.boardMid), () => { marble.mode = 'board' }, 0.8)
        } else if (sy < vh * 0.015 && marble.logoAt.ok) {
          // tornati in cima: risale sulla i
          jump('logo', here(), () => fromScreen(marble.logoAt), () => {
            marble.mode = 'logo'
            marble.invalidate?.()
          })
        }
      } else if (m === 'board' && !opening && marble.boardAt.ok) {
        // il fascicolo si chiude: la bilia salta fuori, davanti a lui
        take(marble.boardAt)
        jumpTo(inView(st.x, st.y + vh * 0.16))
      } else if (m === 'console' && !marble.grab && marble.consoleAt.ok) {
        // il Game Boy e' tornato sul banco: la bilia ne scende
        take(marble.consoleAt)
        jump('page', here(), () => fromScreen(marble.consoleOut))
      }
    }

    /** urto con un ostacolo del banco (la base di una scatola): la sposta e la fa rimbalzare */
    function collide(q: Quad | null) {
      if (!q) return false
      // il punto della base piu' vicino al centro della bilia, lato per lato;
      // la base e' convessa: la bilia e' dentro se sta dalla stessa parte di tutti i lati
      let inside = true, sign = 0, best = Infinity, bx = 0, by = 0
      for (let i = 0; i < q.length; i++) {
        const a = q[i], b = q[(i + 1) % q.length]
        const ex = b.x - a.x, ey = b.y - a.y
        const cr = ex * (st.y - a.y) - ey * (st.x - a.x)
        if (cr !== 0) { if (sign === 0) sign = Math.sign(cr); else if (Math.sign(cr) !== sign) inside = false }
        const l2 = ex * ex + ey * ey || 1
        const t = clamp(((st.x - a.x) * ex + (st.y - a.y) * ey) / l2, 0, 1)
        const cx = a.x + ex * t, cy = a.y + ey * t
        const d = Math.hypot(st.x - cx, st.y - cy)
        if (d < best) { best = d; bx = cx; by = cy }
      }
      if ((!inside && best >= R) || best < 1e-6) return false
      // fuori dal bordo verso la bilia; da dentro, la si spinge oltre il lato piu' vicino
      let nx = (st.x - bx) / best, ny = (st.y - by) / best
      if (inside) { nx = -nx; ny = -ny }
      const push = inside ? best + R : R - best
      st.x += nx * push; st.y += ny * push
      const vn = st.vx * nx + st.vy * ny
      if (vn < 0) { st.vx -= (1 + BOUNCE) * vn * nx; st.vy -= (1 + BOUNCE) * vn * ny }
      return true
    }

    function step(dt: number) {
      const j = st.jump
      if (j) {
        j.t = Math.min(1, j.t + dt / j.dur)
        const t = j.t, to = j.to()
        // la base del salto va dritta da qui a li', la bilia sale e scende sopra: l'ombra resta sulla base
        const gx = j.x0 + (to.x - j.x0) * t, gy = j.y0 + (to.y - j.y0) * t
        // in volo gira ancora, piano: lo slancio che aveva
        st.rx += (gx - st.gx) * 0.5; st.ry += (gy - st.gy) * 0.5
        st.gx = gx
        st.gy = gy
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
      // rotola e rallenta
      const k = Math.exp(-ROLL_DRAG * dt)
      st.vx *= k; st.vy *= k
      if (Math.hypot(st.vx, st.vy) < 4) { st.vx = st.vy = 0; st.shot = false }
      st.x += st.vx * dt; st.y += st.vy * dt
      st.rx += st.vx * dt; st.ry += st.vy * dt
      // i lati della pagina
      if (st.x < plane.left) { st.x = plane.left; st.vx = Math.abs(st.vx) * BOUNCE }
      if (st.x > plane.right) { st.x = plane.right; st.vx = -Math.abs(st.vx) * BOUNCE }
      // i bordi dello schermo spingono come pareti: scorrendo, la bilia viene via con la pagina
      const top = lo(), bottom = Math.max(top, hi())
      let pushed = false
      if (st.y < top) { st.y = top; st.vy = Math.max(Math.abs(st.vy) * BOUNCE, scrollV * 0.9); pushed = scrollV > 30 }
      if (st.y > bottom) { st.y = bottom; st.vy = Math.min(-Math.abs(st.vy) * BOUNCE, scrollV * 0.9); pushed = scrollV < -30 }
      if (pushed) st.shot = false
      // sul banco: il fascicolo e il Game Boy. Portata dallo schermo ci scivola sopra
      // (fra il bordo e un ostacolo resterebbe schiacciata); tirata, ci sbatte, e il
      // Game Boy colpito forte se la prende
      if (!pushed) {
        const sp = Math.hypot(st.vx, st.vy)
        collide(marble.obstacles.folder)
        if (collide(marble.obstacles.console) && st.shot && sp > CONSOLE_HIT) marble.toConsole?.()
      }
      st.gx = st.x; st.gy = st.y
    }

    function draw() {
      if (layer) {
        // dove sta la bilia e dove salta, per chi ispeziona la pagina (e per le prove)
        if (layer.dataset.mode !== marble.mode) layer.dataset.mode = marble.mode
        const jk = st.jump?.kind ?? ''
        if (layer.dataset.jump !== jk) layer.dataset.jump = jk
      }
      // dentro il fascicolo, con la tavola piatta sulla pagina, la disegna la mappa;
      // mentre la camera ci arriva (o se ne va) la si disegna qui, sul tabellone
      const onBoard = marble.mode === 'board' && !st.jump
      if (onBoard && !worldHold.on && marble.boardAt.ok) {
        const p = fromScreen(marble.boardAt)
        st.x = st.gx = p.x; st.y = st.gy = p.y; st.lift = 0
      }
      const vis = (marble.mode === 'page' || !!st.jump || (onBoard && !worldHold.on))
        && !useStore.getState().gameOpen
      if (vis !== shown) {
        shown = vis
        ball.style.opacity = shadow.style.opacity = vis ? '' : '0'
      }
      band.style.opacity = aim.style.opacity = vis && st.drag ? '1' : '0'
      if (!vis) return
      // la spirale: la superficie scorre di quanto ha rotolato (nel disegno grande RB, la bilia e' st.r)
      const kr = RB / Math.max(1, st.r)
      core.style.backgroundPosition = `0 0, ${(-st.rx * kr) % 68}px ${(-st.ry * kr) % 68}px`
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
        const d = Math.hypot(dx, dy)
        band.style.width = `${d.toFixed(1)}px`
        band.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${Math.atan2(dy, dx).toFixed(4)}rad)`
        // la mira, dall'altra parte: lunga quanto la corsa che fara' (un terzo, per restare sullo schermo)
        const run = Math.min(SHOT_MAX, d * SHOT) / ROLL_DRAG / 3
        aim.style.width = `${(d > 6 ? run : 0).toFixed(1)}px`
        aim.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${Math.atan2(-dy, -dx).toFixed(4)}rad)`
      }
    }

    function tick(now: number) {
      // il tempo vero, a passi piccoli: anche con un fotogramma lungo la bilia va giusta
      const raw = Math.min((now - last) / 1000, 0.1)
      last = now
      measure(now)
      // quanto corre la pagina (px al secondo, verso il basso positivo): e' la spinta dei bordi
      if (raw > 0) scrollV = scrollV * 0.5 + ((sy - prevSy) / raw) * 0.5
      prevSy = sy
      follow(raw)
      route()
      let left = raw
      while (left > 1e-6) {
        const dt = Math.min(left, 1 / 120)
        left -= dt
        step(dt)
      }
      chase(raw)
      draw()
      raf = requestAnimationFrame(tick)
    }

    /* ── il mirino: il cursore, dappertutto come sul banco ── */

    const ready = () => marble.mode === 'page' && !st.jump && !useStore.getState().gameOpen
    /** il punto e' sulla bilia (sullo schermo, con un margine per prenderla bene) */
    const onBall = (cx: number, cy: number) => Math.hypot(cx - st.x, cy - (st.y - sy)) < Math.max(30, st.r * 2.6)
    const theirs = () => !!(marble.hover?.folder || marble.hover?.console)
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
          st.shot = true
        }
        return
      }
      const p = press
      press = null
      if (!p || !ready() || busy(e.target) || theirs() || Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) return
      // non se si sta selezionando del testo
      if (window.getSelection()?.toString()) return
      // un clic su un punto libero: la bilia ci salta. Si decide appena dopo il clic:
      // se era sul fascicolo o sul Game Boy (il 3D lo segna) il clic e' loro
      const at = inView(e.clientX, e.clientY + sy)
      window.setTimeout(() => {
        if (performance.now() - marble.clickedAt < 300 || !ready()) return
        jumpTo(at)
      }, 0)
    }

    // si scorre a mano: la visuale smette di seguire la bilia, per tutto il tiro (prima
    // dopo poco la riprendeva e tirava la pagina contro chi scorreva)
    const byHand = () => { userAt = performance.now(); st.shot = false }
    const byKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) byHand()
    }

    const remeasure = () => { measuredAt = -Infinity }
    window.addEventListener('resize', remeasure)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('wheel', byHand, { passive: true })
    window.addEventListener('touchmove', byHand, { passive: true })
    window.addEventListener('keydown', byKey)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('wheel', byHand)
      window.removeEventListener('touchmove', byHand)
      window.removeEventListener('keydown', byKey)
      marble.toConsole = null
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (body.style.cursor === 'grab' || body.style.cursor === 'grabbing') body.style.cursor = ''
    }
  }, [])

  return (
    <div className={styles.layer} aria-hidden="true">
      <div ref={bandRef} className={styles.band} style={{ opacity: 0 }} />
      <div ref={aimRef} className={styles.aim} style={{ opacity: 0 }} />
      <div ref={shadowRef} className={styles.shadow} style={{ opacity: 0 }} />
      <div ref={ballRef} className={styles.ball} style={{ opacity: 0 }} data-marble="">
        <div ref={coreRef} className={styles.core} />
        <div className={styles.gloss} />
      </div>
    </div>
  )
}

function clamp(v: number, a: number, b: number) { return v < a ? a : v > b ? b : v }
