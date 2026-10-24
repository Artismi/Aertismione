'use client'

/**
 * La console di Porto Vecchio: un Game Boy pieghevole in plastica rosa
 * trasparente e lucida, con l'elettronica che si vede attraverso. E' la stessa
 * del gioco a tutto schermo (GameBoy, GameBoyPad), vista sul banco.
 * Base, come la pulsantiera: il nome, i tre tasti di gomma con l'icona e la
 * lucina (la bomboletta, la bici, lo zaino col numero delle cose da fare), la
 * levetta nel suo incavo, la croce nera, A e B corallo sulla piastra inclinata,
 * l'altoparlante. Coperchio: la cornice rosa dello schermo con BATTERY e la
 * lucina; sopra, la tesa con il display, la pillola SCHERMO e l'interruttore. Cerniera a tre cilindri.
 *
 * Il display e le lucine dei tasti dicono quello che dice il gioco quando e'
 * caricato (gameInfo); prima il display segna --:--.
 *
 * La plastica e' un velo rosa trasparente sopra l'elettronica (glass); nella fascia
 * di qualita' piu' bassa la scheda e' stampata sotto il velo rosa, come nel Game Boy
 * a tutto schermo.
 *
 * Presa in mano viene verso chi guarda, il coperchio si alza e lo schermo si
 * accende; da li' PortfolioSection allarga il gioco a tutto schermo.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox, Html } from '@react-three/drei'
import * as THREE from 'three'
import { pcbTexture, faceTexture, bezelTexture, stripTexture, lcdTexture, keyIconTexture, badgeTexture, haloTexture, screenTexture, BOOT_SECONDS, type PadLayout } from './textures'
import { gameLoad, gameInfo } from './gameLoad'
import type { TablePhase } from './Table3D'
import { HIT_MAT } from './Folder3D'
import styles from './Table3D.module.css'
import { consoleScreen } from './shared'
import { PROGETTI } from '@/config/content'

const CW = 1.0, CD = 0.98, BH = 0.115, LH = 0.1, CR = 0.05
const HINGE_Z = -CD / 2 + 0.04
const LID_D = CD - 0.04
const SCREEN = { w: 0.6, h: 0.4 }
/** la cornice dello schermo sul coperchio, dalla cerniera: un po' sotto la meta', sopra ci sta la tesa */
const BEZEL_Z = 0.43
/** la tesa del coperchio: la sua riga di mezzo, le misure, e dove stanno display, pillola, interruttore */
const STRIP = { z: 0.855, w: 0.92, d: 0.16, lcd: -0.02, pill: 0.2, sw: 0.37 }
/** la base, come la pulsantiera (le scritte le stampa faceTexture negli stessi posti) */
const PAD: PadLayout = {
  w: 0.96, d: 0.94, brand: -0.335,
  keys: { x: [-0.17, 0, 0.17], z: -0.16, r: 0.05, lamp: -0.232, label: -0.082 },
  stick: { x: -0.3, z: 0.2, r: 0.14, label: 0.385 },
  cross: { x: 0, z: 0.25, r: 0.115, label: 0.405 },
  b: { x: 0.228, z: 0.245 }, a: { x: 0.373, z: 0.15 }, abLabel: 0.082,
}
/** la piastra di A e B sale verso A */
const AB_TILT = Math.atan2(PAD.b.z - PAD.a.z, PAD.a.x - PAD.b.x)
const KEYS = ['bomboletta', 'bici', 'zaino'] as const
const damp = THREE.MathUtils.damp

/** dove sta sul banco: posto, rotazione, scala */
const CONSOLE_HOME = {
  desktop: { x: 2.15, z: 0.4, ry: -0.4, s: 1.25 },
  mobile: { x: 0.3, z: 1.75, ry: -0.3, s: 1.1 },
}

/** la base della console sul banco, per la bilia (Marble3D) */
export function consoleBase(mobile: boolean) {
  const h = mobile ? CONSOLE_HOME.mobile : CONSOLE_HOME.desktop
  return { x: h.x, z: h.z, ry: h.ry, hx: CW / 2 * h.s, hz: CD / 2 * h.s }
}

/** sopra la base, davanti al coperchio, dove atterra la bilia: quanto e' alto e quanto e' avanti */
export function consoleTop(mobile: boolean) {
  return { y: BH * (mobile ? CONSOLE_HOME.mobile : CONSOLE_HOME.desktop).s, fwd: 0.18 }
}

// coperchio aperto in mano: di quanto girare la console perche' lo schermo guardi dritto la camera
const GRAB_LID = -2.05
const GRAB_TILT = Math.atan2(-Math.cos(GRAB_LID), -Math.sin(GRAB_LID))
const EPS = 0.0005
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0]
const UNDER: [number, number, number] = [Math.PI / 2, 0, 0] // faccia interna del coperchio

/** Rettangolo arrotondato, per disegnare la giuntura dei gusci */
function roundedRect(w: number, d: number, r: number) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2 + r, -d / 2)
  s.lineTo(w / 2 - r, -d / 2); s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r)
  s.lineTo(w / 2, d / 2 - r); s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2)
  s.lineTo(-w / 2 + r, d / 2); s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r)
  s.lineTo(-w / 2, -d / 2 + r); s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2)
  return s
}

/** Rettangolo arrotondato piatto; la texture copre uw × uh (di piu' se la tela e' piu' grande della forma) */
function roundedPlane(w: number, h: number, r: number, uw = w, uh = h) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 8)
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / uw + 0.5, p.getY(i) / uh + 0.5)
  return g
}

/** La giuntura: un anello sottile appena fuori dal guscio, tutt'attorno */
function seamGeometry(w: number, d: number) {
  const outer = roundedRect(w + 0.004, d + 0.004, CR + 0.002)
  outer.holes.push(roundedRect(w - 0.02, d - 0.02, CR - 0.01))
  const g = new THREE.ExtrudeGeometry(outer, { depth: 0.004, bevelEnabled: false, curveSegments: 12 })
  g.rotateX(-Math.PI / 2)
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

/** Cornice dello schermo: rettangolo arrotondato con la finestra, e spessore */
function bezelGeometry() {
  const frame = roundedRect(0.86, 0.66, 0.05)
  const hole = new THREE.Path()
  const w = 0.64, h = 0.44, r = 0.018, cy = 0.05
  hole.moveTo(-w / 2 + r, cy - h / 2)
  hole.lineTo(w / 2 - r, cy - h / 2); hole.quadraticCurveTo(w / 2, cy - h / 2, w / 2, cy - h / 2 + r)
  hole.lineTo(w / 2, cy + h / 2 - r); hole.quadraticCurveTo(w / 2, cy + h / 2, w / 2 - r, cy + h / 2)
  hole.lineTo(-w / 2 + r, cy + h / 2); hole.quadraticCurveTo(-w / 2, cy + h / 2, -w / 2, cy + h / 2 - r)
  hole.lineTo(-w / 2, cy - h / 2 + r); hole.quadraticCurveTo(-w / 2, cy - h / 2, -w / 2 + r, cy - h / 2)
  frame.holes.push(hole)
  return new THREE.ExtrudeGeometry(frame, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 10 })
}

/** Croce direzionale con i bracci arrotondati */
function crossGeometry() {
  const a = 0.1, b = 0.032
  const s = new THREE.Shape()
  const pts: [number, number][] = [
    [-b, a], [b, a], [b, b], [a, b], [a, -b], [b, -b], [b, -a], [-b, -a], [-b, -b], [-a, -b], [-a, b], [-b, b],
  ]
  s.moveTo(pts[0][0], pts[0][1])
  pts.slice(1).forEach(([x, y]) => s.lineTo(x, y))
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.009, bevelSize: 0.008, bevelSegments: 6 })
  g.rotateX(-Math.PI / 2)
  return g
}

/** Calotta per i tasti A/B e per i tre tasti di gomma */
function domeGeometry(r: number, h: number) {
  // calotta su un collarino: il tasto esce dal suo foro
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, h + 0.014)]
  for (let i = 1; i <= 16; i++) {
    const a = (i / 16) * Math.PI / 2
    pts.push(new THREE.Vector2(Math.sin(a) * r, 0.014 + Math.cos(a) * h))
  }
  pts.push(new THREE.Vector2(r, 0), new THREE.Vector2(r - 0.004, -0.002))
  // il tornio vuole il profilo dal basso verso l'alto, se no le facce guardano dentro
  return new THREE.LatheGeometry(pts.reverse(), 48)
}

/** Il cappuccio della levetta: gomma con il bordo tondo e la conca dove va il pollice */
function stickCapGeometry() {
  const pts = [[0.07, 0], [0.078, 0.004], [0.08, 0.02], [0.079, 0.03], [0.074, 0.036], [0.06, 0.034], [0.03, 0.03], [0, 0.029]]
    .map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(pts, 48)
}

export function Console3D({ phase, mobile, grab, hovered, glass, game, logo, plasticRough, metalRough, onPointer, onClick }: {
  phase: TablePhase; mobile: boolean; grab: boolean; hovered: boolean
  /** la plastica trasparente davvero (fascia di qualita' alta); se no la scheda e' stampata */
  glass: boolean
  logo: HTMLImageElement | null; plasticRough: THREE.Texture; metalRough: THREE.Texture
  game: { title: string; hint: string; screen: string; loading: string }
  onPointer: (h: boolean) => void; onClick: () => void
}) {
  const pad = PROGETTI.game.pad
  const group = useRef<THREE.Group>(null!)
  const lid = useRef<THREE.Group>(null!)
  const ledHalo = useRef<THREE.Mesh>(null!)
  const lamps = useRef<(THREE.Mesh | null)[]>([])
  const halos = useRef<(THREE.Mesh | null)[]>([])
  const badge = useRef<THREE.Mesh>(null!)
  const power = useRef(0)
  const invalidate = useThree((s) => s.invalidate)

  const geo = useMemo(() => {
    const speaker = new THREE.CylinderGeometry(0.009, 0.009, 0.003, 12)
    return {
      cross: crossGeometry(),
      dome: domeGeometry(0.056, 0.028),
      key: domeGeometry(PAD.keys.r, 0.012),
      cap: stickCapGeometry(),
      plate: new THREE.ShapeGeometry(pillShape(0.19, 0.08), 24).rotateX(-Math.PI / 2),
      // i fori: anelli scuri attorno ai tasti, si legge la fessura
      holeAB: new THREE.RingGeometry(0.056, 0.066, 48).rotateX(-Math.PI / 2),
      holeKey: new THREE.RingGeometry(PAD.keys.r + 0.002, PAD.keys.r + 0.011, 48).rotateX(-Math.PI / 2),
      holeCap: new THREE.RingGeometry(0.082, 0.092, 48).rotateX(-Math.PI / 2),
      rubberPill: new THREE.ExtrudeGeometry(pillShape(0.064, 0.016), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 4 }).rotateX(-Math.PI / 2),
      bezel: bezelGeometry(),
      dimple: new THREE.CircleGeometry(0.016, 32).rotateX(-Math.PI / 2),
      ring: new THREE.RingGeometry(0.125, 0.14, 64).rotateX(-Math.PI / 2),
      disc: new THREE.CircleGeometry(0.125, 64).rotateX(-Math.PI / 2),
      stickRing: new THREE.RingGeometry(PAD.stick.r, PAD.stick.r + 0.012, 64).rotateX(-Math.PI / 2),
      stickDisc: new THREE.CircleGeometry(PAD.stick.r, 64).rotateX(-Math.PI / 2),
      lamp: new THREE.SphereGeometry(0.009, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      icon: new THREE.PlaneGeometry(0.052, 0.052).rotateX(-Math.PI / 2),
      halo: new THREE.PlaneGeometry(0.06, 0.06).rotateX(-Math.PI / 2),
      // solo la parte piana della base: sul bordo tondo una faccia piatta resterebbe sollevata
      face: roundedPlane(CW - 2 * CR, CD - 2 * CR, 0.02, PAD.w, PAD.d),
      speaker,
      seamBase: seamGeometry(CW, CD),
      seamLid: seamGeometry(CW, LID_D),
    }
  }, [])

  const tex = useMemo(() => {
    // la cornice e' una forma estrusa: la texture va stesa sulle sue coordinate
    const bezel = bezelTexture(game.title, pad.battery, pad.lens)
    bezel.repeat.set(1 / 0.86, 1 / 0.66); bezel.offset.set(0.5, 0.5)
    return {
      // con la plastica trasparente si vede la scheda vera; se no la si stampa sotto il velo rosa
      face: faceTexture(game.title, { stick: pad.stick, cross: pad.cross, spray: pad.spray, bike: pad.bike, bag: pad.bag, brand: pad.brand }, PAD, !glass),
      bezel,
      strip: stripTexture(STRIP, pad, 'Schermo'),
      icons: KEYS.map((k) => keyIconTexture(k)),
      green: haloTexture(91, 227, 138),
      red: haloTexture(255, 77, 94),
      ...(glass ? { pcb: pcbTexture() } : {}),
    }
  }, [game.title, pad, glass])

  // il display e il numero sullo zaino si ridisegnano quando il gioco dice qualcosa
  const lcd = useMemo(() => lcdTexture(), [])
  const badgeTex = useMemo(() => badgeTexture(), [])

  const mats = useMemo(() => {
    const plastic = glass
      // plastica rosa trasparente e lucida: si vede l'elettronica attraverso. Un velo rosa sopra
      // la scheda, come nel Game Boy a tutto schermo: niente trasmissione vera, che ridisegnava
      // tutta la scena dietro la console a ogni fotogramma e faceva scattare lo scroll
      ? new THREE.MeshPhysicalMaterial({
        color: '#e07f9c', transparent: true, opacity: 0.3, depthWrite: false,
        roughness: 0.22, roughnessMap: plasticRough, clearcoat: 0.4, clearcoatRoughness: 0.2,
      })
      // la stessa plastica, piena e lucida: dentro non si vede, la scheda e' stampata sulla faccia
      : new THREE.MeshPhysicalMaterial({ color: '#e3a1b6', roughness: 0.26, roughnessMap: plasticRough, clearcoat: 1, clearcoatRoughness: 0.14 })
    return {
      shell: plastic,
      // la faccia della base: le scritte sopra la plastica trasparente, o la plastica stampata con la scheda sotto
      face: glass
        ? new THREE.MeshBasicMaterial({ map: tex.face, transparent: true, depthWrite: false })
        : new THREE.MeshPhysicalMaterial({ map: tex.face, roughness: 0.22, roughnessMap: plasticRough, clearcoat: 1, clearcoatRoughness: 0.12 }),
      // la giuntura tra i due gusci, una riga scura tutt'attorno
      seam: new THREE.MeshStandardMaterial({ color: '#b07c8c', roughness: 0.6, transparent: true, opacity: 0.7 }),
      // incavi e piastre: plastica un po' piu' scura e satinata, non un adesivo chiaro
      recess: new THREE.MeshPhysicalMaterial({ color: '#d98ea4', roughness: 0.55, transparent: true, opacity: 0.35, depthWrite: false }),
      cross: new THREE.MeshPhysicalMaterial({ color: '#16141a', roughness: 0.42, clearcoat: 0.4 }),
      ab: new THREE.MeshPhysicalMaterial({ color: '#E2475E', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, specularIntensity: 0.8 }),
      // la gomma scura dei tasti, della levetta e della pillola
      rubber: new THREE.MeshPhysicalMaterial({ color: '#3a353f', roughness: 0.75, sheen: 0.4, sheenRoughness: 0.8 }),
      icon: KEYS.map((_, i) => new THREE.MeshStandardMaterial({ map: tex.icons[i], transparent: true, depthWrite: false, roughness: 0.6 })),
      hole: new THREE.MeshStandardMaterial({ color: '#24161c', roughness: 0.9 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: '#ffffff', transparent: true, opacity: 0.05, roughness: 0.04, metalness: 0,
        clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.5, depthWrite: false,
      }),
      pcb: new THREE.MeshStandardMaterial({ map: tex.pcb ?? null, roughness: 0.5, metalness: 0.25 }),
      chip: new THREE.MeshStandardMaterial({ color: '#141218', roughness: 0.45, metalness: 0.2 }),
      metal: new THREE.MeshStandardMaterial({ color: '#c9c4bb', roughnessMap: metalRough, roughness: 0.55, metalness: 1 }),
      battery: new THREE.MeshStandardMaterial({ color: '#9a94a0', roughness: 0.35, metalness: 0.7 }),
      switch: new THREE.MeshPhysicalMaterial({ color: '#D93A4A', roughness: 0.4, clearcoat: 0.4 }),
      bezel: new THREE.MeshPhysicalMaterial({ map: tex.bezel, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
      strip: new THREE.MeshBasicMaterial({ map: tex.strip, transparent: true, depthWrite: false }),
      lcd: new THREE.MeshBasicMaterial({ map: lcd.tex, color: new THREE.Color(0.92, 0.92, 0.92) }),
      badge: new THREE.MeshBasicMaterial({ map: badgeTex.tex, transparent: true, depthWrite: false, toneMapped: false }),
      dots: new THREE.MeshStandardMaterial({ color: '#1b1820', roughness: 0.8 }),
      feet: new THREE.MeshStandardMaterial({ color: '#3a2a32', roughness: 0.85 }),
      // le lucine: spente scure, accese verdi (i tasti) o rosse (BATTERY), con l'alone
      lampOff: new THREE.MeshStandardMaterial({ color: '#4a2830', roughness: 0.35 }),
      lampOn: new THREE.MeshStandardMaterial({ color: '#5be38a', emissive: '#5be38a', emissiveIntensity: 1.2, roughness: 0.3 }),
      led: new THREE.MeshStandardMaterial({ color: '#8a3a48', roughness: 0.3, emissive: '#ff4d5e', emissiveIntensity: 0 }),
      haloGreen: new THREE.MeshBasicMaterial({ map: tex.green, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      haloRed: new THREE.MeshBasicMaterial({ map: tex.red, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    }
  }, [tex, glass, plasticRough, metalRough, lcd, badgeTex])

  // lo schermo si accende con il logo Artismi, poi la schermata di lancio
  const screenLcd = useMemo(() => screenTexture(game.screen, logo, game.loading, () => invalidate()), [game.screen, logo, game.loading, invalidate])
  // l'ultimo stato del caricamento disegnato sullo schermo: si ridisegna solo se cambia
  const shownLoad = useRef({ p: -1, ready: false })
  // l'ultima cosa detta dal gioco mostrata sul display e sulle lucine
  const shownInfo = useRef<{ stato: unknown; tasti: unknown; lit: boolean | null }>({ stato: undefined, tasti: undefined, lit: null })
  const boot = useRef(0)
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ map: screenLcd.tex, toneMapped: false }), [screenLcd])
  // si riaccende quando entra in scena e ogni volta che lo si prende in mano
  useEffect(() => { boot.current = 0; invalidate() }, [grab, invalidate])
  // il caricamento del gioco, e quello che il gioco dice, vanno avanti anche col 3D fermo
  useEffect(() => {
    gameLoad.onChange = invalidate
    return () => { gameLoad.onChange = null }
  }, [invalidate])
  // materiali nuovi (cambio di fascia): le lucine e il display si rimettono a posto
  useEffect(() => { shownInfo.current = { stato: undefined, tasti: undefined, lit: null }; invalidate() }, [mats, invalidate])

  useEffect(() => () => {
    Object.values(geo).forEach((g) => g.dispose())
    Object.values(tex).forEach((t) => (Array.isArray(t) ? t.forEach((x) => x.dispose()) : t.dispose()))
    Object.values(mats).forEach((m) => (Array.isArray(m) ? m.forEach((x) => x.dispose()) : m.dispose()))
    screenLcd.tex.dispose(); screenMat.dispose(); lcd.tex.dispose(); badgeTex.tex.dispose()
  }, [geo, tex, mats, screenLcd, screenMat, lcd, badgeTex])

  useEffect(() => { invalidate() }, [phase, hovered, grab, mobile, invalidate])

  const home = mobile ? CONSOLE_HOME.mobile : CONSOLE_HOME.desktop
  const screen = useRef<THREE.Mesh>(null!)
  const k = useMemo(() => ({
    q: new THREE.Quaternion(), tilt: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), GRAB_TILT),
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
      k.q.copy(k.pq).invert().multiply(cam.quaternion).multiply(k.tilt)
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
    // sul banco sta aperta (si vedono tasti e schermo spento); in mano si apre del tutto
    lid.current.rotation.x = step(lid.current.rotation.x, grab ? GRAB_LID : away ? 0 : -1.8, 5)
    // accensione: logo Artismi, poi la schermata di lancio
    if (boot.current < BOOT_SECONDS) {
      boot.current = Math.min(BOOT_SECONDS, boot.current + Math.min(dt, 0.05))
      screenLcd.draw(boot.current, gameLoad)
      moving = true
    } else {
      // il gioco si carica: lo schermo segue, un punto percentuale alla volta
      const p = Math.floor(gameLoad.p * 100)
      if (p !== shownLoad.current.p || gameLoad.ready !== shownLoad.current.ready) {
        shownLoad.current = { p, ready: gameLoad.ready }
        screenLcd.draw(BOOT_SECONDS, gameLoad)
        moving = true
      }
    }
    // lo schermo sta sempre acceso; piu' luminoso del resto (la post-produzione lo smorza)
    power.current = step(power.current, grab ? 1.5 : hovered ? 1.4 : 1.3, 6)
    screenMat.color.setScalar(power.current)

    // quello che dice il gioco: il display, le lucine dei tasti, il numero sullo zaino;
    // la lucina di BATTERY si accende quando il gioco e' pronto, come nel Game Boy a tutto schermo
    const seen = shownInfo.current
    if (gameInfo.stato !== seen.stato) {
      seen.stato = gameInfo.stato
      lcd.draw(gameInfo.stato)
      moving = true
    }
    if (gameInfo.tasti !== seen.tasti) {
      seen.tasti = gameInfo.tasti
      const on = gameInfo.tasti?.on ?? {}, n = gameInfo.tasti?.n ?? 0
      KEYS.forEach((key, i) => {
        const lamp = lamps.current[i], halo = halos.current[i]
        if (lamp) lamp.material = on[key] ? mats.lampOn : mats.lampOff
        if (halo) halo.visible = !!on[key]
      })
      if (n > 0) badgeTex.draw(n)
      badge.current.visible = n > 0
      moving = true
    }
    if (gameLoad.ready !== seen.lit) {
      seen.lit = gameLoad.ready
      mats.led.color.set(seen.lit ? '#ff4d5e' : '#8a3a48')
      mats.led.emissiveIntensity = seen.lit ? 1.4 : 0
      ledHalo.current.visible = seen.lit
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
  const top = BH
  const midAB = { x: (PAD.a.x + PAD.b.x) / 2, z: (PAD.a.z + PAD.b.z) / 2 }

  return (
    <group ref={group} position={[home.x, 0, home.z]} rotation={[0, home.ry, 0]} scale={home.s}>
      {/* per il mouse: la base e il coperchio alzato, in una scatola sola */}
      <mesh position={[0, 0.45, 0]} material={HIT_MAT} onPointerOver={over} onPointerOut={out} onClick={click}>
        <boxGeometry args={[CW + 0.06, 0.9, CD + 0.06]} />
      </mesh>
      <group>
        {/* ── Base ── */}
        <RoundedBox args={[CW, BH, CD]} radius={CR} smoothness={6} position={[0, BH / 2, 0]} material={mats.shell} renderOrder={-1} castShadow receiveShadow />
        <mesh geometry={geo.seamBase} position={[0, BH * 0.45, 0]} material={mats.seam} />

        {/* dentro: scheda, chip, batteria, connettore, viti (si vedono solo con la plastica trasparente) */}
        {glass && (
          <>
            <mesh position={[0, 0.03, 0.02]} rotation={FLAT} material={mats.pcb}>
              <planeGeometry args={[CW * 0.86, CD * 0.82]} />
            </mesh>
            <mesh position={[0.1, 0.044, -0.1]} material={mats.chip}><boxGeometry args={[0.16, 0.02, 0.16]} /></mesh>
            <mesh position={[-0.2, 0.042, -0.18]} material={mats.chip}><boxGeometry args={[0.1, 0.016, 0.08]} /></mesh>
            <mesh position={[0, 0.05, 0.28]} material={mats.battery}><boxGeometry args={[0.48, 0.032, 0.18]} /></mesh>
            <mesh position={[0, 0.045, -CD / 2 + 0.1]} material={mats.chip}><boxGeometry args={[0.56, 0.03, 0.05]} /></mesh>
            {[[-0.41, -0.39], [0.41, -0.39], [-0.41, 0.41], [0.41, 0.41]].map(([x, z], i) => (
              <mesh key={i} position={[x, 0.058, z]} material={mats.metal}><cylinderGeometry args={[0.017, 0.017, 0.05, 16]} /></mesh>
            ))}
          </>
        )}

        {/* la faccia: il nome, le scritte della pulsantiera (e, senza trasparenza, la scheda stampata sotto il velo rosa) */}
        <mesh geometry={geo.face} position={[0, top + 0.0012, 0]} rotation={FLAT} material={mats.face} />

        {/* i tre tasti di gomma con l'icona, la lucina sopra; sullo zaino il numero delle cose da fare */}
        {KEYS.map((key, i) => {
          const x = PAD.keys.x[i]
          return (
            <group key={key}>
              <group position={[x, top, PAD.keys.z]}>
                <mesh geometry={geo.holeKey} position={[0, 0.0022, 0]} material={mats.hole} />
                <mesh geometry={geo.key} material={mats.rubber} castShadow receiveShadow />
                <mesh geometry={geo.icon} position={[0, 0.0268, 0]} material={mats.icon[i]} />
              </group>
              <mesh ref={(m) => { lamps.current[i] = m }} geometry={geo.lamp} position={[x, top, PAD.keys.lamp]} material={mats.lampOff} />
              <mesh ref={(m) => { halos.current[i] = m }} geometry={geo.halo} position={[x, top + 0.006, PAD.keys.lamp]} material={mats.haloGreen} visible={false} />
            </group>
          )
        })}
        <mesh ref={badge} position={[PAD.keys.x[2] + 0.045, top + 0.03, PAD.keys.z - 0.045]} rotation={FLAT} material={mats.badge} visible={false}>
          <planeGeometry args={[0.045, 0.045]} />
        </mesh>

        {/* la levetta: il cappuccio di gomma nel suo incavo */}
        <group position={[PAD.stick.x, top, PAD.stick.z]}>
          <mesh geometry={geo.stickDisc} position={[0, 0.0016, 0]} material={mats.recess} />
          <mesh geometry={geo.stickRing} position={[0, 0.002, 0]} material={mats.shell} />
          <mesh geometry={geo.holeCap} position={[0, 0.0024, 0]} material={mats.hole} />
          <mesh geometry={geo.cap} position={[0, 0.002, 0]} material={mats.rubber} castShadow receiveShadow />
        </group>

        {/* croce nera nell'incavo rotondo, con l'incavo al centro */}
        <group position={[PAD.cross.x, top, PAD.cross.z]} scale={PAD.cross.r / 0.125}>
          <mesh geometry={geo.disc} position={[0, 0.0016, 0]} material={mats.recess} />
          <mesh geometry={geo.ring} position={[0, 0.002, 0]} material={mats.shell} />
          <mesh geometry={geo.cross} position={[0, -0.004, 0]} material={mats.cross} castShadow receiveShadow />
          <mesh geometry={geo.dimple} position={[0, 0.0275, 0]} material={mats.hole} />
        </group>

        {/* A e B corallo: escono dai loro fori, sulla piastra inclinata */}
        <mesh geometry={geo.plate} position={[midAB.x, top + 0.0016, midAB.z]} rotation={[0, AB_TILT, 0]} material={mats.recess} />
        {[PAD.b, PAD.a].map((p) => (
          <group key={p.x} position={[p.x, top, p.z]}>
            <mesh geometry={geo.holeAB} position={[0, 0.0022, 0]} material={mats.hole} />
            <mesh geometry={geo.dome} material={mats.ab} castShadow receiveShadow />
          </group>
        ))}

        {/* altoparlante, in alto a destra */}
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} geometry={geo.speaker} position={[0.3 + (i % 4) * 0.032, top + 0.0008, -0.39 + Math.floor(i / 4) * 0.032]} material={mats.dots} />
        ))}

        {/* tasti dorsali */}
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.2, 0.05, 0.05]} radius={0.02} smoothness={4} position={[s * 0.36, BH * 0.62, -CD / 2 - 0.006]} material={mats.recess} castShadow />
        ))}

        {/* cerniera: due cilindri sulla base */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.34, top, HINGE_Z]} rotation={[0, 0, Math.PI / 2]} material={mats.shell} castShadow>
            <cylinderGeometry args={[0.048, 0.048, 0.24, 32]} />
          </mesh>
        ))}

        {/* ── Coperchio ── */}
        <group ref={lid} position={[0, top + 0.004, HINGE_Z]} rotation={[-1.8, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={mats.shell} castShadow>
            <cylinderGeometry args={[0.046, 0.046, 0.42, 32]} />
          </mesh>
          <RoundedBox args={[CW, LH, LID_D]} radius={CR} smoothness={6} position={[0, LH / 2, LID_D / 2]} material={mats.shell} renderOrder={-1} castShadow receiveShadow />
          <mesh geometry={geo.seamLid} position={[0, LH * 0.5, LID_D / 2]} material={mats.seam} />
          {/* scheda dello schermo, dentro il coperchio */}
          {glass && (
            <mesh position={[0, LH * 0.45, LID_D * 0.55]} rotation={UNDER} material={mats.chip}>
              <planeGeometry args={[0.72, 0.5]} />
            </mesh>
          )}
          {/* emblema in rilievo sul coperchio */}
          <mesh position={[0, LH + 0.002, LID_D / 2]} material={mats.recess}>
            <cylinderGeometry args={[0.14, 0.145, 0.006, 64]} />
          </mesh>
          <mesh position={[0, LH + 0.005, LID_D / 2]} rotation={FLAT} material={mats.shell}>
            <torusGeometry args={[0.1, 0.006, 8, 64]} />
          </mesh>
          {/* cornice rosa spessa con BATTERY e la lucina, LCD incassato dentro la finestra, vetro sopra */}
          <mesh geometry={geo.bezel} position={[0, 0, BEZEL_Z]} rotation={UNDER} material={mats.bezel} castShadow receiveShadow />
          <mesh ref={screen} position={[0, -0.002, BEZEL_Z + 0.05]} rotation={UNDER} material={screenMat}>
            <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          </mesh>
          <mesh position={[0, -0.0092, BEZEL_Z + 0.05]} rotation={UNDER} material={mats.glass}>
            <planeGeometry args={[0.66, 0.46]} />
          </mesh>
          <mesh position={[-0.375, -0.01, BEZEL_Z + 0.296]} material={mats.led}><sphereGeometry args={[0.011, 16, 16]} /></mesh>
          <mesh ref={ledHalo} geometry={geo.halo} position={[-0.375, -0.016, BEZEL_Z + 0.296]} rotation={[Math.PI, 0, 0]} material={mats.haloRed} visible={false} />

          {/* la tesa sopra lo schermo: il display, la pillola SCHERMO, l'interruttore */}
          <mesh position={[0, -0.0012, STRIP.z]} rotation={UNDER} material={mats.strip}>
            <planeGeometry args={[STRIP.w, STRIP.d]} />
          </mesh>
          <mesh position={[STRIP.lcd, -0.0018, STRIP.z]} rotation={UNDER} material={mats.lcd}>
            <planeGeometry args={[0.27, 0.0675]} />
          </mesh>
          <group position={[STRIP.pill, 0.006, STRIP.z]} rotation={[Math.PI, 0, 0]}>
            <mesh geometry={geo.rubberPill} material={mats.rubber} castShadow />
          </group>
          <RoundedBox args={[0.03, 0.012, 0.02]} radius={0.004} smoothness={3} position={[STRIP.sw + 0.014, -0.004, STRIP.z]} material={mats.switch} castShadow />
          {/* gommini */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.455, -0.003, LID_D - 0.025]} material={mats.feet}>
              <cylinderGeometry args={[0.017, 0.017, 0.006, 16]} />
            </mesh>
          ))}
        </group>
      </group>

      <Html position={[0, 0.5, 0]} center zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
        <span className={styles.label} data-show={hovered && !grab && phase === 'closed' ? 'true' : undefined}>{game.title}</span>
      </Html>
    </group>
  )
}
