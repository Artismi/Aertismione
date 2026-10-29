/**
 * L'elettronica dentro la console di Porto Vecchio, disegnata su una tela: la
 * stessa per il Game Boy 3D sul banco (pcbTexture in textures.ts) e per quello
 * a tutto schermo (GameBoy), che la mostra sotto la plastica rosa trasparente.
 * Niente Three qui: la pagina del gioco non lo scarica.
 */

export function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Scheda elettronica: piste dorate, piazzole, serigrafia (W×H, disegnata per 1024×1024) */
export function pcbPaint(ctx: CanvasRenderingContext2D, W: number, H: number, mono: string) {
  const rand = rng(31)
  ctx.fillStyle = '#26322C'; ctx.fillRect(0, 0, W, H)
  ctx.lineCap = 'round'
  for (let i = 0; i < 180; i++) {
    let x = rand() * W, y = rand() * H
    ctx.strokeStyle = `rgba(214,180,96,${0.35 + rand() * 0.4})`
    ctx.lineWidth = 2 + rand() * 4
    ctx.beginPath(); ctx.moveTo(x, y)
    for (let s = 0; s < 4; s++) {
      const len = 30 + rand() * 160
      const dir = Math.floor(rand() * 8) * Math.PI / 4
      x += Math.cos(dir) * len; y += Math.sin(dir) * len
      ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.fillStyle = 'rgba(226,196,110,0.9)'
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill()
  }
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = 'rgba(226,196,110,0.8)'
    ctx.fillRect(rand() * W, rand() * H, 6, 10)
  }
  ctx.fillStyle = 'rgba(240,240,255,0.7)'
  ctx.font = `700 22px ${mono}`
  ctx.fillText('PV-86 REV.B', 60, 80)
  ctx.fillText('ARTISMI ✦ 2026', W - 260, H - 50)
  ctx.fillText('C12  R4  U3', 420, 520)
}

/**
 * Per il Game Boy a tutto schermo: la scheda con sopra i chip neri coi piedini
 * (nel 3D sono pezzi a parte), sfocata come la si vede attraverso la plastica.
 * Un'immagine sola, fatta una volta: l'URL (da liberare con
 * URL.revokeObjectURL), o null se il browser non sa farla.
 */
export function plasticInside(mono: string): Promise<string | null> {
  const S = 1024
  const c = document.createElement('canvas'); c.width = S; c.height = S
  const ctx = c.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  pcbPaint(ctx, S, S, mono)
  const chip = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = 'rgba(200,200,205,0.85)'
    for (let i = 8; i < w - 4; i += 12) { ctx.fillRect(x + i, y - 6, 5, 6); ctx.fillRect(x + i, y + h, 5, 6) }
    const g = ctx.createLinearGradient(x, y, x, y + h)
    g.addColorStop(0, '#2a272e'); g.addColorStop(1, '#141218')
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, y, w, 3)
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(x + 10, y + 10, 4, 0, Math.PI * 2); ctx.fill()
  }
  chip(560, 180, 170, 170); chip(160, 600, 110, 80); chip(700, 640, 90, 60); chip(250, 250, 120, 60)
  // la plastica spessa sfoca un poco quello che c'e' sotto
  const out = document.createElement('canvas'); out.width = S; out.height = S
  const o = out.getContext('2d')
  if (!o) return Promise.resolve(null)
  o.filter = 'blur(2.5px)'
  o.drawImage(c, 0, 0)
  return new Promise((done) => {
    try { out.toBlob((b) => done(b ? URL.createObjectURL(b) : null), 'image/webp', 0.82) } catch { done(null) }
  })
}
