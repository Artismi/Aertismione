'use client'

/**
 * La console di Porto Vecchio: un Game Boy pieghevole in plastica rosa
 * trasparente e satinata, con l'elettronica che si vede attraverso.
 * Base: croce nera nell'incavo rotondo, A/B corallo sulla piastra inclinata,
 * SELECT/START, altoparlante, LED, tasti dorsali, interruttore rosso e rotella
 * in metallo. Coperchio: cornice rosa con lo schermo, gommini, emblema in
 * rilievo. Cerniera a tre cilindri.
 *
 * Presa in mano viene verso chi guarda, il coperchio si alza e lo schermo si
 * accende; da li' PortfolioSection allarga il gioco a tutto schermo.
 */

import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox, Html } from '@react-three/drei'
import * as THREE from 'three'
import { pcbTexture, faceTexture, bezelTexture, screenTexture, BOOT_SECONDS } from './textures'
import type { TablePhase, TableApi } from './Table3D'
import styles from './Table3D.module.css'

const CW = 1.0, CD = 0.98, BH = 0.115, LH = 0.1, CR = 0.05
const HINGE_Z = -CD / 2 + 0.04
const LID_D = CD - 0.04
const SCREEN = { w: 0.6, h: 0.4 }
const damp = THREE.MathUtils.damp
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

/** Calotta per i tasti A/B */
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


export function Console3D({ phase, mobile, grab, hovered, game, logo, plasticRough, metalRough, onPointer, onClick, api }: {
  phase: TablePhase; mobile: boolean; grab: boolean; hovered: boolean
  logo: HTMLImageElement | null; plasticRough: THREE.Texture; metalRough: THREE.Texture
  game: { title: string; hint: string; screen: string }
  onPointer: (h: boolean) => void; onClick: () => void; api: MutableRefObject<TableApi | null>
}) {
  const group = useRef<THREE.Group>(null!)
  const lid = useRef<THREE.Group>(null!)
  const screen = useRef<THREE.Mesh>(null!)
  const power = useRef(0)
  const { camera, gl, invalidate } = useThree()

  const geo = useMemo(() => ({
    cross: crossGeometry(),
    dome: domeGeometry(0.056, 0.028),
    pill: new THREE.ShapeGeometry(pillShape(0.19, 0.08), 24).rotateX(-Math.PI / 2),
    // i fori: anelli scuri attorno ai tasti, si legge la fessura
    holeAB: new THREE.RingGeometry(0.056, 0.066, 48).rotateX(-Math.PI / 2),
    holePill: new THREE.ShapeGeometry(pillShape(0.072, 0.024), 16).rotateX(-Math.PI / 2),
    rubberPill: new THREE.ExtrudeGeometry(pillShape(0.064, 0.016), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 4 }).rotateX(-Math.PI / 2),
    bezel: bezelGeometry(),
    dimple: new THREE.CircleGeometry(0.016, 32).rotateX(-Math.PI / 2),
    ring: new THREE.RingGeometry(0.125, 0.14, 64).rotateX(-Math.PI / 2),
    disc: new THREE.CircleGeometry(0.125, 64).rotateX(-Math.PI / 2),
    seamBase: seamGeometry(CW, CD),
    seamLid: seamGeometry(CW, LID_D),
  }), [])

  const tex = useMemo(() => ({
    pcb: pcbTexture(),
    face: faceTexture(game.title),
    // la cornice e' una forma estrusa: la texture va stesa sulle sue coordinate
    bezel: (() => { const t = bezelTexture(game.title); t.repeat.set(1 / 0.86, 1 / 0.66); t.offset.set(0.5, 0.5); return t })(),
  }), [game.title])

  const mats = useMemo(() => ({
    // plastica rosa trasparente e satinata: niente bagliore, solo luce che passa
    shell: new THREE.MeshPhysicalMaterial({
      color: '#f9dde5', transmission: 0.9, thickness: 0.35, roughness: 0.22, ior: 1.47,
      attenuationColor: new THREE.Color('#ec9fb5'), attenuationDistance: 0.8,
      clearcoat: 0.3, clearcoatRoughness: 0.3, roughnessMap: plasticRough,
    }),
    // la giuntura tra i due gusci, una riga scura tutt'attorno
    seam: new THREE.MeshStandardMaterial({ color: '#b07c8c', roughness: 0.6, transparent: true, opacity: 0.7 }),
    // incavi e piastre: plastica un po' piu' scura e satinata, non un adesivo chiaro
    recess: new THREE.MeshPhysicalMaterial({ color: '#d98ea4', roughness: 0.55, transparent: true, opacity: 0.35, depthWrite: false }),
    cross: new THREE.MeshPhysicalMaterial({ color: '#16141a', roughness: 0.42, clearcoat: 0.4 }),
    ab: new THREE.MeshPhysicalMaterial({ color: '#E2475E', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, specularIntensity: 0.8 }),
    pills: new THREE.MeshPhysicalMaterial({ color: '#3a353f', roughness: 0.75, sheen: 0.4, sheenRoughness: 0.8 }),
    hole: new THREE.MeshStandardMaterial({ color: '#24161c', roughness: 0.9 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#ffffff', transparent: true, opacity: 0.05, roughness: 0.04, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.5, depthWrite: false,
    }),
    pcb: new THREE.MeshStandardMaterial({ map: tex.pcb, roughness: 0.5, metalness: 0.25 }),
    chip: new THREE.MeshStandardMaterial({ color: '#141218', roughness: 0.45, metalness: 0.2 }),
    metal: new THREE.MeshStandardMaterial({ color: '#c9c4bb', roughnessMap: metalRough, roughness: 0.55, metalness: 1 }),
    battery: new THREE.MeshStandardMaterial({ color: '#9a94a0', roughness: 0.35, metalness: 0.7 }),
    switch: new THREE.MeshPhysicalMaterial({ color: '#D93A4A', roughness: 0.4, clearcoat: 0.4 }),
    face: new THREE.MeshBasicMaterial({ map: tex.face, transparent: true, depthWrite: false }),
    bezel: new THREE.MeshPhysicalMaterial({ map: tex.bezel, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
    dots: new THREE.MeshStandardMaterial({ color: '#1b1820', roughness: 0.8 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#3a2a32', roughness: 0.85 }),
    led: new THREE.MeshStandardMaterial({ color: '#5a2a30', roughness: 0.3 }),
  }), [tex, plasticRough, metalRough])

  // lo schermo si accende con il logo Artismi, poi la schermata di lancio
  const lcd = useMemo(() => screenTexture(game.screen, logo, () => invalidate()), [game.screen, logo, invalidate])
  const boot = useRef(0)
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ map: lcd.tex, toneMapped: false }), [lcd])
  // si riaccende quando entra in scena e ogni volta che lo si prende in mano
  useEffect(() => { boot.current = 0; invalidate() }, [grab, invalidate])

  useEffect(() => () => {
    Object.values(geo).forEach((g) => g.dispose())
    Object.values(tex).forEach((t) => t.dispose())
    Object.values(mats).forEach((m) => m.dispose())
    lcd.tex.dispose(); screenMat.dispose()
  }, [geo, tex, mats, screenMat])

  useEffect(() => { invalidate() }, [phase, hovered, grab, mobile, invalidate])

  // Il rettangolo dello schermo sulla pagina: da li' parte il gioco a tutto schermo
  useEffect(() => {
    api.current = {
      screenRect: () => {
        const m = screen.current
        if (!m) return null
        const r = gl.domElement.getBoundingClientRect()
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
        const hw = SCREEN.w / 2, hh = SCREEN.h / 2
        for (const [x, y] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) {
          const v = m.localToWorld(new THREE.Vector3(x, y, 0)).project(camera)
          const px = r.left + (v.x + 1) / 2 * r.width, py = r.top + (1 - v.y) / 2 * r.height
          x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py)
        }
        return { top: y0, left: x0, width: x1 - x0, height: y1 - y0 }
      },
    }
    return () => { api.current = null }
  }, [api, camera, gl])

  const home = mobile ? [0.3, 0, 1.75] : [2.15, 0, 0.4]
  const homeRy = mobile ? -0.3 : -0.4
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const away = !mobile && phase !== 'closed' && phase !== 'returning' && phase !== 'list'
    const restful = phase === 'closed' || phase === 'list'
    let tx = away ? 6.5 : home[0], ty = 0, tz = away ? 0.8 : home[2]
    let rx = 0, ry = homeRy, sc = mobile ? 1.1 : 1.25
    if (grab) {
      // presa in mano: si avvicina a chi guarda, base inclinata e schermo verso di noi
      tmp.copy(state.camera.position).lerp(new THREE.Vector3(0.25, 0, 0.7), 0.6)
      tx = tmp.x; ty = tmp.y - 0.25; tz = tmp.z
      rx = -0.15; ry = 0; sc = mobile ? 0.85 : 0.95
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
    g.rotation.x = step(g.rotation.x, rx, 6)
    g.rotation.y = step(g.rotation.y, ry, 6)
    g.scale.setScalar(step(g.scale.x, sc, 6))
    // sul banco sta aperta (si vedono tasti e schermo spento); in mano si apre del tutto
    lid.current.rotation.x = step(lid.current.rotation.x, grab ? -2.05 : away ? 0 : -1.8, 5)
    // accensione: logo Artismi, poi la schermata di lancio
    if (boot.current < BOOT_SECONDS) {
      boot.current = Math.min(BOOT_SECONDS, boot.current + Math.min(dt, 0.05))
      lcd.draw(boot.current)
      moving = true
    }
    // lo schermo sta sempre acceso; piu' luminoso del resto (la post-produzione lo smorza)
    power.current = step(power.current, grab ? 1.5 : hovered ? 1.4 : 1.3, 6)
    screenMat.color.setScalar(power.current)
    mats.led.color.set('#ff4d5e')
    if (moving) invalidate()
  })

  const over = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onPointer(true) }
  const out = () => onPointer(false)
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick() }
  const top = BH

  return (
    <group ref={group} position={home as [number, number, number]} rotation={[0, homeRy, 0]} scale={mobile ? 1.1 : 1.25}>
      <group onPointerOver={over} onPointerOut={out} onClick={click}>
        {/* ── Base ── */}
        <RoundedBox args={[CW, BH, CD]} radius={CR} smoothness={6} position={[0, BH / 2, 0]} material={mats.shell} castShadow receiveShadow />
        <mesh geometry={geo.seamBase} position={[0, BH * 0.45, 0]} material={mats.seam} />

        {/* dentro: scheda, chip, batteria, connettore, viti */}
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

        {/* serigrafia: nome, POWER, A B, SELECT START */}
        <mesh position={[0, top + 0.0012, 0]} rotation={FLAT} material={mats.face}>
          <planeGeometry args={[0.96, 0.94]} />
        </mesh>

        {/* croce nera nell'incavo rotondo, con l'incavo al centro */}
        <mesh geometry={geo.disc} position={[-0.26, top + 0.0016, 0.08]} material={mats.recess} />
        <mesh geometry={geo.ring} position={[-0.26, top + 0.002, 0.08]} material={mats.shell} />
        <mesh geometry={geo.cross} position={[-0.26, top - 0.004, 0.08]} material={mats.cross} castShadow receiveShadow />
        <mesh geometry={geo.dimple} position={[-0.26, top + 0.0275, 0.08]} material={mats.hole} />

        {/* A e B corallo: escono dai loro fori, sulla piastra inclinata */}
        <mesh geometry={geo.pill} position={[0.27, top + 0.0016, 0.06]} rotation={[0, 0.55, 0]} material={mats.recess} />
        {[[0.2, 0.105], [0.345, 0.01]].map(([x, z]) => (
          <group key={x} position={[x, top, z]}>
            <mesh geometry={geo.holeAB} position={[0, 0.0022, 0]} material={mats.hole} />
            <mesh geometry={geo.dome} material={mats.ab} castShadow receiveShadow />
          </group>
        ))}

        {/* SELECT e START: pillole di gomma infossate nella loro fessura */}
        {[-0.07, 0.08].map((x) => (
          <group key={x} position={[x, top, 0.34]} rotation={[0, 0.3, 0]}>
            <mesh geometry={geo.holePill} position={[0, 0.0022, 0]} material={mats.hole} />
            <mesh geometry={geo.rubberPill} position={[0, -0.004, 0]} material={mats.pills} castShadow />
          </group>
        ))}

        {/* altoparlante e LED */}
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[0.27 + (i % 4) * 0.032, top + 0.0008, 0.3 + Math.floor(i / 4) * 0.032]} material={mats.dots}>
            <cylinderGeometry args={[0.009, 0.009, 0.003, 12]} />
          </mesh>
        ))}
        <mesh position={[-0.05, top + 0.003, -0.19]} material={mats.led}><sphereGeometry args={[0.012, 16, 16]} /></mesh>

        {/* tasti dorsali, interruttore rosso a destra, rotella in metallo a sinistra */}
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.2, 0.05, 0.05]} radius={0.02} smoothness={4} position={[s * 0.36, BH * 0.62, -CD / 2 - 0.006]} material={mats.recess} castShadow />
        ))}
        <group position={[CW / 2 + 0.012, BH * 0.5, 0.22]}>
          <RoundedBox args={[0.03, 0.05, 0.12]} radius={0.012} smoothness={3} material={mats.switch} castShadow />
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} position={[0.016, 0, -0.04 + i * 0.02]} material={mats.switch}><boxGeometry args={[0.008, 0.04, 0.006]} /></mesh>
          ))}
        </group>
        <mesh position={[-CW / 2 - 0.02, BH * 0.5, 0.12]} rotation={[0, 0, Math.PI / 2]} material={mats.metal} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 40]} />
        </mesh>

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
          <RoundedBox args={[CW, LH, LID_D]} radius={CR} smoothness={6} position={[0, LH / 2, LID_D / 2]} material={mats.shell} castShadow receiveShadow />
          <mesh geometry={geo.seamLid} position={[0, LH * 0.5, LID_D / 2]} material={mats.seam} />
          {/* scheda dello schermo, dentro il coperchio */}
          <mesh position={[0, LH * 0.45, LID_D * 0.55]} rotation={UNDER} material={mats.chip}>
            <planeGeometry args={[0.72, 0.5]} />
          </mesh>
          {/* emblema in rilievo sul coperchio */}
          <mesh position={[0, LH + 0.002, LID_D / 2]} material={mats.recess}>
            <cylinderGeometry args={[0.14, 0.145, 0.006, 64]} />
          </mesh>
          <mesh position={[0, LH + 0.005, LID_D / 2]} rotation={FLAT} material={mats.shell}>
            <torusGeometry args={[0.1, 0.006, 8, 64]} />
          </mesh>
          {/* cornice rosa spessa, LCD incassato dentro la finestra, vetro sopra; LED */}
          <mesh geometry={geo.bezel} position={[0, 0, LID_D * 0.5]} rotation={UNDER} material={mats.bezel} castShadow receiveShadow />
          <mesh ref={screen} position={[0, -0.002, LID_D * 0.5 + 0.05]} rotation={UNDER} material={screenMat}>
            <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          </mesh>
          <mesh position={[0, -0.0092, LID_D * 0.5 + 0.05]} rotation={UNDER} material={mats.glass}>
            <planeGeometry args={[0.66, 0.46]} />
          </mesh>
          <mesh position={[-0.385, -0.01, LID_D * 0.5 + 0.05]} material={mats.led}><sphereGeometry args={[0.011, 16, 16]} /></mesh>
          {/* gommini */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.44, -0.003, LID_D - 0.05]} material={mats.rubber}>
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
