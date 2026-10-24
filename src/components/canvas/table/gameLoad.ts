/**
 * A che punto e' il caricamento di Porto Vecchio, per lo schermo del Game Boy sul
 * banco (Console3D): da computer lo dice il gioco, che si carica nascosto quando si
 * va sul Game Boy (GameBoy); da telefono lo scaricamento dei suoi file (PortfolioSection).
 * p tra 0 e 1; ready = si puo' giocare subito. onChange: chi lo aggiorna avvisa lo
 * schermo, che si ridisegna anche se il 3D e' fermo.
 */
export const gameLoad: { p: number; ready: boolean; onChange: (() => void) | null } = { p: 0, ready: false, onChange: null }
