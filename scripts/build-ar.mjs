/**
 * build-ar.mjs — prepara i file della pagina /ar (l'ologramma del QR).
 *
 *   node scripts/build-ar.mjs
 *
 * 1. Prende public/models/logo.glb (7 MB, pensato per la home) e ne fa
 *    public/ar/logo.glb: trasformazioni cotte nella mesh, girato verso chi
 *    guarda come fa LogoModel, centrato, geometria compressa Draco (~300 KB).
 *    Chi arriva dal QR e' quasi sempre in rete mobile: meglio non fargli
 *    scaricare 7 MB. Il materiale nel file non conta: la pagina lo sostituisce
 *    con lo shader della home (components/canvas/logoHologram.ts).
 * 2. Genera il QR stampabile che porta a /ar, in SVG e PNG.
 */

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions'
import { flatten, clearNodeTransform, weld, dedup, prune, getBounds, transformMesh } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import QRCode from 'qrcode'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/ar')

/** Indirizzo a cui punta il QR. */
const AR_URL = 'https://artismi.it/ar'
/** Larghezza del logo nel file, in unita'. */
const WIDTH_M = 0.4
const INK = '#1A1A1A'
const PAPER = '#F5F0E8'

async function buildModel() {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    })

  const doc = await io.read(path.join(ROOT, 'public/models/logo.glb'))
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]

  // Cuoce le trasformazioni dei nodi nei vertici.
  await doc.transform(flatten())
  for (const node of doc.getRoot().listNodes()) {
    if (node.getMesh()) clearNodeTransform(node)
  }

  // Scala reale, centrato su X/Z, base a terra, e girato di 180° come fa
  // LogoModel nel sito: cosi' la scritta guarda verso chi la inquadra (+Z).
  const b = getBounds(scene)
  const s = WIDTH_M / (b.max[0] - b.min[0])
  const cx = (b.min[0] + b.max[0]) / 2
  const cz = (b.min[2] + b.max[2]) / 2
  // prettier-ignore
  const matrix = [
    -s, 0,  0, 0,
     0, s,  0, 0,
     0, 0, -s, 0,
    cx * s, -b.min[1] * s, cz * s, 1,
  ]
  for (const mesh of doc.getRoot().listMeshes()) transformMesh(mesh, matrix)

  await doc.transform(weld(), dedup(), prune())
  doc.createExtension(KHRDracoMeshCompression).setRequired(true)

  await mkdir(OUT, { recursive: true })
  const file = path.join(OUT, 'logo.glb')
  await io.write(file, doc)

  const out = getBounds(scene)
  const size = out.max.map((v, i) => (v - out.min[i]).toFixed(3))
  console.log(`public/ar/logo.glb  ${size.join(' x ')} m`)
}

async function buildQr() {
  const opts = { errorCorrectionLevel: 'M', margin: 4, color: { dark: INK, light: PAPER } }
  await writeFile(path.join(OUT, 'qr-ar.svg'), await QRCode.toString(AR_URL, { ...opts, type: 'svg' }))
  await QRCode.toFile(path.join(OUT, 'qr-ar.png'), AR_URL, { ...opts, width: 1200 })
  console.log(`public/ar/qr-ar.svg, qr-ar.png  -> ${AR_URL}`)
}

await buildModel()
await buildQr()
