/**
 * Dove vive Porto Vecchio, in un posto solo: lo usano le regole di next.config.mjs
 * (/gioco/* e le due api del gioco passano di qui, e la sicurezza permette di
 * mostrarlo nel riquadro) e il Game Boy (content.ts, PROGETTI.game.url).
 * Se il gioco cambia indirizzo (un altro hosting, un dominio suo) basta la
 * variabile d'ambiente NEXT_PUBLIC_PORTO_VECCHIO_URL e una nuova pubblicazione.
 */
export const PORTO_VECCHIO = (process.env.NEXT_PUBLIC_PORTO_VECCHIO_URL || 'https://porto-vecchio.vercel.app').replace(/\/+$/, '')
