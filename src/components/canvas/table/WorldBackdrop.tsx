'use client'

/**
 * Il fondale del mondo: la piscina rosata (lo shader di CausticsPlane).
 *
 * E' un effetto di post-produzione, applicato per ultimo e solo dove non c'e'
 * niente davanti (profondita' vuota): il tavolo e le cose che ha sopra hanno i
 * loro colori, e il rosa resta identico a quello di sempre, senza la
 * correzione colore da render che lo smorzava. E' lo stesso per tutta la
 * pagina (il mondo e' uno solo) e scorre piano con lo scroll, come uno sfondo
 * lontano.
 *
 * Il mondo disegna solo a richiesta: per far muovere l'acqua lo si ridisegna
 * circa 24 volte al secondo, mai con la pagina nascosta o il gioco aperto.
 */

import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Effect, EffectAttribute } from 'postprocessing'
import * as THREE from 'three'
import { causticsFragment } from '../CausticsPlane'
import { useStore } from '@/stores/useStore'
import { BENCH } from './Bench'

// lo shader della piscina diventa una funzione; le uv riproducono la scala che
// aveva sul piano 16 × 10 a 7,5 di distanza (fov 35) nella scena del logo
// la scala segue lo schermo come faceva la scena del logo (ResponsiveCamera): sotto
// il 16:9 la camera allargava l'inquadratura e il disegno dell'acqua si faceva piu' fitto
const common = causticsFragment
  .replace(/varying vec2\s+vUv;/, '')
  .replace('void main() {', 'vec4 causticsColor(vec2 vUv) {')
  .replace('gl_FragColor = vec4(col, u_fade);', 'return vec4(col, u_fade);') + /* glsl */`
  vec3 srgbToLinearBg(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
  }
  uniform float u_scroll;
  uniform vec2 u_scale;
  vec3 backdrop(vec2 uv) {
    return srgbToLinearBg(causticsColor(0.5 + (uv - 0.5) * u_scale + vec2(0.0, u_scroll)).rgb);
  }
`

const fragment = common + /* glsl */`
  uniform mat4 u_invProj;
  uniform mat4 u_camWorld;
  uniform vec2 u_bench;   // meta' larghezza e meta' profondita' del piano del banco
  uniform vec2 u_band;    // quanto e' larga la sfumatura sui lati e davanti/dietro
  uniform float u_top;    // sotto questa altezza si sfuma: il banco, e sul computer anche le cose sopra
  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    if (depth >= 0.99999) {
      outputColor = vec4(backdrop(uv), 1.0);
      return;
    }
    // il banco sfuma nel fondale vicino ai bordi, invece di finire con un taglio:
    // dalla profondita' si risale al punto del mondo e si misura quanto dista dal bordo
    vec4 v = u_invProj * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec3 p = (u_camWorld * vec4(v.xyz / v.w, 1.0)).xyz;
    float k = 1.0;
    if (p.y < u_top) {
      float e = min((u_bench.x - abs(p.x)) / u_band.x, (u_bench.y - abs(p.z)) / u_band.y);
      k = smoothstep(0.0, 1.0, e);
    }
    if (k >= 1.0) { outputColor = inputColor; return; }
    vec3 bg = backdrop(uv);
    outputColor = vec4(mix(bg, inputColor.rgb, k), 1.0);
  }
`

/** I valori dell'acqua, gli stessi per il fondale e per il pezzo dietro al logo */
const water = {
  u_time: new THREE.Uniform(0),
  u_fade: new THREE.Uniform(1),
  u_white: new THREE.Uniform(0),
  u_res: new THREE.Uniform(new THREE.Vector2(1, 1)),
  u_scroll: new THREE.Uniform(0),
  u_scale: new THREE.Uniform(new THREE.Vector2(1, 1)),
}

/** La scala della scena del logo di una volta: piano 16 × 10 a 7,5 di distanza, fov 35 (piu' largo sotto il 16:9) */
function waterScale(w: number, h: number, out: THREE.Vector2) {
  const a = w / Math.max(1, h)
  const ref = 16 / 9, base = THREE.MathUtils.degToRad(35)
  let fov = base
  if (a < ref) {
    const hFov = 2 * Math.atan(Math.tan(base / 2) * ref)
    fov = Math.min(2 * Math.atan(Math.tan(hFov / 2) / a), THREE.MathUtils.degToRad(65))
  }
  const visH = 2 * 7.5 * Math.tan(fov / 2)
  return out.set(visH * a / 16, visH / 10)
}

class BackdropEffect extends Effect {
  constructor() {
    super('BackdropEffect', fragment, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, THREE.Uniform>([
        ...Object.entries(water),
        ['u_invProj', new THREE.Uniform(new THREE.Matrix4())],
        ['u_camWorld', new THREE.Uniform(new THREE.Matrix4())],
        ['u_bench', new THREE.Uniform(new THREE.Vector2(BENCH.w / 2, BENCH.d / 2))],
        ['u_band', new THREE.Uniform(new THREE.Vector2(2.2, 1.1))],
        ['u_top', new THREE.Uniform(0.7)],
      ]),
    })
  }
}

/** Va messo dentro <EffectComposer>, per ultimo */
export function WorldBackdrop({ mobile = false }: { mobile?: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  const effect = useMemo(() => new BackdropEffect(), [])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden && !useStore.getState().gameOpen) invalidate()
    }, 42)
    return () => { window.clearInterval(id); effect.dispose() }
  }, [invalidate, effect])

  useFrame(({ size, camera }, delta) => {
    const u = effect.uniforms
    camera.updateMatrixWorld()   // la camera si e' appena mossa (Rig): niente bordo in ritardo di un fotogramma
    ;(u.get('u_invProj')!.value as THREE.Matrix4).copy(camera.projectionMatrixInverse)
    ;(u.get('u_camWorld')!.value as THREE.Matrix4).copy(camera.matrixWorld)
    water.u_time.value += Math.min(delta, 0.1)
    water.u_res.value.set(size.width, size.height)
    waterScale(size.width, size.height, water.u_scale.value)
    // da telefono la camera e' vicina e il banco riempie lo schermo: una fascia
    // larga come sul computer coprirebbe di rosa il fascicolo e il Game Boy
    ;(u.get('u_band')!.value as THREE.Vector2).set(mobile ? 0.8 : 2.2, mobile ? 0.3 : 1.1)
    // e da telefono sfuma solo il banco con il tappetino e il righello (fino a 2 cm): fascicolo e Game Boy
    // arrivano fino al bordo e restano interi
    u.get('u_top')!.value = mobile ? 0.02 : 0.7
    // l'acqua scorre con la pagina, piu' piano del mondo: e' lontana
    water.u_scroll.value = window.scrollY / Math.max(1, size.height) * 0.12
  }, 0.6) // dopo Rig e Budget, prima del composer

  return <primitive object={effect} dispose={null} />
}

/**
 * Il vetro del logo, nel mondo: il fondale vero arriva alla fine e solo dove
 * non c'e' niente davanti, quindi il vetro non avrebbe il rosa dietro di se'
 * (sembrava plastica bianca). Allora il vetro si fonde da solo con il rosa che
 * c'e' in quel punto dello schermo, come faceva nella sua scena di una volta:
 * prima la correzione colore (ACES) sul vetro, poi la fusione, e infine
 * l'inversa della correzione, che il composer riapplica identica.
 */
export const glassUniforms = { ...water, u_px: new THREE.Uniform(new THREE.Vector2(1, 1)) }

export const glassPars = common + /* glsl */`
  uniform vec2 u_px;
  const mat3 PV_IN = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 PV_OUT = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  const mat3 PV_IN_INV = mat3(vec3(1.764741, -0.147028, -0.036337), vec3(-0.675778, 1.160252, -0.162436), vec3(-0.088963, -0.013224, 1.198773));
  const mat3 PV_OUT_INV = mat3(vec3(0.643038, 0.059269, 0.005962), vec3(0.311187, 0.931436, 0.063929), vec3(0.045775, 0.009295, 0.930118));
  vec3 pvToSrgb(vec3 c) {
    c = clamp(c, 0.0, 1.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }
  vec3 pvAces(vec3 c) {
    c = PV_IN * (c / 0.6);
    c = (c * (c + 0.0245786) - 0.000090537) / (c * (0.983729 * c + 0.4329510) + 0.238081);
    return clamp(PV_OUT * c, 0.0, 1.0);
  }
  vec3 pvAcesInv(vec3 y) {
    vec3 v = clamp(PV_OUT_INV * clamp(y, 0.0, 0.985), 0.0, 0.99);
    vec3 A = 1.0 - 0.983729 * v, B = 0.0245786 - 0.4329510 * v, C = -0.000090537 - 0.238081 * v;
    vec3 x = (-B + sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
    return PV_IN_INV * x * 0.6;
  }
`

/** Va in fondo al fragment del vetro (dopo dithering_fragment) */
export const glassComposite = /* glsl */`
  {
    // come sulla tela di una volta: fusione sui colori gia' pronti per lo schermo (sRGB)
    vec3 bgc = pvToSrgb(backdrop(gl_FragCoord.xy / u_px));
    vec3 g = pvToSrgb(pvAces(gl_FragColor.rgb));
    // sulla tela di una volta si vedevano anche i fianchi delle lettere dietro al fronte:
    // due strati di vetro, piu' bianchi di uno
    float a2 = 1.0 - (1.0 - gl_FragColor.a) * (1.0 - gl_FragColor.a);
    gl_FragColor = vec4(pvAcesInv(srgbToLinearBg(mix(bgc, g, a2))), 1.0);
  }
`

/** Tiene aggiornata la misura del buffer per il vetro */
export function GlassSync() {
  const gl = useThree((s) => s.gl)
  useFrame(() => { gl.getDrawingBufferSize(glassUniforms.u_px.value) })
  return null
}
