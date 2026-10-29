/**
 * Il logo del biglietto in realtà aumentata (public/ar/assets/logo-ar.glb),
 * ricavato dal logo della home (public/models/logo.glb).
 *
 *   node scripts/build-logo-ar.mjs
 *
 * Rilancialo ogni volta che cambia il logo della home: alla fine del volo il logo
 * AR si posa esattamente su quello della home e ci si dissolve sopra, quindi
 * devono essere lo stesso disegno, nella stessa posizione.
 *
 * La pagina AR legge una mesh sola, con posizioni, normali e uv:
 *  - la mesh delle lettere resta nel suo nodo, con la sua trasformazione (è da lì
 *    che la pagina AR calcola il passaggio alla scena della home);
 *  - i pallini delle i (nodi "pallino" e "pallino-i") diventano sfere di vetro,
 *    come le fa la home (LogoModel.tsx), unite alla mesh delle lettere;
 *  - con il primo uv della home (la mappa del ripieno del vetro, logo-ripieno.png;
 *    le sfere hanno uv -1, fuori dalla mappa, come in LogoModel.tsx), semplificata
 *    e compressa: sul telefono arriva in un attimo.
 */
import { NodeIO, Logger } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dequantize, weld, simplify, prune, meshopt } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'public', 'models', 'logo.glb')
const OUT = join(ROOT, 'public', 'ar', 'assets', 'logo-ar.glb')

// frazione di triangoli da tenere e errore massimo (frazione del raggio del logo)
const SIMPLIFY = { ratio: 0.3, error: 0.0004 }
// la stessa sfera della home: SphereGeometry(r, 48, 32), r = lato medio del pallino / 2 × 1,1
const SPHERE = { width: 48, height: 32, grow: 1.1 }

/* ─── Piccola algebra: trasformazione TRS di un nodo glTF ─────────────────── */

function rotate([qx, qy, qz, qw], [x, y, z]) {
  // v' = v + 2w (q × v) + 2 q × (q × v)
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x)
  return [
    x + qw * tx + (qy * tz - qz * ty),
    y + qw * ty + (qz * tx - qx * tz),
    z + qw * tz + (qx * ty - qy * tx),
  ]
}
const conj = ([x, y, z, w]) => [-x, -y, -z, w]
const norm = ([x, y, z]) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l] }

/** Dallo spazio del nodo alla scena: T · R · S */
function toScene(node, p) {
  const s = node.getScale(), t = node.getTranslation()
  const r = rotate(node.getRotation(), [p[0] * s[0], p[1] * s[1], p[2] * s[2]])
  return [r[0] + t[0], r[1] + t[1], r[2] + t[2]]
}
/** Dalla scena allo spazio del nodo: S⁻¹ · R⁻¹ · (p − T) */
function fromScene(node, p) {
  const s = node.getScale(), t = node.getTranslation()
  const r = rotate(conj(node.getRotation()), [p[0] - t[0], p[1] - t[1], p[2] - t[2]])
  return [r[0] / s[0], r[1] / s[1], r[2] / s[2]]
}
/** Normale dalla scena allo spazio del nodo: (M⁻ᵀ)⁻¹ = Mᵀ = S · R⁻¹ */
function normalFromScene(node, n) {
  const s = node.getScale()
  const r = rotate(conj(node.getRotation()), n)
  return norm([r[0] * s[0], r[1] * s[1], r[2] * s[2]])
}

/** Dove sta il pallino nella scena, e quanto è grande la sua sfera (come in LogoModel.tsx) */
function sferaDelPallino(node) {
  const pos = node.getMesh().listPrimitives()[0].getAttribute('POSITION')
  const lo = pos.getMin([]), hi = pos.getMax([])
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) {
    const p = toScene(node, [x, y, z])
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]) }
  }
  const size = max.map((v, k) => v - min[k])
  return {
    center: min.map((v, k) => (v + max[k]) / 2),
    radius: (Math.sqrt(size[0] * size[1]) / 2) * SPHERE.grow,
  }
}

/** Sfera UV come quella di three.js: posizioni e normali nella scena, triangoli */
function sfera({ center, radius }) {
  const pos = [], nrm = [], idx = [], grid = []
  for (let iy = 0, i = 0; iy <= SPHERE.height; iy++) {
    const v = iy / SPHERE.height, row = []
    for (let ix = 0; ix <= SPHERE.width; ix++, i++) {
      const u = ix / SPHERE.width
      const n = [
        -Math.cos(u * 2 * Math.PI) * Math.sin(v * Math.PI),
        Math.cos(v * Math.PI),
        Math.sin(u * 2 * Math.PI) * Math.sin(v * Math.PI),
      ]
      pos.push(center.map((c, k) => c + radius * n[k]))
      nrm.push(n)
      row.push(i)
    }
    grid.push(row)
  }
  for (let iy = 0; iy < SPHERE.height; iy++)
    for (let ix = 0; ix < SPHERE.width; ix++) {
      const a = grid[iy][ix + 1], b = grid[iy][ix], c = grid[iy + 1][ix], d = grid[iy + 1][ix + 1]
      if (iy !== 0) idx.push(a, b, d)
      if (iy !== SPHERE.height - 1) idx.push(b, c, d)
    }
  return { pos, nrm, idx }
}

const vertici = (prim) => prim.getAttribute('POSITION').getCount()
const kb = (bytes) => (bytes / 1024).toFixed(0) + ' KB'

async function main() {
  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready])
  const io = new NodeIO()
    .setLogger(new Logger(Logger.Verbosity.WARN))
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })

  const doc = await io.read(SRC)
  await doc.transform(dequantize())
  const root = doc.getRoot()
  const byName = (name) => {
    const n = root.listNodes().find((node) => node.getName() === name)
    if (!n) throw new Error(`nel logo manca il nodo "${name}"`)
    return n
  }

  const lettere = byName('aRTISMI 3D')
  const prim = lettere.getMesh().listPrimitives()[0]
  const vPrima = vertici(prim)
  for (const sem of prim.listSemantics()) if (!['POSITION', 'NORMAL', 'TEXCOORD_0'].includes(sem)) prim.setAttribute(sem, null)

  // le sfere si misurano prima di togliere i pallini
  const sfere = ['pallino', 'pallino-i'].map((name) => {
    const node = byName(name)
    const s = sferaDelPallino(node)
    node.getMesh().dispose()
    node.dispose()
    return s
  })

  // solo le lettere si semplificano: le sfere restano lisce
  await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ...SIMPLIFY }))
  const vLettere = vertici(prim)

  // le sfere entrano nella mesh delle lettere, portate nello spazio del suo nodo
  const P = Array.from(prim.getAttribute('POSITION').getArray())
  const N = Array.from(prim.getAttribute('NORMAL').getArray())
  const I = Array.from(prim.getIndices().getArray())
  const UV = Array.from(prim.getAttribute('TEXCOORD_0').getArray())
  for (const s of sfere) {
    const g = sfera(s), base = P.length / 3
    g.pos.forEach((p) => P.push(...fromScene(lettere, p)))
    g.nrm.forEach((n) => N.push(...normalFromScene(lettere, n)))
    g.pos.forEach(() => UV.push(-1, -1))
    g.idx.forEach((i) => I.push(base + i))
  }
  const buffer = root.listBuffers()[0]
  prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(P)).setBuffer(buffer))
  prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(N)).setBuffer(buffer))
  prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(UV)).setBuffer(buffer))
  prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(I)).setBuffer(buffer))

  // keepAttributes: il materiale non ha texture, e senza questo prune toglierebbe gli uv
  await doc.transform(prune({ keepAttributes: true }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }))
  await io.write(OUT, doc)

  console.log(
    `logo-ar.glb  lettere ${vPrima.toLocaleString()} → ${vLettere.toLocaleString()} vertici, ` +
    `+ 2 sfere (r ${sfere.map((s) => s.radius.toFixed(3)).join(', ')})  ·  ${kb(readFileSync(OUT).byteLength)}`
  )
}

main().catch((e) => { console.error(e); process.exit(1) })
