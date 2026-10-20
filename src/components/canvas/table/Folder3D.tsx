'use client'

/**
 * Il fascicolo del portfolio: kraft stampato con la grafica Artismi, etichetta
 * rosa, linguetta azzurra, fogli e card dentro, molletta nera e graffetta.
 * La copertina e' incernierata a sinistra e si apre verso sinistra.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js'
import {
  coverTextures, labelTexture, dotTexture, tabTexture, stampTexture, pagesTexture, tapeTexture,
} from './textures'
import type { TablePhase } from './Table3D'

export const FW = 2.3, FD = 3.0
const FT = 0.012          // spessore del cartoncino
const PAGES_H = 0.03      // pacco di fogli
const COVER_Y = FT + PAGES_H + 0.012
const damp = THREE.MathUtils.damp
const EPS = 0.0005
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0]

/**
 * Per il mouse: una scatola semplice che non si disegna. Il puntatore la
 * interroga a ogni movimento; interrogare il modello vero (migliaia di
 * triangoli) faceva scattare il 3D.
 */
export const HIT_MAT = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })

/**
 * Il tabellone della bilia: una tavola sola, piatta, stesa sul fascicolo aperto
 * sopra le due pagine (niente piega in mezzo). BW × BD; da aperto e' centrata in
 * x = 0, z = 0, e la faccia stampata e' a BOARD_Y.
 */
export const BW = FW * 2 - 0.14, BD = FD - 0.12
const BOARD_T = 0.008
export const BOARD_Y = 0.074
/** da telefono il fascicolo sta piu' in fondo (sopra la console): da aperto e' centrato in z = MOBILE_Z */
export const MOBILE_Z = -1.05

function folderShape(withTab: boolean) {
  const w = FW / 2, d = FD / 2, r = 0.05, rr = 0.09
  const s = new THREE.Shape()
  s.moveTo(-w + r, -d)
  s.lineTo(w - rr, -d); s.quadraticCurveTo(w, -d, w, -d + rr)
  if (withTab) {
    const t0 = d - 1.45, t1 = d - 0.22, out = 0.22
    s.lineTo(w, t0)
    s.quadraticCurveTo(w, t0 + 0.06, w + 0.05, t0 + 0.1)
    s.lineTo(w + out - 0.03, t0 + 0.16); s.quadraticCurveTo(w + out, t0 + 0.18, w + out, t0 + 0.24)
    s.lineTo(w + out, t1 - 0.06); s.quadraticCurveTo(w + out, t1, w + out - 0.06, t1)
    s.lineTo(w, t1)
  }
  s.lineTo(w, d - rr); s.quadraticCurveTo(w, d, w - rr, d)
  s.lineTo(-w + r, d); s.quadraticCurveTo(-w, d, -w, d - r)
  s.lineTo(-w, -d + r); s.quadraticCurveTo(-w, -d, -w + r, -d)
  return s
}

/**
 * Cartoncino vero: non e' mai piatto. Si suddivide la forma e la si imbarca
 * appena; sulla copertina l'angolo in basso a destra si solleva un po'.
 */
function warped(shape: THREE.Shape, curl: boolean) {
  let g: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, EXTRUDE)
  g = new TessellateModifier(0.07, 8).modify(g)
  const pos = g.attributes.position
  const w = FW / 2, d = FD / 2
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    let z = 0.0025 * Math.sin(x * 2.1 + 0.4) * Math.cos(y * 1.7) + 0.0015 * Math.sin(y * 3.3)
    if (curl) {
      // y negativa = verso chi guarda: l'angolo in basso a destra
      const t = ((x - (w - 0.6)) + (-y - (d - 0.6))) / 0.6
      if (t > 0) z += 0.045 * t * t
    }
    pos.setZ(i, pos.getZ(i) + z)
  }
  g.computeVertexNormals()
  return g
}

const EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: FT, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.003, bevelSegments: 2, curveSegments: 12,
}

/** Graffetta: un filo piegato in due anse, appoggiato in piano */
function paperclipCurve() {
  const p = [
    [0, 0.02], [0, 0.5], [0.04, 0.56], [0.1, 0.56], [0.14, 0.5], [0.14, 0.1],
    [0.1, 0.04], [0.06, 0.04], [0.035, 0.1], [0.035, 0.44], [0.06, 0.48], [0.085, 0.44], [0.085, 0.16],
  ]
  return new THREE.CatmullRomCurve3(p.map(([x, z]) => new THREE.Vector3(x, 0, -z)), false, 'catmullrom', 0.2)
}

/** Molletta: corpo trapezoidale nero, due leve in filo d'acciaio piegate all'indietro */
function binderGeometries() {
  const prof = new THREE.Shape()
  prof.moveTo(-0.08, 0); prof.lineTo(0.08, 0); prof.lineTo(0.03, 0.06); prof.lineTo(-0.03, 0.06); prof.closePath()
  const body = new THREE.ExtrudeGeometry(prof, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 })
  body.translate(0, 0, -0.16)
  body.rotateY(Math.PI / 2) // il profilo sta nel piano z-y, la lunghezza lungo x
  const lever = (side: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, 0.05, side * 0.03),
    new THREE.Vector3(-0.12, 0.09, side * 0.05),
    new THREE.Vector3(-0.1, 0.1, side * 0.16),
    new THREE.Vector3(0.1, 0.1, side * 0.16),
    new THREE.Vector3(0.12, 0.09, side * 0.05),
    new THREE.Vector3(0.12, 0.05, side * 0.03),
  ]), 48, 0.006, 8, false)
  return { body, lever: lever(-1) }
}

export function Folder3D({ phase, mobile, hovered, thumbs, count, label, logo, paper, paperRough, metalRough, board, onPointer, onClick }: {
  phase: TablePhase; mobile: boolean; hovered: boolean; thumbs: string[]; count: number; label: string
  /** la stampa del tabellone */
  board: THREE.Texture | null
  logo: HTMLImageElement | null; paper: HTMLImageElement | null; paperRough: THREE.Texture; metalRough: THREE.Texture
  onPointer: (h: boolean) => void; onClick: () => void
}) {
  const group = useRef<THREE.Group>(null!)
  const lift = useRef<THREE.Group>(null!)
  const pivot = useRef<THREE.Group>(null!)
  const cards = useRef<THREE.Group>(null!)
  const boardRef = useRef<THREE.Mesh>(null)
  const invalidate = useThree((s) => s.invalidate)

  const geo = useMemo(() => ({
    back: warped(folderShape(true), false),
    cover: warped(folderShape(false), true),
    clip: new THREE.TubeGeometry(paperclipCurve(), 160, 0.008, 8, false),
    ...binderGeometries(),
  }), [])

  const tex = useMemo(() => {
    const cover = coverTextures({ logo, paper, big: 'ku2', printed: true })
    const back = coverTextures({ logo: null, paper, big: '', printed: false, seed: 9 })
    // la texture copre esattamente il fascicolo: u = x / larghezza, v = y / altezza
    for (const t of [cover.map, cover.bump, back.map, back.bump]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(1 / FW, 1 / FD); t.offset.set(0.5, 0.5)
    }
    return {
      cover, back,
      label: labelTexture({ title: 'Portfolio', top: '✦  ARTISMI DESIGN STUDIO — ARCHIVIO', bottom: 'IDENTITÀ VISIVE · ILLUSTRAZIONE · MURALES · 2024—OGGI' }),
      dot: dotTexture(String(count).padStart(2, '0'), 'LAVORI'),
      tab: tabTexture('Progetti'),
      stamp: stampTexture(label),
      pages: pagesTexture(),
      tape: tapeTexture(),
    }
  }, [count, label, logo, paper])

  const mats = useMemo(() => {
    // la rugosita' fotografica della carta, ripetuta due volte sul fascicolo
    const rough = paperRough.clone()
    rough.wrapS = rough.wrapT = THREE.RepeatWrapping
    rough.repeat.set(2 / FW, 2 / FD); rough.offset.set(0.5, 0.5)
    const cover = new THREE.MeshStandardMaterial({
      map: tex.cover.map, bumpMap: tex.cover.bump, bumpScale: 1.2, roughnessMap: rough, roughness: 1,
      emissive: new THREE.Color('#ffd9a8'), emissiveIntensity: 0,
    })
    const back = new THREE.MeshStandardMaterial({ map: tex.back.map, bumpMap: tex.back.bump, bumpScale: 1.2, roughnessMap: rough, roughness: 1 })
    const lining = new THREE.MeshStandardMaterial({ color: '#1E1B24', roughness: 0.95 })
    const stamp = new THREE.MeshStandardMaterial({ map: tex.stamp, transparent: true, opacity: 0, roughness: 1, depthWrite: false, color: '#C9365A' })
    const paper = new THREE.MeshStandardMaterial({ color: '#F2EDE4', roughness: 0.9 })
    const pages = new THREE.MeshStandardMaterial({ map: tex.pages, roughness: 0.9 })
    const boardSide = new THREE.MeshStandardMaterial({ color: '#141216', roughness: 0.8, transparent: true, opacity: 0 })
    return { cover, back, lining, stamp, paper, pages, boardSide }
  }, [tex, paperRough])

  const boardTop = useMemo(() => board
    ? new THREE.MeshStandardMaterial({ map: board, roughness: 0.8, transparent: true, opacity: 0 })
    : null, [board])
  useEffect(() => () => { boardTop?.dispose() }, [boardTop])

  const cardTex = useMemo(() => {
    const loader = new THREE.TextureLoader()
    return thumbs.map((src) => {
      const t = loader.load(src, () => invalidate())
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      return t
    })
  }, [thumbs, invalidate])

  useEffect(() => () => {
    Object.values(geo).forEach((g) => g.dispose())
    ;[tex.cover.map, tex.cover.bump, tex.back.map, tex.back.bump, tex.label, tex.dot, tex.tab, tex.stamp, tex.pages, tex.tape, ...cardTex].forEach((t) => t.dispose())
    Object.values(mats).forEach((m) => m.dispose())
  }, [geo, tex, mats, cardTex])

  useEffect(() => { invalidate() }, [phase, hovered, mobile, invalidate])

  useFrame((_, dt) => {
    const away = phase === 'sliding' || phase === 'opening' || phase === 'open' || phase === 'closing'
    const pos = mobile ? (away ? [FW / 2, 0, MOBILE_Z] : [0, 0, MOBILE_Z]) : away ? [FW / 2, 0, 0] : [-1.55, 0, 0.05]
    const rotY = mobile || away ? 0 : 0.07
    const cover = phase === 'opening' || phase === 'open' ? Math.PI : phase === 'list' ? 1.95 : 0
    const restful = phase === 'closed'
    const on = restful && hovered

    let moving = false
    const step = (cur: number, to: number, k: number) => {
      const v = damp(cur, to, k, dt)
      if (Math.abs(v - to) > EPS) moving = true
      return v
    }
    const g = group.current
    g.position.x = step(g.position.x, pos[0], 6)
    g.position.z = step(g.position.z, pos[2], 6)
    g.rotation.y = step(g.rotation.y, rotY, 6)
    lift.current.position.y = step(lift.current.position.y, on ? 0.14 : 0, 9)
    lift.current.rotation.x = step(lift.current.rotation.x, on ? -0.03 : 0, 9)
    pivot.current.rotation.z = step(pivot.current.rotation.z, cover, 5.5)
    cards.current.position.z = step(cards.current.position.z, on ? -0.13 : 0, 9)
    mats.cover.emissiveIntensity = step(mats.cover.emissiveIntensity, on ? 0.05 : 0, 9)
    mats.stamp.opacity = step(mats.stamp.opacity, on ? 0.9 : 0, 9)
    // il tabellone compare a fascicolo aperto e sparisce subito quando si richiude
    const b = boardRef.current
    if (b && boardTop) {
      const o = step(boardTop.opacity, phase === 'open' ? 1 : 0, phase === 'open' ? 7 : 14)
      boardTop.opacity = mats.boardSide.opacity = o
      b.visible = o > 0.002
      b.position.y = BOARD_Y - BOARD_T / 2 + (1 - o) * 0.06
    }
    if (moving) invalidate()
  })

  const over = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onPointer(true) }
  const out = () => onPointer(false)
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick() }
  const top = FT + 0.0065 // appena sopra la faccia del cartoncino (che e' un po' imbarcata)

  return (
    <group ref={group} position={mobile ? [0, 0, MOBILE_Z] : [-1.55, 0, 0.05]} rotation={[0, mobile ? 0 : 0.07, 0]}>
      {/* il tabellone: si stende sul fascicolo aperto, sopra la piega */}
      {boardTop && (
        <mesh ref={boardRef} position={[-FW / 2, BOARD_Y - BOARD_T / 2, 0]} visible={false}
          material={[mats.boardSide, mats.boardSide, boardTop, mats.boardSide, mats.boardSide, mats.boardSide]}
          castShadow receiveShadow>
          <boxGeometry args={[BW, BOARD_T, BD]} />
        </mesh>
      )}

      <group ref={lift}>
        <mesh position={[0.06, 0.08, 0]} material={HIT_MAT} onPointerOver={over} onPointerOut={out} onClick={click}>
          <boxGeometry args={[FW + 0.3, 0.16, FD + 0.1]} />
        </mesh>
        {/* retro con la linguetta */}
        <mesh geometry={geo.back} material={mats.back} rotation={FLAT} castShadow receiveShadow />
        <mesh position={[FW / 2 + 0.115, top + 0.0005, -0.75]} rotation={FLAT} receiveShadow>
          <planeGeometry args={[0.15, 0.9]} />
          <meshStandardMaterial map={tex.tab} roughness={0.75} />
        </mesh>
        <mesh position={[0, top + 0.0005, 0]} rotation={FLAT} material={mats.lining} receiveShadow>
          <planeGeometry args={[FW - 0.06, FD - 0.06]} />
        </mesh>

        {/* il pacco di fogli: si vede dal bordo */}
        <mesh position={[0.02, FT + PAGES_H / 2 + 0.002, 0.03]} castShadow receiveShadow
          material={[mats.pages, mats.pages, mats.paper, mats.paper, mats.pages, mats.pages]}>
          <boxGeometry args={[FW - 0.1, PAGES_H, FD - 0.12]} />
        </mesh>

        {/* le solite card, sporgenti dal bordo alto */}
        <group ref={cards}>
          {cardTex.map((t, i) => {
            const x = -0.62 + i * 0.42, rz = (i - 1.5) * 0.06
            return (
              <group key={i} position={[x, FT + PAGES_H + 0.004 + i * 0.0015, -FD / 2 + 0.1]} rotation={[0, rz, 0]}>
                <mesh rotation={FLAT} material={mats.paper} castShadow receiveShadow>
                  <planeGeometry args={[0.9, 0.52]} />
                </mesh>
                <mesh position={[0, 0.0008, 0]} rotation={FLAT} receiveShadow>
                  <planeGeometry args={[0.84, 0.455]} />
                  <meshStandardMaterial map={t} roughness={0.55} />
                </mesh>
              </group>
            )
          })}
        </group>

        {/* copertina, incernierata a sinistra */}
        <group ref={pivot} position={[-FW / 2, COVER_Y, 0]}>
          <group position={[FW / 2, 0, 0]}>
            <mesh geometry={geo.cover} material={mats.cover} rotation={FLAT} castShadow receiveShadow />
            <mesh position={[0, -0.0035, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.lining}>
              <planeGeometry args={[FW - 0.06, FD - 0.06]} />
            </mesh>
            {/* l'etichetta grande «Portfolio», storta, sopra la scritta stampata */}
            <mesh position={[0.08, top, 0.12]} rotation={[-Math.PI / 2, 0, 0.045]} receiveShadow>
              <planeGeometry args={[1.86, 0.93]} />
              <meshStandardMaterial map={tex.label} transparent roughness={0.62} />
            </mesh>
            {/* bollino azzurro sull'angolo, e nastro di carta sull'altro */}
            <mesh position={[0.86, top + 0.0012, -0.3]} rotation={[-Math.PI / 2, 0, -0.3]} receiveShadow>
              <planeGeometry args={[0.42, 0.42]} />
              <meshStandardMaterial map={tex.dot} transparent roughness={0.55} />
            </mesh>
            <mesh position={[-0.76, top + 0.0012, -0.3]} rotation={[-Math.PI / 2, 0, 0.62]} receiveShadow>
              <planeGeometry args={[0.44, 0.13]} />
              <meshStandardMaterial map={tex.tape} transparent roughness={0.6} depthWrite={false} />
            </mesh>
            <mesh position={[0.9, top + 0.0012, 0.56]} rotation={[-Math.PI / 2, 0, 0.5]} receiveShadow>
              <planeGeometry args={[0.4, 0.12]} />
              <meshStandardMaterial map={tex.tape} transparent roughness={0.6} depthWrite={false} />
            </mesh>

            {/* timbro: compare al passaggio, sotto l'etichetta */}
            <mesh position={[-0.2, top + 0.0024, 0.95]} rotation={[-Math.PI / 2, 0, 0.09]} material={mats.stamp}>
              <planeGeometry args={[1.4, 0.41]} />
            </mesh>

            {/* molletta nera sul bordo alto */}
            <group position={[-0.45, FT, -FD / 2 + 0.06]}>
              <mesh geometry={geo.body} castShadow>
                <meshPhysicalMaterial color="#141216" roughness={0.28} metalness={0.4} clearcoat={0.8} clearcoatRoughness={0.2} />
              </mesh>
              <mesh geometry={geo.lever} castShadow>
                <meshStandardMaterial color="#d6d9dc" metalness={1} roughness={0.45} roughnessMap={metalRough} />
              </mesh>
            </group>

            {/* graffetta rossa che pizzica il bordo basso */}
            <mesh geometry={geo.clip} position={[-0.78, FT + 0.012, FD / 2 + 0.16]} castShadow>
              <meshPhysicalMaterial color="#C8262B" roughness={0.3} clearcoat={0.6} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
