import type * as THREE from 'three'

/**
 * La bilia: una sola, di vetro trasparente, sempre la stessa. Nasce come
 * pallino della i del logo (LogoModel); appena compare il testo si stacca e da
 * li' vive su un unico piano di gioco, tutta la pagina, banco compreso
 * (MarblePage): rotola, salta, si tira con la fionda, e scorrendo i bordi dello
 * schermo se la portano dietro. Sul banco il 3D le dice solo dove sono le cose
 * (il fascicolo e il Game Boy sono ostacoli; Marble3D li misura sullo schermo).
 *
 * mode:
 * - logo:    e' il pallino della i, la disegna LogoModel
 * - page:    e' sul piano di gioco (pagina e banco), la disegna MarblePage
 * - board:   e' dentro il fascicolo aperto: la muove la mappa di PortfolioSection
 *            (la disegna la mappa con la tavola piatta sulla pagina, se no MarblePage)
 * - console: e' sul Game Boy, che si e' acceso ed e' in mano
 */
export type MarbleMode = 'logo' | 'page' | 'board' | 'console'

/** un punto sullo schermo (px) e quanto e' grande li' la bilia; ok: e' stato misurato */
export type Spot = { x: number; y: number; r: number; ok: boolean }
/** un ostacolo sul banco: i quattro angoli della sua base, in coordinate della pagina */
export type Quad = { x: number; y: number }[]

export const marble: {
  mode: MarbleMode
  /** la sfera del logo (LogoModel): si vede solo in modalita' logo */
  logoBall: THREE.Object3D | null
  /** dentro il fascicolo: dove sta sul tabellone (u, v tra 0 e 1, v = 0 in alto) e
   *  quanto e' alta nel salto (in larghezze del tabellone). Lo scrive PortfolioSection */
  board: { u: number; v: number; lift: number }
  /** sullo schermo, aggiornati da Marble3D a ogni fotogramma del 3D: la bilia della i,
   *  la bilia sul tabellone (marble.board), il centro del tabellone, sopra il Game Boy,
   *  e dove si scende dal Game Boy */
  logoAt: Spot
  boardAt: Spot
  boardMid: Spot
  consoleAt: Spot
  consoleOut: Spot
  /** il fascicolo e il Game Boy sul banco, come ostacoli (null se il banco non c'e') */
  obstacles: { folder: Quad | null; console: Quad | null }
  /** a che punto e' il fascicolo, e se il Game Boy e' in mano (da Table3D) */
  phase: string
  grab: boolean
  /** il mouse e' sul fascicolo o sul Game Boy: il clic e' loro */
  hover: { folder: boolean; console: boolean } | null
  /** la sezione del banco (PortfolioSection), per sapere quando e' sullo schermo */
  stage: HTMLElement | null
  /** il Game Boy e' stato cliccato: se la bilia e' sul banco ci salta sopra e lo
   *  accende lei all'atterraggio (true), altrimenti false e si accende subito.
   *  Lo prepara MarblePage */
  toConsole: (() => boolean) | null
  /** la bilia e' atterrata sul Game Boy: si accende (da Table3D) */
  onConsole: (() => void) | null
  /** quando e' stato cliccato il fascicolo o il Game Boy: quel clic e' loro, la bilia non ci salta */
  clickedAt: number
  /** ridisegna il 3D (la bilia della i torna visibile) */
  invalidate: (() => void) | null
} = {
  mode: 'logo', logoBall: null, board: { u: 0.5, v: 0.5, lift: 0 },
  logoAt: spot(), boardAt: spot(), boardMid: spot(), consoleAt: spot(), consoleOut: spot(),
  obstacles: { folder: null, console: null },
  phase: 'closed', grab: false, hover: null, stage: null,
  toConsole: null, onConsole: null, clickedAt: 0, invalidate: null,
}

function spot(): Spot { return { x: 0, y: 0, r: 10, ok: false } }
