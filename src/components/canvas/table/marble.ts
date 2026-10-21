import type * as THREE from 'three'

/**
 * La bilia: una sola, di vetro ambra. Nasce come pallino della i del logo
 * (LogoModel), poi scendendo nella pagina cade sul banco e ci rotola (Marble3D).
 * Il cursore del sito e' il suo mirino.
 *
 * mode:
 * - logo:    e' il pallino della i, la disegna LogoModel
 * - fall:    cade dal cielo sul banco
 * - roll:    rotola (o sta ferma) sul banco
 * - jump:    salta verso un punto (un clic, il fascicolo, il Game Boy)
 * - board:   e' dentro il fascicolo aperto: la mappa la disegna PortfolioSection
 * - console: e' sul Game Boy, che si e' acceso ed e' in mano
 */
export type MarbleMode = 'logo' | 'fall' | 'roll' | 'jump' | 'board' | 'console'

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
} = { mode: 'logo', logoBall: null, toConsole: null, board: { u: 0.5, v: 0.5, lift: 0 } }
