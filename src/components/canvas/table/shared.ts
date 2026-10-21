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
