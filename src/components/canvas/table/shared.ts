/**
 * I due segnali che la pagina e il mondo 3D si scambiano. Stanno qui, in un file
 * senza three.js, perche' la pagina li legge senza tirarsi dietro tutto il 3D
 * (Table3D si carica a parte, quando serve).
 */

/**
 * Con il fascicolo aperto e la camera ferma la tavola si mostra come immagine
 * sulla pagina (PortfolioSection): il mondo 3D puo' restare fermo. Quando
 * `on`, nessuno lo ridisegna (acqua, mouse, tavola).
 */
export const worldHold = { on: false }

/**
 * Dove sta lo schermo del Game Boy sulla pagina, in pixel: da li' nasce il gioco
 * a tutto schermo. Lo aggiorna Console3D a ogni fotogramma.
 */
export const consoleScreen: { rect: { top: number; left: number; width: number; height: number } | null } = { rect: null }

/**
 * Lo scroll della pagina quando il 3D ha misurato il logo sullo schermo (u_logo).
 * Il canvas dell'acqua si ridisegna anche quando il 3D e' fermo: la luce intorno
 * al logo la sposta lui, di quanto la pagina e' scorsa da allora.
 */
export const logoSeen = { scroll: 0 }

/**
 * Il mondo 3D serve solo dove si vede qualcosa: il logo in cima, il banco nella
 * sua sezione. Altrove la pagina mostra solo l'acqua (WaterCanvas) e il 3D non si
 * ridisegna, ne' per lo scroll ne' per il mouse. Con un margine, perche' entrando
 * la camera sia gia' al suo posto.
 */
export function worldNear(stage: HTMLElement | null | undefined) {
  const vh = window.innerHeight
  if (window.scrollY < vh * 1.3) return true
  const r = stage?.getBoundingClientRect()
  return !!r && r.bottom > -vh * 0.5 && r.top < vh * 1.5
}
