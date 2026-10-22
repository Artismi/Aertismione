'use client'

/**
 * La bilia sul banco: una sfera di vetro ambra con una fisica fatta a mano,
 * su un piano solo (il banco), con pochi ostacoli a scatola. Niente motore di
 * fisica: costa quanto una sfera, e il mondo si ridisegna solo mentre si muove.
 *
 * - Scendendo nella pagina il pallino della i (LogoModel) si stacca e cade sul banco.
 * - Il cursore e' il mirino: un clic sul banco e la bilia ci salta; premuta e
 *   tirata indietro e' una fionda, e sbatte contro il fascicolo e i bordi.
 * - Aperto il fascicolo ci salta dentro (poi la mappa e' di PortfolioSection);
 *   cliccato il Game Boy, o colpito, ci salta sopra e all'atterraggio lo accende.
 * - Tornando in cima alla pagina torna a essere il pallino della i.
 */

import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { marble } from './marble'
import { worldHold } from './shared'
import { BENCH } from './Bench'
import { FW, FD, BW, BD, BOARD_Y, MOBILE_Z } from './Folder3D'
import type { TablePhase } from './Table3D'

/** raggio della bilia: quanto il pallino della i del logo */
export const MARBLE_R = 0.14
const GRAVITY = 22
/** attrito di rotolamento: la velocita' si dimezza in circa mezzo secondo */
const ROLL_DRAG = 1.4
const BOUNCE = 0.55
const MAX_SHOT = 9
const EPS = 1e-4
/** sul tabellone del fascicolo la bilia e' piu' piccola */
const BOARD_SCALE = 0.6

type Box = { x: number; z: number; hx: number; hz: number; ry: number }

/** il fascicolo chiuso e la base del Game Boy, sul banco (vedi Folder3D e Console3D) */
function obstacles(mobile: boolean): { folder: Box; console: Box } {
  return mobile
    ? { folder: { x: 0, z: MOBILE_Z, hx: FW / 2, hz: FD / 2, ry: 0 },
        console: { x: 0.3, z: 1.75, hx: 0.5 * 1.1, hz: 0.49 * 1.1, ry: -0.3 } }
    : { folder: { x: -1.55, z: 0.05, hx: FW / 2, hz: FD / 2, ry: 0.07 },
        console: { x: 2.15, z: 0.4, hx: 0.5 * 1.25, hz: 0.49 * 1.25, ry: -0.4 } }
}

/** dove la bilia si posa cadendo, e dove torna saltando fuori dal fascicolo o dal Game Boy */
const LANDING = { desk: new THREE.Vector3(0.45, MARBLE_R, 1.45), mobile: new THREE.Vector3(-0.7, MARBLE_R, 0.75) }

/** urto tra la bilia (cerchio sul piano) e una scatola girata: sposta e fa rimbalzare. true se ha toccato */
function collide(p: THREE.Vector3, v: THREE.Vector3, b: Box, bounce: number) {
  const c = Math.cos(b.ry), s = Math.sin(b.ry)
  // nel riferimento della scatola (rotazione inversa attorno a y)
  const dx = p.x - b.x, dz = p.z - b.z
  const lx = dx * c - dz * s, lz = dx * s + dz * c
  const cx = THREE.MathUtils.clamp(lx, -b.hx, b.hx), cz = THREE.MathUtils.clamp(lz, -b.hz, b.hz)
  let nx = lx - cx, nz = lz - cz
  let d = Math.hypot(nx, nz)
  if (d >= MARBLE_R) return false
  if (d < EPS) {
    // il centro e' dentro: si esce dal lato piu' vicino
    const ex = b.hx - Math.abs(lx), ez = b.hz - Math.abs(lz)
    if (ex < ez) { nx = Math.sign(lx) || 1; nz = 0 } else { nx = 0; nz = Math.sign(lz) || 1 }
    d = 0
  } else { nx /= d; nz /= d }
  // la normale torna nel mondo
  const wx = nx * c + nz * s, wz = -nx * s + nz * c
  const push = MARBLE_R - d + (d === 0 ? Math.max(b.hx, b.hz) : 0)
  p.x += wx * push; p.z += wz * push
  const vn = v.x * wx + v.z * wz
  if (vn < 0) { v.x -= (1 + bounce) * vn * wx; v.z -= (1 + bounce) * vn * wz }
  return true
}

type Jump = { from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number; h: number; then: (() => void) | null }

export function Marble3D({ phase, mobile, grab, stage, hover, onConsole }: {
  phase: TablePhase
  mobile: boolean
  grab: boolean
  stage: RefObject<HTMLDivElement | null>
  /** il mouse e' sul fascicolo o sul Game Boy: il clic e' loro */
  hover: RefObject<{ folder: boolean; console: boolean }>
  /** la bilia e' atterrata sul Game Boy: si accende */
  onConsole: () => void
}) {
  const { camera, gl, invalidate } = useThree()
  const mesh = useRef<THREE.Mesh>(null!)

  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    // vetro ambra: la luce passa e si scalda nello spessore
    // (chiara: sul legno scuro una tinta piena la faceva sembrare una perlina marrone)
    color: '#fff0e2', transmission: 1, thickness: 0.2, roughness: 0.03, ior: 1.45,
    attenuationColor: new THREE.Color('#f3a66a'), attenuationDistance: 0.7,
    emissive: new THREE.Color('#ff9a52'), emissiveIntensity: 0.06,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2, specularIntensity: 1,
  }), [])
  const bandMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#c4622d', transparent: true, opacity: 0.85 }), [])
  const bandGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), [])
  const band = useMemo(() => new THREE.Line(bandGeo, bandMat), [bandGeo, bandMat])
  useEffect(() => () => { mat.dispose(); bandMat.dispose(); bandGeo.dispose() }, [mat, bandMat, bandGeo])

  // lo stato vive fuori da React: cambia a ogni fotogramma
  const s = useRef({
    p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion(),
    jump: null as Jump | null,
    drag: false, pull: new THREE.Vector3(),
    lo: new THREE.Vector2(-4, -2), hi: new THREE.Vector2(4, 2),
    phase, mobile, grab,
  })
  const k = useMemo(() => ({
    ray: new THREE.Raycaster(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -MARBLE_R),
    ndc: new THREE.Vector2(), hit: new THREE.Vector3(), axis: new THREE.Vector3(), dq: new THREE.Quaternion(),
    proj: new THREE.Vector3(),
  }), [])

  const props = useRef({ onConsole })
  props.current.onConsole = onConsole

  function landing() { return (s.current.mobile ? LANDING.mobile : LANDING.desk).clone() }

  function jumpTo(to: THREE.Vector3, then: (() => void) | null = null, dur?: number) {
    const st = s.current
    const dist = st.p.distanceTo(to)
    marble.mode = 'jump'
    st.v.set(0, 0, 0)
    st.jump = {
      from: st.p.clone(), to: to.clone(), t: 0,
      dur: dur ?? THREE.MathUtils.clamp(0.35 + dist * 0.12, 0.45, 0.95),
      h: THREE.MathUtils.clamp(dist * 0.3, 0.25, 1.3), then,
    }
    invalidate()
  }

  /** sopra la base del Game Boy, davanti al coperchio */
  function consoleTop() {
    const b = obstacles(s.current.mobile).console
    const lz = 0.18
    return new THREE.Vector3(b.x + lz * Math.sin(b.ry), 0.145 + MARBLE_R, b.z + lz * Math.cos(b.ry))
  }

  // il Game Boy cliccato: se la bilia e' sul banco ci salta sopra e lo accende all'atterraggio
  useEffect(() => {
    marble.toConsole = () => {
      if (marble.mode !== 'roll') return false
      jumpTo(consoleTop(), () => { marble.mode = 'console'; props.current.onConsole() })
      return true
    }
    return () => { marble.toConsole = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // le fasi del fascicolo e del Game Boy
  useEffect(() => {
    const st = s.current
    st.phase = phase; st.mobile = mobile; st.grab = grab
    const onBench = marble.mode === 'roll' || marble.mode === 'jump' || marble.mode === 'fall'
    if (phase === 'opening' && onBench) {
      // la copertina si apre: la bilia salta dentro, al centro del tabellone, e
      // atterra quando la mappa compare (COVER_MS di PortfolioSection)
      st.jump = null
      jumpTo(new THREE.Vector3(0, BOARD_Y + MARBLE_R, mobile ? MOBILE_Z : 0), () => { marble.mode = 'board' }, 0.8)
    }
    // aperto prima che la bilia fosse scesa dalla i (un link diretto): e' gia' dentro
    if (phase === 'open' && marble.mode === 'logo') marble.mode = 'board'
    if (phase === 'closed' && marble.mode === 'board') {
      // il fascicolo si e' richiuso: la bilia salta fuori, sul banco
      st.p.set(mobile ? -0.2 : -1.2, 0.08 + MARBLE_R, mobile ? MOBILE_Z : 0.1)
      jumpTo(landing())
    }
    if (!grab && marble.mode === 'console') {
      // il Game Boy e' tornato sul banco: la bilia ne scende
      st.p.copy(consoleTop())
      const to = consoleTop(); to.y = MARBLE_R
      const b = obstacles(mobile).console
      to.x -= Math.cos(b.ry) * 0.95; to.z += Math.sin(b.ry) * 0.95
      jumpTo(to)
    }
    invalidate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mobile, grab])

  // il mirino: clic per saltare, premi e tira per la fionda
  useEffect(() => {
    const st = s.current
    let press: { x: number; y: number } | null = null
    const body = document.body

    function onPlane(cx: number, cy: number) {
      const r = gl.domElement.getBoundingClientRect()
      k.ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1)
      k.ray.setFromCamera(k.ndc, camera)
      return k.ray.ray.intersectPlane(k.plane, k.hit) ? k.hit : null
    }
    function onScreen() {
      const r = stage.current?.getBoundingClientRect()
      return !!r && r.bottom > 0 && r.top < window.innerHeight
    }
    function ours(e: PointerEvent) {
      const t = e.target as Element | null
      return !t?.closest?.('a, button, input, textarea, select, nav, header, [role="dialog"]')
    }
    /** il punto e' sulla bilia (sullo schermo, con un margine per prenderla bene) */
    function onBall(cx: number, cy: number) {
      const r = gl.domElement.getBoundingClientRect()
      k.proj.copy(st.p).project(camera)
      const px = (k.proj.x + 1) / 2 * r.width + r.left, py = (1 - k.proj.y) / 2 * r.height + r.top
      k.proj.copy(st.p).addScaledVector(camera.up, MARBLE_R).project(camera)
      const rad = Math.abs((1 - k.proj.y) / 2 * r.height + r.top - py)
      return Math.hypot(cx - px, cy - py) < Math.max(22, rad * 1.8)
    }
    const ready = () => marble.mode === 'roll' && st.phase === 'closed' && !st.grab && onScreen()

    function down(e: PointerEvent) {
      if (e.button !== 0 || !ready() || !ours(e)) return
      // la fionda solo con il mouse: con il dito si scorre la pagina
      if (e.pointerType === 'mouse' && onBall(e.clientX, e.clientY)) {
        st.drag = true
        st.pull.copy(st.p)
        st.v.set(0, 0, 0)
        body.style.cursor = 'grabbing'
        invalidate()
        return
      }
      press = { x: e.clientX, y: e.clientY }
    }
    function move(e: PointerEvent) {
      if (st.drag) {
        const h = onPlane(e.clientX, e.clientY)
        if (h) {
          st.pull.copy(h)
          // la fionda si tende al massimo di poco piu' di un palmo
          const d = st.pull.distanceTo(st.p)
          if (d > 1.6) st.pull.sub(st.p).multiplyScalar(1.6 / d).add(st.p)
        }
        invalidate()
        return
      }
      if (e.pointerType === 'mouse' && ready()) {
        const near = onBall(e.clientX, e.clientY)
        if (near) body.style.cursor = 'grab'
        else if (body.style.cursor === 'grab') body.style.cursor = ''
      }
    }
    function up(e: PointerEvent) {
      if (st.drag) {
        st.drag = false
        body.style.cursor = 'grab'
        const d = st.pull.distanceTo(st.p)
        if (d > 0.06) st.v.subVectors(st.p, st.pull).setY(0).multiplyScalar(Math.min(MAX_SHOT, d * 6.5) / d)
        invalidate()
        return
      }
      const pr = press
      press = null
      if (!pr || !ready() || Math.hypot(e.clientX - pr.x, e.clientY - pr.y) > 8) return
      // sul fascicolo e sul Game Boy il clic e' loro
      if (hover.current?.folder || hover.current?.console) return
      const h = onPlane(e.clientX, e.clientY)
      if (!h) return
      const to = h.clone()
      to.x = THREE.MathUtils.clamp(to.x, st.lo.x, st.hi.x)
      to.z = THREE.MathUtils.clamp(to.z, st.lo.y, st.hi.y)
      jumpTo(to)
    }
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (body.style.cursor === 'grab' || body.style.cursor === 'grabbing') body.style.cursor = ''
    }
  }, [camera, gl, invalidate, stage, hover, k])

  /** la parte di banco che si vede: la bilia resta li' dentro */
  function bounds() {
    const st = s.current
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const [x, y] of [[-0.88, -0.82], [0.88, -0.82], [0.88, 0.7], [-0.88, 0.7]]) {
      k.ndc.set(x, y)
      k.ray.setFromCamera(k.ndc, camera)
      if (!k.ray.ray.intersectPlane(k.plane, k.hit)) return
      x0 = Math.min(x0, k.hit.x); x1 = Math.max(x1, k.hit.x); z0 = Math.min(z0, k.hit.z); z1 = Math.max(z1, k.hit.z)
    }
    const bx = BENCH.w / 2 - MARBLE_R, bz = BENCH.d / 2 - MARBLE_R
    st.lo.set(Math.max(x0, -bx), Math.max(z0, -bz))
    st.hi.set(Math.min(x1, bx), Math.min(z1, bz))
  }

  /** rotola: la sfera gira attorno all'asse orizzontale perpendicolare al moto */
  function spin(dx: number, dz: number) {
    const d = Math.hypot(dx, dz)
    if (d < 1e-6) return
    k.axis.set(dz / d, 0, -dx / d)
    k.dq.setFromAxisAngle(k.axis, d / MARBLE_R)
    s.current.q.premultiply(k.dq)
  }

  /** un passo di fisica; true se la bilia si e' mossa */
  function step(dt: number) {
    const st = s.current
    let moving = false
    if (marble.mode === 'fall') {
      st.v.y -= GRAVITY * dt
      st.p.addScaledVector(st.v, dt)
      if (st.p.y <= MARBLE_R) {
        st.p.y = MARBLE_R
        if (Math.abs(st.v.y) > 1.2) st.v.y = -st.v.y * 0.38
        else {
          st.v.set(0.6, 0, -0.25)   // un filo di spinta: si vede che e' una sfera
          marble.mode = 'roll'
        }
      }
      moving = true
    } else if (marble.mode === 'jump' && st.jump) {
      const j = st.jump
      j.t = Math.min(1, j.t + dt / j.dur)
      const t = j.t
      st.p.lerpVectors(j.from, j.to, t)
      st.p.y += 4 * j.h * t * (1 - t)
      moving = true
      if (t >= 1) {
        st.jump = null
        marble.mode = 'roll'
        st.v.set(0, 0, 0)
        j.then?.()
      }
    } else if (marble.mode === 'roll' && !st.drag) {
      const sp = Math.hypot(st.v.x, st.v.z)
      if (sp > 0.01) {
        st.p.x += st.v.x * dt; st.p.z += st.v.z * dt
        const f = Math.exp(-ROLL_DRAG * dt)
        st.v.x *= f; st.v.z *= f
        // bordi della parte di banco inquadrata
        if (st.p.x < st.lo.x) { st.p.x = st.lo.x; st.v.x = Math.abs(st.v.x) * BOUNCE }
        if (st.p.x > st.hi.x) { st.p.x = st.hi.x; st.v.x = -Math.abs(st.v.x) * BOUNCE }
        if (st.p.z < st.lo.y) { st.p.z = st.lo.y; st.v.z = Math.abs(st.v.z) * BOUNCE }
        if (st.p.z > st.hi.y) { st.p.z = st.hi.y; st.v.z = -Math.abs(st.v.z) * BOUNCE }
        if (st.phase === 'closed') {
          const o = obstacles(st.mobile)
          collide(st.p, st.v, o.folder, BOUNCE)
          // colpito il Game Boy: ci salta sopra e lo accende
          if (collide(st.p, st.v, o.console, BOUNCE) && sp > 1.2 && marble.toConsole) marble.toConsole()
        }
        moving = true
      } else st.v.set(0, 0, 0)
    }
    return moving
  }

  useFrame((_, rawDt) => {
    const st = s.current
    const m = mesh.current
    const r = stage.current?.getBoundingClientRect()
    const vh = window.innerHeight

    // scendendo nella pagina il pallino della i si stacca e cade sul banco;
    // tornando in cima ritorna al suo posto
    if (marble.mode === 'logo' && r && r.top < vh * 0.72 && r.bottom > vh * 0.2 && st.phase === 'closed') {
      st.p.copy(landing()).setY(6)
      st.v.set(0, 0, 0)
      marble.mode = 'fall'
    } else if (marble.mode !== 'logo' && marble.mode !== 'board' && marble.mode !== 'console'
      && r && r.top > vh * 1.6 && st.phase === 'closed' && !st.drag) {
      marble.mode = 'logo'
      st.jump = null
    }

    if (marble.logoBall) marble.logoBall.visible = marble.mode === 'logo'
    // sul tabellone e' piu' piccola: la mappa e' fitta di cartelline
    const sc = THREE.MathUtils.damp(m.scale.x, marble.mode === 'board' ? BOARD_SCALE : 1, 8, rawDt)
    m.scale.setScalar(sc)

    if (marble.mode === 'board') {
      // dentro il fascicolo la muove la mappa di PortfolioSection: qui solo dove sta
      m.visible = band.visible = false
      if (st.phase !== 'open') return
      // con la tavola piatta sulla pagina la bilia la disegna la mappa (drawBall)
      m.visible = !worldHold.on
      const b = marble.board
      const px0 = st.p.x, pz0 = st.p.z
      st.p.set((b.u - 0.5) * BW, BOARD_Y + MARBLE_R * sc + b.lift * BW, (st.mobile ? MOBILE_Z : 0) + (b.v - 0.5) * BD)
      spin((st.p.x - px0) / sc, (st.p.z - pz0) / sc)
      m.position.copy(st.p)
      m.quaternion.copy(st.q)
      return
    }

    const shown = marble.mode === 'fall' || marble.mode === 'roll' || marble.mode === 'jump'
    m.visible = shown
    band.visible = st.drag
    if (!shown) return

    let moving = false
    const px = st.p.x, pz = st.p.z

    // la parte di banco inquadrata, una volta per fotogramma
    if (marble.mode === 'roll' && r && r.bottom > 0 && r.top < vh) bounds()
    // il tempo vero a passi piccoli: anche con pochi fotogrammi (telefono lento)
    // la bilia va alla sua velocita' e non attraversa le cose
    let left = Math.min(rawDt, 0.25)
    while (left > 1e-6 && (marble.mode === 'fall' || marble.mode === 'jump' || marble.mode === 'roll')) {
      const dt = Math.min(left, 1 / 120)
      left -= dt
      if (step(dt)) moving = true
      else break
    }
    if (st.drag) moving = true

    spin(st.p.x - px, st.p.z - pz)
    m.position.copy(st.p)
    m.quaternion.copy(st.q)
    if (st.drag) {
      const a = bandGeo.attributes.position as THREE.BufferAttribute
      a.setXYZ(0, st.p.x, st.p.y, st.p.z)
      a.setXYZ(1, st.pull.x, st.pull.y, st.pull.z)
      a.needsUpdate = true
    }
    if (moving) invalidate()
  })

  return (
    <>
      <mesh ref={mesh} material={mat} castShadow visible={false}>
        <sphereGeometry args={[MARBLE_R, 48, 32]} />
      </mesh>
      {/* l'elastico della fionda */}
      <primitive object={band} visible={false} />
    </>
  )
}
