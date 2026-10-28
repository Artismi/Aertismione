/**
 * Copia in public/ar/shared/ i moduli che la pagina AR del biglietto condivide
 * con la home (il vetro del logo e l'acqua: src/shaders/logoGlass.js).
 * La pagina AR e' statica e non passa dal bundler del sito: legge la copia.
 *
 *   node scripts/sync-ar-shared.mjs          (lo lanciano gia' dev e build)
 *   node scripts/sync-ar-shared.mjs --check  (esce con errore se la copia e' vecchia)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILES = ['logoGlass.js']
const HEAD = '// COPIA GENERATA da src/shaders/ con scripts/sync-ar-shared.mjs: non modificarla qui.\n'

let stale = false
for (const f of FILES) {
  const out = join(ROOT, 'public/ar/shared', f)
  const text = HEAD + readFileSync(join(ROOT, 'src/shaders', f), 'utf8')
  if (process.argv.includes('--check')) {
    if (!existsSync(out) || readFileSync(out, 'utf8') !== text) { console.error(`vecchia: public/ar/shared/${f}`); stale = true }
    continue
  }
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, text)
}
process.exit(stale ? 1 : 0)
