/**
 * build-ar.mjs — prepara i file per la realta' aumentata.
 *
 *   node scripts/build-ar.mjs
 *
 * 1. Prende public/models/logo.glb (pensato per la scena del sito: 48 unita'
 *    di larghezza, materiale sostituito a runtime) e ne fa public/ar/logo.glb:
 *    trasformazioni cotte nella mesh, larghezza reale di 40 cm, appoggiato a
 *    terra e centrato, materiale "vetro ghiaccio" del sito in PBR standard
 *    (Scene Viewer e Quick Look non eseguono shader personalizzati),
 *    geometria compressa Draco.
 * 2. Genera il QR stampabile che porta a /ar, in SVG e PNG.
 *
 * Il file AR e' separato da quello del sito: Scene Viewer (Android) scarica il
 * GLB cosi' com'e', quindi scala e materiale devono stare dentro il file.
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
/** Larghezza reale del logo in AR, in metri. */
const WIDTH_M = 0.4
/** #9DD4EE, il ghiaccio del sito, in lineare. */
const ICE = [0.337, 0.665, 0.855, 1]
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

  for (const mat of doc.getRoot().listMaterials()) {
    mat
      .setName('Vetro ghiaccio')
      .setBaseColorFactor(ICE)
      .setMetallicFactor(0.15)
      .setRoughnessFactor(0.12)
      .setDoubleSided(true)
  }

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
