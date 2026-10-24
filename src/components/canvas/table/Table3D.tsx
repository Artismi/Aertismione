'use client'

/**
 * Table3D — il mondo della home, uno solo: il logo di vetro sospeso in aria e,
 * piu' giu', il banco da lavoro con il fascicolo del portfolio e il Game Boy di
 * Porto Vecchio, tutto dentro la piscina rosa.
 *
 * E' un <Canvas> fisso dietro tutta la pagina (portale su body, z-index -1).
 * Il mondo scorre con la pagina (vedi Rig): il logo sta nella prima schermata,
 * il banco nel riquadro della sezione Progetti, e ognuno entra ed esce con la
 * sua sezione. Lo sfondo rosa e la luce sono gli stessi per tutto.
 * Frameloop "demand": disegna solo quando la camera o un
 * oggetto si muove. I clic arrivano dalla pagina (eventSource = body).
 * Le fasi (chiuso, scivola, si apre...) le decide PortfolioSection.
 * Il tabellone della bilia lo disegna PortfolioSection su un canvas 2D: qui
 * diventa la stampa dentro il fascicolo, e il mouse viene riportato sul tabellone.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, N8AO, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type EffectComposer as Composer } from 'postprocessing'
import * as THREE from 'three'
import { loadImage } from './textures'
import { Bench } from './Bench'
import { Folder3D, FW, FD, BW, BD, BOARD_Y, MOBILE_Z } from './Folder3D'
import { Console3D } from './Console3D'
import { Marble3D } from './Marble3D'
import { marble } from './marble'
import { WorldBackdrop, GlassSync } from './WorldBackdrop'
import { worldHold, worldNear } from './shared'
import { WaterCanvas } from './WaterCanvas'
import { LogoModel } from '../LogoModel'
import { useStore } from '@/stores/useStore'

/**
 * Come gl.compileAsync, ma non si blocca. Quello di three.js legge il programma di
 * ogni materiale mentre aspetta: se nel frattempo un materiale viene sostituito o
 * buttato (il programma non c'e' piu') va in errore («reading 'isReady'»), la
 * promessa non finisce mai e il banco resta preparato a meta'.
 */
function compileSafe(gl: THREE.WebGLRenderer, scene: THREE.Object3D, camera: THREE.Camera) {
  const pending = gl.compile(scene, camera)
  return new Promise<void>((done) => {
    const started = performance.now()
    const check = () => {
      for (const mat of pending) {
        const program = (gl.properties.get(mat) as { currentProgram?: { isReady?: () => boolean } }).currentProgram
        if (!program?.isReady || program.isReady()) pending.delete(mat)
      }
      // al massimo dieci secondi: poi si va avanti comunque
      if (pending.size === 0 || performance.now() - started > 10000) done()
      else window.setTimeout(check, 10)
    }
    window.setTimeout(check, 10)
  })
}
import styles from './Table3D.module.css'

export type TablePhase = 'closed' | 'sliding' | 'opening' | 'open' | 'closing' | 'returning' | 'list'
/** u, v tra 0 e 1 sul tabellone (v = 0 in alto); inside = il punto cade sul fascicolo */
export type BoardPoint = { u: number; v: number; inside: boolean }
export type TableApi = {
  /** dove cadono sullo schermo tre angoli della tavola: alto-sinistra, alto-destra, basso-sinistra */
  boardScreen: () => [number, number, number, number, number, number] | null
  /** dal punto sullo schermo al punto sul tabellone, anche fuori (per tirare la fionda) */
  toBoard: (clientX: number, clientY: number) => BoardPoint | null
  /** il canvas del tabellone e' stato ridisegnato */
  refresh: () => void
  /** la bilia si e' mossa sul tabellone: si ridisegna il mondo, la texture no */
  tick: () => void
}

type Props = {
  phase: TablePhase
  grab: boolean
  mobile: boolean
  thumbs: string[]
  count: number
  folderLabel: string
  folderHint: string
  game: { title: string; hint: string; close: string; screen: string; loading: string }
  onFolder: () => void
  onConsole: () => void
  /** il mouse e' arrivato sul Game Boy: da computer il gioco comincia a caricarsi */
  onConsoleHover: () => void
  api: MutableRefObject<TableApi | null>
  /** il canvas 2D su cui PortfolioSection disegna il tabellone */
  board: RefObject<HTMLCanvasElement | null>
  /** il riquadro del tavolo nella sezione Progetti: da li' si capisce dove siamo */
  stage: RefObject<HTMLDivElement | null>
}

const damp = THREE.MathUtils.damp
const EPS = 0.0005
const TEX = '/progetti/tex'

type Images = { logo: HTMLImageElement | null; paper: HTMLImageElement | null; metal: HTMLImageElement | null }

/* ── Camera: il mondo scorre con la pagina ── */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** dove sta il logo nella prima schermata, in frazione dell'altezza dello schermo */
const LOGO_AT = 0.45
/** quanto scurisce l'occlusione negli angoli del banco (N8AO) */
const AO_INTENSITY = 3.5

export type Quality = 'high' | 'medium' | 'low'
type QualityLevel = { dpr: [number, number]; msaa: number; ao: 'low' | 'medium'; glass: boolean }
/**
 * Fasce di qualita': quanti pixel (dpr), quanto antialiasing (msaa), che occlusione, e se
 * la plastica del Game Boy lascia vedere l'elettronica (glass; senza, la scheda e' stampata
 * sotto il velo rosa).
 * Da computer l'alta e' sovracampionata: il vetro del logo e i bordi del banco nitidi
 * anche sugli schermi normali. Ogni fascia ha la sua risoluzione fissa: cambiarla a ogni
 * inizio e fine di movimento riallocava i buffer, e ogni animazione partiva con uno scatto.
 */
const QUALITY: Record<'desktop' | 'mobile', Record<Quality, QualityLevel>> = {
  desktop: {
    high: { dpr: [1.5, 2], msaa: 4, ao: 'medium', glass: true },
    medium: { dpr: [1, 1.25], msaa: 2, ao: 'low', glass: true },
    low: { dpr: [1, 1], msaa: 0, ao: 'low', glass: false },
  },
  mobile: {
    high: { dpr: [1, 1.5], msaa: 0, ao: 'low', glass: true },
    medium: { dpr: [1, 1.5], msaa: 0, ao: 'low', glass: true },
    low: { dpr: [1, 1], msaa: 0, ao: 'low', glass: false },
  },
}
const LOWER: Record<Quality, Quality> = { high: 'medium', medium: 'low', low: 'low' }
/** in movimento sul banco, se piu' di un fotogramma su cinque va sotto i 45 al secondo
 *  la fascia scende: sono quelli che si vedono come scatti, anche con la mediana a 60 */
const SLOW_DT = 1 / 45

/**
 * La camera guarda il banco sempre dalla stessa angolazione e scorre con la
 * pagina, lungo il suo «alto»: il mondo e' fermo rispetto alla pagina, come se
 * fosse disegnato sotto. Il banco sta nel riquadro della sezione Progetti e il
 * logo in cima, all'altezza della prima schermata: ognuno entra ed esce con la
 * sua sezione e non compare altrove. Il logo e' nello stesso spazio del banco,
 * girato verso la camera.
 */
function Rig({ phase, mobile, stage, look, logo }: {
  phase: TablePhase; mobile: boolean; stage: Props['stage']; look: MutableRefObject<THREE.Vector3>
  logo: RefObject<THREE.Group | null>
}) {
  const { camera, size, invalidate } = useThree()
  const mouse = useRef(new THREE.Vector2())
  const v = useRef({
    pos: new THREE.Vector3(), lk: new THREE.Vector3(), up: new THREE.Vector3(), fwd: new THREE.Vector3(),
    right: new THREE.Vector3(), m: new THREE.Matrix4(), camUp: new THREE.Vector3(0, 1, 0),
  })
  useEffect(() => { invalidate() }, [phase, mobile, size, invalidate])
  // lo scroll muove il mondo, il mouse lo sposta appena: si ridisegna solo allora,
  // e solo se il logo o il banco sono sullo schermo (altrove si vede solo l'acqua).
  // Per il mouse basta mezzo fotogramma ogni due: lo spostamento e' di pochi millimetri
  useEffect(() => {
    let lastMove = 0
    const on = () => { if (worldNear(stage.current)) invalidate() }
    const move = (e: PointerEvent) => {
      mouse.current.set(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1)
      const now = performance.now()
      if (worldHold.on || now - lastMove < 33 || !worldNear(stage.current)) return
      lastMove = now
      invalidate()
    }
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('pointermove', move, { passive: true })
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('pointermove', move) }
  }, [invalidate, stage])

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera
    const vw = size.width, vh = size.height, aspect = vw / Math.max(1, vh)
    const r = stage.current?.getBoundingClientRect()
    const stageAspect = r && r.height > 0 ? r.width / r.height : aspect
    const t = v.current

    // l'inquadratura di lavoro, in prospettiva e dritta, a misura del riquadro
    if (mobile) {
      // un po' piu' larga: fascicolo e Game Boy interi, con aria intorno
      const k = Math.max(1, 0.62 / stageAspect) * (aspect < stageAspect ? stageAspect / aspect : 1) * 1.14
      t.pos.set(0, 7.6 * k, 4.6 * k); t.lk.set(0, 0, 0.35)
    } else {
      // stretta sugli oggetti: fascicolo e Game Boy protagonisti, il banco li incornicia
      const k = Math.max(1, 2.15 / stageAspect) * (r ? vh / r.height : 1) * 0.8
      t.pos.set(0.15, 5.4 * k, 4.9 * k); t.lk.set(0.15, 0, 0.25)
    }
    t.fwd.subVectors(t.lk, t.pos)
    const dist = t.fwd.length()
    t.fwd.normalize()
    t.right.crossVectors(t.fwd, V(0, 1, 0)).normalize()
    t.up.crossVectors(t.right, t.fwd).normalize()
    // quanto e' alto lo schermo, nel mondo, alla distanza del banco
    const viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))

    if (r) {
      // il logo: in cima alla pagina, nello stesso spazio del banco, girato verso la camera
      const g = logo.current
      if (g) {
        const fromStage = ((r.top + r.height / 2) - (vh * LOGO_AT - window.scrollY)) / vh * viewH
        g.position.copy(t.lk).addScaledVector(t.up, fromStage).addScaledVector(t.right, -((r.left + r.width / 2) - vw / 2) / vh * viewH)
        g.quaternion.setFromRotationMatrix(t.m.lookAt(t.pos, t.lk, t.up))
      }
    }

    const top = phase !== 'closed' && phase !== 'returning' && phase !== 'list'
    if (top && mobile) {
      // da telefono il fascicolo aperto si guarda girato di 90°: il lato lungo in
      // verticale, cosi' riempie lo schermo (in alto c'e' la pagina di sinistra)
      const tt = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 2
      const h = Math.max((FW * 2 + 0.4) / tt, (FD + 0.25) / aspect / tt)
      t.pos.set(0, h, MOBILE_Z); t.lk.set(0, 0, MOBILE_Z)
    } else if (top) {
      // dall'alto, con il fascicolo aperto (2 × larghezza) che sta tutto nell'inquadratura
      const tt = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 2
      const h = Math.max((FD + 0.4) / tt, (FW * 2 + 0.5) / aspect / tt)
      t.pos.set(0, h, 0.001); t.lk.set(0, 0, 0)
    } else if (r) {
      // il banco segue il riquadro della sezione: si sposta la camera lungo il suo
      // «alto» e la sua «destra», senza girarla. Riquadro sotto il centro = banco sotto.
      const dy = ((r.top + r.height / 2) - vh / 2) / vh * viewH
      const dx = ((r.left + r.width / 2) - vw / 2) / vw * viewH * aspect
      // il mouse sposta di pochissimo, solo per dare profondita'
      const sx = -dx + mouse.current.x * 0.08, sy = dy - mouse.current.y * 0.05
      t.pos.addScaledVector(t.right, sx).addScaledVector(t.up, sy)
      t.lk.addScaledVector(t.right, sx).addScaledVector(t.up, sy)
    }

    let moving = false
    // seguendo lo scroll si va quasi alla lettera (lo scroll e' gia' morbido); le aperture sono smorzate
    const k = top || phase === 'returning' ? 5 : 16
    for (const ax of ['x', 'y', 'z'] as const) {
      cam.position[ax] = damp(cam.position[ax], t.pos[ax], k, dt)
      look.current[ax] = damp(look.current[ax], t.lk[ax], k, dt)
      // si ridisegna finche' arrivano sia la camera sia il punto guardato
      if (Math.abs(cam.position[ax] - t.pos[ax]) > EPS || Math.abs(look.current[ax] - t.lk[ax]) > EPS) moving = true
    }
    // l'«alto» della camera gira piano verso quello voluto (da telefono, col fascicolo aperto, -x)
    const wantUp = top && mobile ? V(-1, 0, 0) : V(0, 1, 0)
    for (const ax of ['x', 'y', 'z'] as const) t.camUp[ax] = damp(t.camUp[ax], wantUp[ax], k, dt)
    if (t.camUp.distanceTo(wantUp) > EPS) moving = true
    cam.up.copy(t.camUp).normalize()
    cam.lookAt(look.current)
    if (moving) invalidate()
  })
  return null
}

/**
 * Il tabellone: il canvas della bilia diventa la stampa della tavola stesa sul
 * fascicolo aperto, e il mouse si riporta dallo schermo al piano della tavola.
 */
function useBoard(board: Props['board'], api: Props['api'], mobile: boolean) {
  const { camera, gl, invalidate } = useThree()
  const tex = useMemo(() => {
    const c = board.current
    if (!c) return null
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [board])
  useEffect(() => () => { tex?.dispose() }, [tex])

  useEffect(() => {
    const ray = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BOARD_Y)
    const hit = new THREE.Vector3(), ndc = new THREE.Vector2()
    const center = mobile ? MOBILE_Z : 0
    api.current = {
      toBoard: (cx, cy) => {
        const r = gl.domElement.getBoundingClientRect()
        ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1)
        ray.setFromCamera(ndc, camera)
        if (!ray.ray.intersectPlane(plane, hit)) return null
        // da aperto il tabellone e' centrato in x = 0, z = center
        const u = hit.x / BW + 0.5, v = (hit.z - center) / BD + 0.5
        return { u, v, inside: u >= 0 && u <= 1 && v >= 0 && v <= 1 }
      },
      boardScreen: () => {
        const r = gl.domElement.getBoundingClientRect()
        const out: number[] = []
        for (const [x, z] of [[-BW / 2, center - BD / 2], [BW / 2, center - BD / 2], [-BW / 2, center + BD / 2]]) {
          hit.set(x, BOARD_Y, z).project(camera)
          out.push(r.left + (hit.x + 1) / 2 * r.width, r.top + (1 - hit.y) / 2 * r.height)
        }
        return out as [number, number, number, number, number, number]
      },
      refresh: () => {
        if (!tex || worldHold.on) return
        tex.needsUpdate = true
        invalidate()
      },
      tick: () => invalidate(),
    }
    return () => { api.current = null }
  }, [api, camera, gl, invalidate, tex, mobile])

  return tex
}

/** Gli oggetti del tavolo: si caricano quando ci si avvicina alla sezione */
function Table(props: Props & { images: Images; level: QualityLevel }) {
  const { phase, grab, mobile } = props
  const [hFolder, setHFolder] = useState(false)
  const [hConsole, setHConsole] = useState(false)
  // la bilia deve sapere se il clic e' del fascicolo o del Game Boy
  const hover = useRef({ folder: false, console: false })
  hover.current.folder = hFolder
  hover.current.console = hConsole
  const board = useBoard(props.board, props.api, mobile)
  // rugosita' fotografiche (CC0): carta, metallo spazzolato, plastica
  const [paperRough, metalRough, plasticRough] = useLoader(THREE.TextureLoader, [
    `${TEX}/paper_rough.webp`, `${TEX}/metal_rough.webp`, `${TEX}/plastic_rough.webp`,
  ])

  // il puntatore passa dalla pagina: la manina la mettiamo sul body
  useEffect(() => {
    document.body.style.cursor = hFolder || hConsole ? 'pointer' : ''
    return () => { document.body.style.cursor = '' }
  }, [hFolder, hConsole])

  return (
    <>
      <Bench mobile={mobile} metal={props.images.metal} metalRough={metalRough} />

      <Folder3D
        phase={phase}
        mobile={mobile}
        hovered={hFolder}
        thumbs={props.thumbs}
        count={props.count}
        label={props.folderLabel}
        logo={props.images.logo}
        paper={props.images.paper}
        paperRough={paperRough}
        metalRough={metalRough}
        board={board}
        onPointer={setHFolder}
        onClick={() => { marble.clickedAt = performance.now(); props.onFolder() }}
      />
      <Console3D
        phase={phase}
        mobile={mobile}
        grab={grab}
        hovered={hConsole}
        glass={props.level.glass}
        game={props.game}
        logo={props.images.logo}
        plasticRough={plasticRough}
        metalRough={metalRough}
        onPointer={(h) => { setHConsole(h); if (h) props.onConsoleHover() }}
        // se la bilia e' sul banco ci salta sopra, e il Game Boy si accende quando atterra
        onClick={() => { marble.clickedAt = performance.now(); if (!marble.toConsole?.()) props.onConsole() }}
      />
      <Marble3D phase={phase} mobile={mobile} grab={grab} stage={props.stage} hover={hover} onConsole={props.onConsole} />
    </>
  )
}

/* ── Risparmio: il lavoro pesante solo quando serve ── */

/**
 * Per gran parte della pagina il mondo e' solo il fondale rosa: banco e logo
 * sono fuori schermo. Allora il banco non si disegna e l'occlusione (N8AO) si
 * ferma, tanto il fondale copre tutto. L'ombra del sole si ricalcola solo
 * quando qualcosa sul banco si muove, non a ogni fotogramma. E se muovendosi
 * sul banco i fotogrammi restano lenti, la fascia di qualita' scende (onSlow).
 */
function Budget({ stage, table, composer, onSlow }: {
  stage: RefObject<HTMLDivElement | null>
  table: RefObject<THREE.Group | null>
  composer: RefObject<Composer | null>
  onSlow: () => void
}) {
  const { gl, camera, invalidate } = useThree()
  const was = useRef<boolean | null>(null)
  const sig = useRef(0)
  const cam = useRef(0)
  const scroll = useRef(-1)
  /** quanta occlusione: 0 mentre qualcosa si muove, poi torna piano a 1 */
  const ao = useRef(1)
  /** i fotogrammi in movimento sul banco (s), e da quando si misura: dopo un cambio di
   *  fascia si aspetta che la nuova si sia sistemata */
  const slow = useRef({ dts: [] as number[], since: performance.now() })

  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => { gl.shadowMap.autoUpdate = true }
  }, [gl])

  // dopo le animazioni (priorita' 0), prima del composer (1)
  useFrame((_, dt) => {
    const vh = window.innerHeight
    const r = stage.current?.getBoundingClientRect()
    const onTable = !!r && r.bottom > -60 && r.top < vh + 60
    const g = table.current
    if (g) g.visible = onTable
    // ne' logo ne' banco sullo schermo: il composer non disegna niente. Qualcuno puo'
    // chiedere un fotogramma lo stesso (lo schermo del Game Boy che si accende, il
    // caricamento del gioco) e costa solo questo giro. L'ultima immagine e' gia' vuota
    const near = worldNear(stage.current)

    // si muove qualcosa? la camera (scroll, fascicolo che si apre) o le cose sul banco
    let k = 0
    if (onTable && g) {
      g.updateMatrixWorld()
      g.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh || !o.castShadow) return
        const m = o.matrixWorld.elements
        k += m[12] * 1.31 + m[13] * 1.73 + m[14] * 2.11 + m[0] * 0.37 + m[1] * 0.53 + m[2] * 0.71 + m[4] * 0.97 + m[6] * 1.19 + m[9] * 1.43
      })
    }
    const p = camera.position, q = camera.quaternion
    const c = p.x * 1.31 + p.y * 1.73 + p.z * 2.11 + q.x * 3.7 + q.y * 5.3 + q.z * 7.1 + q.w * 1.9
    // la pagina che scorre conta sempre: scorrendo la camera scende lungo il suo «alto» e
    // nella somma pesata y e z quasi si annullano, cosi' uno scroll medio sembrava fermo
    // e l'occlusione restava accesa (il passaggio piu' caro). Per il resto (il fascicolo
    // che si apre) la camera: lo spostamento di pochi millimetri del mouse non conta, e' sotto 0,03
    const sy = window.scrollY
    const moving = sy !== scroll.current || Math.abs(c - cam.current) > 0.03 || Math.abs(k - sig.current) > 1e-3
    scroll.current = sy
    cam.current = c

    // L'occlusione (N8AO) e' l'effetto che costa di piu': mentre la camera o le cose si
    // muovono (le aperture del fascicolo e del Game Boy, lo scroll) si ferma, e a
    // movimento finito torna sfumando in un terzo di secondo, senza scatti
    if (moving) ao.current = 0
    else if (ao.current < 1) { ao.current = Math.min(1, ao.current + dt / 0.35); invalidate() }

    // la fascia di qualita' regge? Si guardano 40 fotogrammi in movimento sul banco (non
    // gli scatti lunghi: programmi che si compilano, immagini che arrivano)
    const now = performance.now()
    if (moving && onTable && dt < 0.25 && now - slow.current.since > 2000) {
      const s = slow.current.dts
      s.push(dt)
      if (s.length >= 40) {
        if ([...s].sort((a, b) => a - b)[32] > SLOW_DT) { onSlow(); slow.current.since = now }
        s.length = 0
      }
    }
    composer.current?.passes.forEach((pass) => {
      // N8AOPostPass: solo sul banco. Sul vetro del logo l'occlusione, a meta' risoluzione, lo sgranava
      if ('configuration' in pass) {
        pass.enabled = near && onTable && ao.current > 0.01
        ;(pass as unknown as { configuration: { intensity: number } }).configuration.intensity = AO_INTENSITY * ao.current
      } else pass.enabled = near
    })

    if (!onTable || !g) { was.current = onTable; return }
    if (was.current !== onTable || Math.abs(k - sig.current) > 1e-5) gl.shadowMap.needsUpdate = true
    sig.current = k
    was.current = onTable
  }, 0.5)
  return null
}

/**
 * Il banco si prepara prima di entrare: i programmi della scheda video e le
 * immagini (legno, carta, metallo...) si caricano ora, a pezzi, mentre il banco
 * e' ancora fuori schermo. Altrimenti si preparavano tutti insieme nel primo
 * fotogramma in cui il banco compare, e lo scroll scattava proprio li'.
 */
function Warmup({ table, ready, composer }: {
  table: RefObject<THREE.Group | null>; ready: boolean; composer: RefObject<Composer | null>
}) {
  const { gl, scene, camera } = useThree()
  const done = useRef(false)
  useEffect(() => {
    if (!ready || done.current) return
    let alive = true
    const idle = (cb: () => void) => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(cb, { timeout: 1500 })
      else window.setTimeout(cb, 60)
    }
    // il banco monta i suoi pezzi (Suspense) un attimo dopo le immagini: si aspetta che ci siano
    let t = 0, tries = 0
    const attempt = () => idle(async () => {
      const g = table.current
      if (!alive || !g) return
      if (g.children.length === 0) { if (++tries < 20) t = window.setTimeout(attempt, 500); return }
      done.current = true
      const was = g.visible
      g.visible = true
      // si compila per dove il banco si disegna davvero: nel buffer del composer (lineare,
      // senza correzione colore), non sullo schermo. Compilati per lo schermo i programmi
      // erano altri, e quelli giusti si compilavano tutti insieme all'arrivo sul banco
      const prev = gl.getRenderTarget()
      gl.setRenderTarget(composer.current?.inputBuffer ?? null)
      const job = compileSafe(gl, scene, camera)   // traversata subito, compilazione in parallelo
      gl.setRenderTarget(prev)
      g.visible = was
      await job.catch(() => {})
      const texs = new Set<THREE.Texture>()
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material
        for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
          for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) texs.add(v as THREE.Texture)
        }
      })
      // una immagine per volta, quando il browser e' libero
      for (const tx of texs) {
        if (!alive) return
        await new Promise<void>((ok) => idle(ok))
        gl.initTexture(tx)
      }
      // e un fotogramma intero col banco acceso, ancora fuori dall'inquadratura: l'occlusione
      // (N8AO) e l'ombra del sole preparano i loro programmi la prima volta che lavorano,
      // e sul banco quella prima volta faceva scattare l'arrivo
      await new Promise<void>((ok) => idle(ok))
      const c = composer.current
      const tg = table.current
      if (!alive || !c || !tg || tg.visible) return
      const before = c.passes.map((p) => p.enabled)
      tg.visible = true
      c.passes.forEach((p) => { p.enabled = true })
      gl.shadowMap.needsUpdate = true
      c.render()
      tg.visible = false
      c.passes.forEach((p, i) => { p.enabled = before[i] })
      gl.shadowMap.needsUpdate = true
    })
    t = window.setTimeout(attempt, 800)
    return () => { alive = false; window.clearTimeout(t) }
  }, [ready, gl, scene, camera, table, composer])
  return null
}

function World(props: Props & { images: Images | null; level: QualityLevel; onSlow: () => void }) {
  const { mobile, level } = props
  const look = useRef(new THREE.Vector3(0, 0, 0))
  const logo = useRef<THREE.Group>(null)
  const table = useRef<THREE.Group>(null)
  const composer = useRef<Composer>(null)

  return (
    <>
      <Rig phase={props.phase} mobile={mobile} stage={props.stage} look={look} logo={logo} />

      {/* luce: lo studio fotografico (HDR CC0 di Poly Haven) e una lampada da banco calda
          che fa l'ombra del tavolo sul pavimento */}
      <Suspense fallback={null}>
        <Environment files={`${TEX}/studio.hdr`} environmentIntensity={1.0} />
      </Suspense>
      <ambientLight intensity={0.12} />
      {/* la lampada da banco: una pozza di luce calda sugli oggetti, i bordi del banco piu' scuri */}
      <spotLight position={[-1.6, 6.5, 3.2]} angle={0.62} penumbra={0.85} decay={2} intensity={95} color="#ffd8b0" />
      <directionalLight
        position={[-8, 15, 5]}
        intensity={2.3}
        color="#fff1df"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-far={50}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[5, 4, 4]} intensity={0.45} color="#dfe8ff" />

      {/* il logo di vetro, in cima al mondo (Rig lo mette all'altezza della prima schermata):
          si carica subito, e' la prima cosa che si vede */}
      <group ref={logo}>
        <Suspense fallback={null}>
          <LogoModel inWorld scale={mobile ? 0.75 : 1} />
        </Suspense>
        <GlassSync />
      </group>

      <group ref={table}>
        {props.images && <Suspense fallback={null}><Table {...props} images={props.images} /></Suspense>}
      </group>
      <Budget stage={props.stage} table={table} composer={composer} onSlow={props.onSlow} />
      <Warmup table={table} ready={!!props.images} composer={composer} />

      {/* come in un render: occlusione negli angoli e vignettatura. Niente grana qui:
          sgranava il logo (la grana del sito e' gia' sopra tutta la pagina) */}
      {/* niente messa a fuoco: costava piu' di tutto il resto e faceva scattare lo scroll */}
      <EffectComposer ref={composer} multisampling={level.msaa}>
        <N8AO aoRadius={0.5} distanceFalloff={0.5} intensity={AO_INTENSITY} quality={level.ao} halfRes />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.25} darkness={0.55} />
        {/* il fondale: la piscina rosata, dietro al tavolo e alle cose che ha sopra */}
        <WorldBackdrop mobile={mobile} />
      </EffectComposer>
    </>
  )
}

export default function Table3D(props: Props) {
  // Il banco (texture, scritte, font) si carica avvicinandosi alla sezione, o
  // appena la pagina e' pronta: in cima basta il logo nell'aria
  const [near, setNear] = useState(false)
  useEffect(() => {
    if (near) return
    const check = () => {
      const r = props.stage.current?.getBoundingClientRect()
      if (r && r.top < window.innerHeight * 2.5) setNear(true)
    }
    check()
    // la camera vede il banco gia' dalla seconda sezione: lo si carica comunque appena la pagina e' ferma
    const idle = window.setTimeout(() => setNear(true), 2500)
    window.addEventListener('scroll', check, { passive: true })
    return () => { window.clearTimeout(idle); window.removeEventListener('scroll', check) }
  }, [near, props.stage])

  // Le scritte sono disegnate con i font del sito e il logo: si aspetta che siano pronti
  const [images, setImages] = useState<Images | null>(null)
  useEffect(() => {
    if (!near) return
    let alive = true
    Promise.all([
      document.fonts.ready,
      loadImage('/artismi-logo.png'),
      loadImage(`${TEX}/paper_color.webp`),
      loadImage(`${TEX}/metal_color.webp`),
    ]).then(([, logo, paper, metal]) => {
      if (alive) setImages({ logo, paper, metal })
    })
    return () => { alive = false }
  }, [near])

  // con la pagina di un lavoro aperta sopra la home il mondo resta pronto ma non si
  // vede e non disegna: al ritorno e' gia' li', senza ricaricarsi
  const away = useStore((s) => s.away)

  // la fascia di qualita': da computer l'alta, da telefono la media; scende da sola se
  // non regge (Budget). ?quality=high|medium|low la fissa, per provare
  const [fixed] = useState<Quality | null>(() => {
    const q = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('quality')
    return q === 'high' || q === 'medium' || q === 'low' ? q : null
  })
  const [quality, setQuality] = useState<Quality>(fixed ?? (props.mobile ? 'medium' : 'high'))
  const level = QUALITY[props.mobile ? 'mobile' : 'desktop'][quality]
  const onSlow = useCallback(() => { if (!fixed) setQuality((q) => LOWER[q]) }, [fixed])

  return createPortal(
    <div className={styles.world} aria-hidden="true" style={away ? { visibility: 'hidden' } : undefined}>
      <WaterCanvas mobile={props.mobile} />
      <Canvas
        frameloop={away ? 'never' : 'demand'}
        shadows="soft"
        dpr={level.dpr}
        camera={{ fov: 30, position: [0.15, 40, 30], near: 0.1, far: 200 }}
        // trasparente: dietro c'e' l'acqua, sul suo canvas (WaterCanvas)
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          // il controllo degli errori dei programmi aspetta che la scheda video li abbia
          // compilati, e intanto la pagina si blocca: serve solo mentre si sviluppa
          gl.debug.checkShaderErrors = process.env.NODE_ENV !== 'production'
          // da computer, con una scheda video integrata, si parte dalla fascia media
          if (props.mobile || fixed) return
          const ctx = gl.getContext()
          const info = ctx.getExtension('WEBGL_debug_renderer_info')
          const gpu = info ? String(ctx.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
          if (/Intel|SwiftShader|llvmpipe|Basic Render/i.test(gpu) && !/Arc/i.test(gpu)) setQuality((q) => (q === 'high' ? 'medium' : q))
        }}
        eventSource={document.body}
        eventPrefix="client"
      >
        <World {...props} images={images} level={level} onSlow={onSlow} />
      </Canvas>
    </div>,
    document.body,
  )
}
