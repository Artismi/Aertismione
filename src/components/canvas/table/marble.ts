import type * as THREE from 'three'

/**
 * La bilia: una sola, di vetro ambra. Nasce come pallino della i del logo
 * (LogoModel); appena compare il testo salta sulla pagina e segue il cursore
 * (MarblePage, fuori dal 3D: leggera e fluida); arrivati al banco ci cade dentro
 * e ci rotola (Marble3D).
 *
 * mode:
 * - logo:    e' il pallino della i, la disegna LogoModel
 * - page:    e' sulla pagina, sopra il testo: la disegna MarblePage (anche nei
 *            salti fra la i, la pagina e il banco)
 * - fall:    cade dal cielo sul banco
 * - roll:    rotola (o sta ferma) sul banco
 * - jump:    salta verso un punto (un clic, il fascicolo, il Game Boy)
 * - board:   e' dentro il fascicolo aperto: la mappa la disegna PortfolioSection
 * - console: e' sul Game Boy, che si e' acceso ed e' in mano
 */
export type MarbleMode = 'logo' | 'page' | 'fall' | 'roll' | 'jump' | 'board' | 'console'

export const marble: {
  mode: MarbleMode
  /** la sfera del logo (LogoModel): si vede solo in modalita' logo */
  logoBall: THREE.Object3D | null
  /** il Game Boy e' stato cliccato: se la bilia e' sul banco ci salta sopra e lo
   *  accende lei all'atterraggio (true), altrimenti false e si accende subito */
  toConsole: (() => boolean) | null
  /** dentro il fascicolo: dove sta sul tabellone (u, v tra 0 e 1, v = 0 in alto) e
   *  quanto e' alta nel salto (in larghezze del tabellone). Lo scrive PortfolioSection */
  board: { u: number; v: number; lift: number }
  /** dove si vedono sullo schermo (px, raggio in px) la bilia della i, il punto del banco
   *  dove si posa e la bilia sul banco; li aggiorna Marble3D a ogni fotogramma del 3D */
  logoAt: Spot
  landAt: Spot
  benchAt: Spot
  /** la bilia sul banco si puo' prendere: fascicolo chiuso, Game Boy giu', fionda non tesa */
  benchFree: boolean
  /** la sezione del banco (PortfolioSection), per sapere quando e' sullo schermo */
  stage: HTMLElement | null
  /** MarblePage la posa sul banco: Marble3D la fa cadere li' con un piccolo rimbalzo */
  enterBench: (() => void) | null
  /** ridisegna il 3D (la bilia della i torna visibile) */
  invalidate: (() => void) | null
} = {
  mode: 'logo', logoBall: null, toConsole: null, board: { u: 0.5, v: 0.5, lift: 0 },
  logoAt: spot(), landAt: spot(), benchAt: spot(),
  benchFree: false, stage: null, enterBench: null, invalidate: null,
}

export type Spot = { x: number; y: number; r: number; ok: boolean }
function spot(): Spot { return { x: 0, y: 0, r: 10, ok: false } }
