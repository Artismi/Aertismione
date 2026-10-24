'use client'

/**
 * La console di Porto Vecchio sul banco: la stessa del gioco a tutto schermo
 * (GameBoy, la cornice rosa), cosi' prenderla in mano e giocare sono un
 * passaggio solo. Una lastra di plastica rosa satinata, in orizzontale: nella
 * tesa la lucina, il nome e le due pillole di gomma (SCHERMO, ESCI); sotto lo
 * schermo scuro con la cornice nera. Sul banco sta su un piedino, inclinata
 * verso chi guarda.
 *
 * Plastica opaca: quella trasparente di prima faceva ridisegnare tutta la scena
 * dietro la console a ogni fotogramma, e lo scroll sul banco scattava.
 *
 * Presa in mano si raddrizza davanti alla camera e lo schermo si accende; da
 * li' PortfolioSection allarga il gioco a tutto schermo.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { slabTexture, haloTexture, screenTexture, BOOT_SECONDS, type SlabFace } from './textures'
import { gameLoad } from './gameLoad'
import type { TablePhase } from './Table3D'
import { HIT_MAT } from './Folder3D'
import styles from './Table3D.module.css'
import { consoleScreen } from './shared'

/** la lastra: larghezza, profondita', spessore, raggio degli angoli, smusso dei bordi */
export const SLAB = { w: 1.22, d: 0.88, t: 0.06, r: 0.07, bevel: 0.014 }
/** quanto e' inclinata sul piedino, verso chi guarda (~14°) */
export const TILT = 0.24
/** dove sta sul banco: posto, rotazione, scala */
export const CONSOLE_HOME = {
  desktop: { x: 2.15, z: 0.4, ry: -0.4, s: 1.15 },
  mobile: { x: 0.3, z: 1.75, ry: -0.3, s: 1.0 },
}

const B = SLAB.bevel
/** lo schermo: 16:10, come il gioco a tutto schermo */
const SCREEN = { w: 1.08, h: 0.675 }
/** la faccia: lo schermo in basso con il bordo sottile, la tesa in alto (vedi slabTexture) */
const FACE: SlabFace = (() => {
  const w = SLAB.w - 2 * B, d = SLAB.d - 2 * B
  const ring = 0.013, rim = 0.003
  const cy = -d / 2 + 0.05 + SCREEN.h / 2
  const brow = (cy + SCREEN.h / 2 + ring + rim + d / 2) / 2
  return {
    w, d,
    screen: { cy, w: SCREEN.w, h: SCREEN.h, r: 0.014, ring, rim },
    brow: { cy: brow, led: -w / 2 + 0.055, pills: [w / 2 - 0.2, w / 2 - 0.075], pillLen: 0.074, pillR: 0.013, pillCy: brow + 0.014, labelCy: brow - 0.026 },
  }
})()

/** il piedino: dove si attacca sotto la lastra (dal bordo davanti), quanto e' lungo, quanto e' aperto */
const STAND = (() => {
  const at = SLAB.d - 0.1
  const c = Math.cos(TILT), s = Math.sin(TILT)
  // il piede tocca il banco un poco dietro l'attacco; dal perno (il bordo davanti, sul banco)
  // al riferimento della lastra inclinata
  const fz = -at * c - 0.05
  const vy = fz * s, vz = fz * c + at
  return { at, len: Math.hypot(vy, vz), open: Math.atan2(-vz, -vy) }
})()

const damp = THREE.MathUtils.damp
const EPS = 0.0005
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0]

/** la base della console sul banco, per la bilia (Marble3D) */
export function consoleBase(mobile: boolean) {
  const h = mobile ? CONSOLE_HOME.mobile : CONSOLE_HOME.desktop
  return { x: h.x, z: h.z, ry: h.ry, hx: SLAB.w / 2 * h.s, hz: SLAB.d * Math.cos(TILT) / 2 * h.s }
}

/** il centro della faccia sul banco, dove atterra la bilia: quanto e' alto e quanto e' avanti */
export function consoleTop(mobile: boolean) {
  const s = (mobile ? CONSOLE_HOME.mobile : CONSOLE_HOME.desktop).s
  return { y: (SLAB.t * Math.cos(TILT) + SLAB.d / 2 * Math.sin(TILT)) * s, fwd: SLAB.t * Math.sin(TILT) * s }
}

/** Rettangolo arrotondato */
function roundedRect(w: number, d: number, r: number) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2 + r, -d / 2)
  s.lineTo(w / 2 - r, -d / 2); s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r)
  s.lineTo(w / 2, d / 2 - r); s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2)
  s.lineTo(-w / 2 + r, d / 2); s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r)
  s.lineTo(-w / 2, -d / 2 + r); s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2)
  return s
}

/** Rettangolo arrotondato piatto, con la texture stesa da un angolo all'altro */
function roundedPlane(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 8)
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5)
  return g
}

/** Pillola (rettangolo con le estremita' tonde) */
function pillShape(len: number, r: number) {
  const s = new THREE.Shape()
  s.absarc(-len / 2, 0, r, Math.PI / 2, Math.PI * 1.5, false)
  s.absarc(len / 2, 0, r, -Math.PI / 2, Math.PI / 2, false)
  s.closePath()
  return s
}

export function Console3D({ phase, mobile, grab, hovered, game, logo, plasticRough, onPointer, onClick }: {
  phase: TablePhase; mobile: boolean; grab: boolean; hovered: boolean
  logo: HTMLImageElement | null; plasticRough: THREE.Texture
  game: { title: string; close: string; screen: string; loading: string }
  onPointer: (h: boolean) => void; onClick: () => void
}) {
  const group = useRef<THREE.Group>(null!)
  const tilt = useRef<THREE.Group>(null!)
  const stand = useRef<THREE.Group>(null!)
  const screen = useRef<THREE.Mesh>(null!)
  const halo = useRef<THREE.Mesh>(null!)
  const power = useRef(0)
  const lit = useRef<boolean | null>(null)
  const invalidate = useThree((s) => s.invalidate)

  const geo = useMemo(() => {
    // la lastra: i due tappi (sopra la faccia, sotto) e i fianchi smussati
    const slab = new THREE.ExtrudeGeometry(roundedRect(SLAB.w - 2 * B, SLAB.d - 2 * B, SLAB.r - B), {
      depth: SLAB.t - 2 * B, bevelEnabled: true, bevelThickness: B, bevelSize: B, bevelSegments: 4, curveSegments: 16,
    })
    slab.rotateX(-Math.PI / 2).translate(0, B, 0)
    const { pillLen, pillR } = FACE.brow
    return {
      slab,
      screen: roundedPlane(SCREEN.w, SCREEN.h, FACE.screen.r),
      glass: roundedPlane(SCREEN.w + 0.006, SCREEN.h + 0.006, FACE.screen.r + 0.003),
      pill: new THREE.ExtrudeGeometry(pillShape(pillLen - 2 * pillR, pillR), {
        depth: 0.006, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.003, bevelSegments: 4, curveSegments: 12,
      }).rotateX(-Math.PI / 2),
      led: new THREE.SphereGeometry(0.012, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1),
      halo: new THREE.PlaneGeometry(0.075, 0.075).rotateX(-Math.PI / 2),
      stand: new THREE.BoxGeometry(0.34, STAND.len, 0.012).translate(0, -STAND.len / 2, 0),
    }
  }, [])

  // la grana satinata: le coordinate della faccia sono in unita' del mondo, la si ripete
  const rough = useMemo(() => {
    const t = plasticRough.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2.5, 2.5)
    t.needsUpdate = true
    return t
  }, [plasticRough])

  const tex = useMemo(() => {
    // la tela copre la faccia, centrata: le sue coordinate sono in unita' del mondo
    const face = slabTexture(game.title, ['Schermo', game.close], FACE)
    face.repeat.set(1 / FACE.w, 1 / FACE.d); face.offset.set(0.5, 0.5)
    return { face, halo: haloTexture() }
  }, [game.title, game.close])

  const mats = useMemo(() => ({
    // la plastica rosa satinata e opaca, la stessa della cornice del gioco (un filo meno esposta:
    // sotto la lampada del banco il rosa chiaro andava verso il bianco)
    face: new THREE.MeshPhysicalMaterial({ map: tex.face, color: '#dcdcdc', roughness: 0.48, roughnessMap: rough, clearcoat: 0.3, clearcoatRoughness: 0.35 }),
    side: new THREE.MeshPhysicalMaterial({ color: '#cf8aa2', roughness: 0.48, roughnessMap: rough, clearcoat: 0.3, clearcoatRoughness: 0.35 }),
    stand: new THREE.MeshStandardMaterial({ color: '#d697ab', roughness: 0.6 }),
    // le pillole di gomma, come SELECT e START
    pills: new THREE.MeshPhysicalMaterial({ color: '#3a3440', roughness: 0.62, sheen: 0.4, sheenRoughness: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#ffffff', transparent: true, opacity: 0.05, roughness: 0.04, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.5, depthWrite: false,
    }),
    led: new THREE.MeshStandardMaterial({ color: '#8a3a48', roughness: 0.3, emissive: '#ff4d5e', emissiveIntensity: 0 }),
    halo: new THREE.MeshBasicMaterial({ map: tex.halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
  }), [tex, rough])

  // lo schermo si accende con il logo Artismi, poi la schermata di lancio
  const lcd = useMemo(() => screenTexture(game.screen, logo, game.loading, () => invalidate()), [game.screen, logo, game.loading, invalidate])
  // l'ultimo stato del caricamento disegnato sullo schermo: si ridisegna solo se cambia
  const shownLoad = useRef({ p: -1, ready: false })
  const boot = useRef(0)
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ map: lcd.tex, toneMapped: false }), [lcd])
  // si riaccende quando entra in scena e ogni volta che lo si prende in mano
  useEffect(() => { boot.current = 0; invalidate() }, [grab, invalidate])
  // il caricamento del gioco va avanti anche col 3D fermo: lo schermo lo segue
  useEffect(() => {
    gameLoad.onChange = invalidate
    return () => { gameLoad.onChange = null }
  }, [invalidate])

  useEffect(() => () => {
    Object.values(geo).forEach((g) => g.dispose())
    Object.values(tex).forEach((t) => t.dispose())
    Object.values(mats).forEach((m) => m.dispose())
    rough.dispose(); lcd.tex.dispose(); screenMat.dispose()
  }, [geo, tex, mats, rough, lcd, screenMat])

  useEffect(() => { invalidate() }, [phase, hovered, grab, mobile, invalidate])

  const home = mobile ? CONSOLE_HOME.mobile : CONSOLE_HOME.desktop
  const k = useMemo(() => ({
    q: new THREE.Quaternion(),
    // in mano la faccia, che sul banco guarda in alto, si gira verso la camera con la tesa in alto
    up: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
    pq: new THREE.Quaternion(), fwd: new THREE.Vector3(), want: new THREE.Vector3(), at: new THREE.Vector3(),
    corner: new THREE.Vector3(),
  }), [])

  useFrame((state, dt) => {
    const away = !mobile && phase !== 'closed' && phase !== 'returning' && phase !== 'list'
    const restful = phase === 'closed' || phase === 'list'
    let tx = away ? 6.5 : home.x, ty = 0, tz = away ? 0.8 : home.z
    let rx = 0, ry = home.ry, sc = home.s
    if (grab) {
      // presa in mano: la console viene davanti alla camera, con lo schermo dritto verso chi guarda,
      // alto poco piu' di meta' dell'inquadratura e senza uscire dai lati (da telefono decide la larghezza)
      const cam = state.camera as THREE.PerspectiveCamera
      const g = group.current
      const s = mobile ? 0.85 : 0.95
      const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))
      const d = Math.max((SCREEN.h * s) / (0.58 * 2 * tan), (SCREEN.w * s) / (0.88 * 2 * tan * cam.aspect))
      cam.getWorldDirection(k.fwd)
      k.want.copy(cam.position).addScaledVector(k.fwd, d)
      // dove sta adesso lo schermo, rispetto al centro della console: la si sposta di quella differenza
      screen.current.getWorldPosition(k.at)
      g.parent!.worldToLocal(k.want); g.parent!.worldToLocal(k.at)
      tx = g.position.x + (k.want.x - k.at.x); ty = g.position.y + (k.want.y - k.at.y); tz = g.position.z + (k.want.z - k.at.z)
      g.parent!.getWorldQuaternion(k.pq)
      k.q.copy(k.pq).invert().multiply(cam.quaternion).multiply(k.up)
      sc = s
    } else if (restful && hovered) {
      ty = 0.12; rx = -0.05
    }

    let moving = false
    const step = (cur: number, to: number, k: number) => {
      const v = damp(cur, to, k, dt)
      if (Math.abs(v - to) > EPS) moving = true
      return v
    }
    const g = group.current
    g.position.x = step(g.position.x, tx, 6)
    g.position.y = step(g.position.y, ty, 7)
    g.position.z = step(g.position.z, tz, 6)
    if (grab) {
      g.quaternion.slerp(k.q, 1 - Math.exp(-6 * dt))
      if (g.quaternion.angleTo(k.q) > 0.001) moving = true
    } else {
      g.rotation.x = step(g.rotation.x, rx, 6)
      g.rotation.y = step(g.rotation.y, ry, 6)
      g.rotation.z = step(g.rotation.z, 0, 6)
    }
    g.scale.setScalar(step(g.scale.x, sc, 6))
    // sul banco sta inclinata sul piedino; in mano si raddrizza e il piedino si richiude
    const a = step(tilt.current.rotation.x, grab ? 0 : TILT, 6)
    tilt.current.rotation.x = a
    tilt.current.position.z = SLAB.d / 2 * Math.cos(a)
    stand.current.rotation.x = step(stand.current.rotation.x, grab ? -Math.PI / 2 : STAND.open, 6)

    // accensione: logo Artismi, poi la schermata di lancio
    if (boot.current < BOOT_SECONDS) {
      boot.current = Math.min(BOOT_SECONDS, boot.current + Math.min(dt, 0.05))
      lcd.draw(boot.current, gameLoad)
      moving = true
    } else {
      // il gioco si carica in sottofondo: lo schermo segue, un punto percentuale alla volta
      const p = Math.floor(gameLoad.p * 100)
      if (p !== shownLoad.current.p || gameLoad.ready !== shownLoad.current.ready) {
        shownLoad.current = { p, ready: gameLoad.ready }
        lcd.draw(BOOT_SECONDS, gameLoad)
        moving = true
      }
    }
    // lo schermo sta sempre acceso; piu' luminoso del resto (la post-produzione lo smorza)
    power.current = step(power.current, grab ? 1.5 : hovered ? 1.4 : 1.3, 6)
    screenMat.color.setScalar(power.current)
    // la lucina si accende quando il gioco e' pronto, come nella cornice del gioco
    if (lit.current !== gameLoad.ready) {
      lit.current = gameLoad.ready
      mats.led.color.set(lit.current ? '#ff4d5e' : '#8a3a48')
      mats.led.emissiveIntensity = lit.current ? 1.4 : 0
      halo.current.visible = lit.current
      moving = true
    }
    if (moving) invalidate()

    // il rettangolo dello schermo sulla pagina (per il gioco che nasce da li')
    const sz = state.size
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      k.corner.set(cx * SCREEN.w / 2, cy * SCREEN.h / 2, 0)
      screen.current.localToWorld(k.corner).project(state.camera)
      const px = (k.corner.x + 1) / 2 * sz.width, py = (1 - k.corner.y) / 2 * sz.height
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py)
    }
    consoleScreen.rect = { left: x0, top: y0, width: x1 - x0, height: y1 - y0 }
  })

  const over = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onPointer(true) }
  const out = () => onPointer(false)
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick() }
  const top = SLAB.t

  return (
    <group ref={group} position={[home.x, 0, home.z]} rotation={[0, home.ry, 0]} scale={home.s}>
      {/* inclinata sul piedino: il perno e' il bordo davanti, appoggiato sul banco */}
      <group ref={tilt} position={[0, 0, SLAB.d / 2 * Math.cos(TILT)]} rotation={[TILT, 0, 0]}>
        <group position={[0, 0, -SLAB.d / 2]}>
          {/* per il mouse: la lastra e un po' d'aria sopra */}
          <mesh position={[0, 0.08, 0]} material={HIT_MAT} onPointerOver={over} onPointerOut={out} onClick={click}>
            <boxGeometry args={[SLAB.w + 0.06, 0.2, SLAB.d + 0.06]} />
          </mesh>
          <mesh geometry={geo.slab} material={[mats.face, mats.side]} castShadow receiveShadow />

          {/* lo schermo nella finestra, il vetro sopra */}
          <mesh ref={screen} geometry={geo.screen} position={[0, top + 0.0008, -FACE.screen.cy]} rotation={FLAT} material={screenMat} />
          <mesh geometry={geo.glass} position={[0, top + 0.0016, -FACE.screen.cy]} rotation={FLAT} material={mats.glass} />

          {/* la tesa: la lucina col suo alone, le pillole di gomma */}
          <mesh geometry={geo.led} position={[FACE.brow.led, top, -FACE.brow.cy]} material={mats.led} />
          <mesh ref={halo} geometry={geo.halo} position={[FACE.brow.led, top + 0.008, -FACE.brow.cy]} material={mats.halo} visible={false} />
          {FACE.brow.pills.map((x) => (
            <mesh key={x} geometry={geo.pill} position={[x, top - 0.003, -FACE.brow.pillCy]} material={mats.pills} castShadow />
          ))}
        </group>

        {/* il piedino, sotto la lastra verso il bordo dietro */}
        <group ref={stand} position={[0, 0, -STAND.at]} rotation={[STAND.open, 0, 0]}>
          <mesh geometry={geo.stand} material={mats.stand} castShadow />
        </group>
      </group>

      <Html position={[0, 0.45, 0]} center zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
        <span className={styles.label} data-show={hovered && !grab && phase === 'closed' ? 'true' : undefined}>{game.title}</span>
      </Html>
    </group>
  )
}
