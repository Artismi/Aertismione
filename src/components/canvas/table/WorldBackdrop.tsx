'use client'

/**
 * Il fondale del mondo: la piscina rosata (lo shader di CausticsPlane).
 *
 * L'acqua si disegna da sola, su un suo canvas dietro al 3D (WaterCanvas): un
 * passaggio solo, leggero. Prima era l'ultimo effetto del composer, e per farla
 * muovere si ridisegnava 24 volte al secondo tutto il mondo, banco, ombre,
 * occlusione e plastica del Game Boy comprese. Ora il 3D e' trasparente dove
 * non c'e' niente e si ridisegna solo quando qualcosa cambia.
 *
 * Questo effetto resta per l'ultimo tocco del 3D: dove non c'e' niente lo lascia
 * trasparente, e vicino ai bordi il banco sfuma nell'acqua che sta dietro.
 * Il vetro del logo invece l'acqua la calcola da se' (glassComposite), con gli
 * stessi valori del canvas: quello che si vede attraverso e' identico.
 */

import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Effect, EffectAttribute } from 'postprocessing'
import * as THREE from 'three'
import { causticsFragment } from '../CausticsPlane'
import { useStore } from '@/stores/useStore'
import { BENCH } from './Bench'
import { worldHold } from './shared'

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
  // 1 in cima alla pagina: la parete chiara e neutra dello studio; 0 piu' giu': la piscina rosa
  uniform float u_neutral;
  // il logo sullo schermo: centro (uv), larghezza (in altezze di schermo), quanta luce
  uniform vec4 u_logo;

  float hzHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float hzNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hzHash(i), hzHash(i + vec2(1.0, 0.0)), f.x),
               mix(hzHash(i + vec2(0.0, 1.0)), hzHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float hzFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * hzNoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return s;
  }
  // la luce che scende dall'alto sul logo e il vapore che la rende spessa:
  // x = quanta luce (fascio e aria accesa), y = quanta penombra intorno al fascio.
  // Coordinate in larghezze del logo, centro del logo in (0, 0), y in su.
  vec2 haze(vec2 uv) {
    if (u_logo.w <= 0.0) return vec2(0.0);
    vec2 p = (uv - u_logo.xy) * vec2(u_res.x / max(1.0, u_res.y), 1.0) / max(u_logo.z, 1e-3);
    // lontano dal logo (oltre 13 larghezze) luce e penombra sono sotto l'1%: non si
    // calcolano. Scendendo nella pagina il logo esce dallo schermo e qui si salta tutto
    float r2 = dot(p, p);
    if (r2 > 170.0) return vec2(0.0);
    float t = u_time;
    // il fascio: stretto in alto, si apre scendendo e si posa sul logo; dietro al
    // logo si spegne, cosi' attraverso il vetro si vede il rosa e il vetro si legge
    float w = 0.22 + 0.3 * clamp(1.8 - p.y, 0.0, 3.0);
    float beam = 1.0 - smoothstep(w * 0.35, w, abs(p.x + 0.05 * p.y));
    beam *= smoothstep(0.0, 0.7, p.y) * (1.0 - 0.5 * smoothstep(1.4, 3.0, p.y));
    // l'aria accesa intorno al logo
    float glow = exp(-dot(p * vec2(0.85, 1.3), p * vec2(0.85, 1.3)) * 1.5);
    // vapore: sale piano e si sfilaccia. Serve solo dove c'e' luce da far vibrare
    float v = 0.12;
    if (beam + glow > 0.002) {
      v = hzFbm(p * vec2(1.6, 1.0) + vec2(0.1 * t, -0.14 * t));
      v = 0.12 + 0.88 * smoothstep(0.28, 0.8, v);
    }
    float luce = (beam * (0.45 + 0.85 * v) + glow * 0.28 * (0.4 + 0.6 * v)) * u_logo.w;
    // fuori dal fascio la stanza e' in penombra: e' il buio che fa vedere la luce
    // (solo intorno al logo: lontano, sul banco, il fondale resta quello di sempre)
    float ombra = (1.0 - beam) * (1.0 - glow) * (1.0 - exp(-r2 * 0.05)) * exp(-r2 * 0.03) * 0.8 * u_logo.w;
    return vec2(luce, ombra);
  }
  float hazeLight(vec2 uv) { return haze(uv).x; }
  vec3 hazedBy(vec3 c, vec2 h) {
    c *= 1.0 - h.y;
    return 1.0 - (1.0 - c) * (1.0 - h.x * vec3(1.0, 0.95, 0.93));
  }
  vec3 water(vec2 uv) {
    return srgbToLinearBg(causticsColor(0.5 + (uv - 0.5) * u_scale + vec2(0.0, u_scroll)).rgb);
  }
  // Le onde di luce: lo stesso disegno e lo stesso moto dell'acqua (field), ma senza le
  // zone spente che la piscina ha di proposito. Servono al vetro del logo e alla luce
  // dietro: devono attraversare tutto il logo, non solo una parte. 0 = niente, 1 = filo pieno
  float lightWaves(vec2 uv) {
    float t = u_time * 0.22;
    vec2 q = uv * vec2(u_res.x / max(1.0, u_res.y), 1.0) * 14.0;
    vec2 flow = vec2(field(q * 0.18, t * 0.18), field(q * 0.18 + vec2(3.9, 2.2), t * 0.18)) * 1.4;
    float f = field(q + flow, t);
    float a = max(0.0, 1.0 - abs(f) / 0.12);
    float b = max(0.0, 1.0 - abs(abs(f) - 0.5) / 0.1);
    return clamp(a * a * a + 0.55 * b * b * b, 0.0, 1.0);
  }
  // La parete dello studio, in cima: chiara e neutra, appena piu' scura in basso
  // (valori di luce, non colori: la correzione del composer, ACES, li porta a un bianco
  // caldo). Sopra cade la luce passata nel vetro del logo, come quella di una lastra
  // colorata sul muro: una pozza corallo morbida, senza contorni, proprio dietro il
  // logo (appena in basso a destra), con dentro le increspature dell'acqua che si
  // muovono. Si vede intorno alle lettere e, piegata, attraverso il vetro
  // crisp (0..1): visto attraverso il vetro del logo i fili delle increspature sono piu'
  // netti e meno accesi; il fondale vero li tiene morbidi (crisp 0)
  vec3 studioWall(vec2 uv, float crisp) {
    vec3 wall = mix(vec3(1.05, 1.02, 1.0), vec3(1.4, 1.37, 1.33), smoothstep(0.0, 1.0, uv.y));
    if (u_logo.z <= 0.0) return wall;
    vec2 p = (uv - u_logo.xy) * vec2(u_res.x / max(1.0, u_res.y), 1.0) / max(u_logo.z, 1e-3);
    // coordinate in larghezze del logo, centro del logo in (0, 0), y in su
    vec2 e = (p - vec2(0.12, -0.08)) / vec2(0.95, 0.5);
    float pool = exp(-dot(e, e) * 1.2);
    if (pool < 0.003) return wall;
    float ripple = lightWaves(uv * 0.92 + 0.04);
    ripple = mix(ripple, smoothstep(0.3, 0.8, ripple), crisp);
    // la luce colorata tinge il muro; le increspature la raccolgono in fili piu' chiari
    // (colori pieni e profondi: sulle tinte chiare ACES desatura, e il corallo diventava pesca)
    vec3 light = mix(mix(vec3(0.95, 0.36, 0.28), vec3(1.0, 0.44, 0.35), crisp), mix(vec3(1.35, 0.72, 0.55), vec3(1.15, 0.62, 0.49), crisp), ripple);
    return mix(wall, light, pool * 0.72);
  }
  vec3 studioWall(vec2 uv) { return studioWall(uv, 0.0); }
  vec3 backdrop(vec2 uv) {
    vec3 pink = hazedBy(water(uv), haze(uv));
    if (u_neutral <= 0.001) return pink;
    return mix(pink, studioWall(uv), u_neutral);
  }
`

/**
 * La correzione colore del composer, a mano: ACES (ToneMapping) e poi la vignettatura
 * (Vignette, offset 0.25 e darkness 0.55 come in Table3D). Il composer mette per primo
 * l'effetto che legge la profondita' (questo), quindi tutto quello che esce di qui,
 * acqua compresa, passava poi per ACES e vignettatura: il canvas dell'acqua le rifa'
 * uguali, e la sfumatura del banco e il vetro del logo le tolgono e le rimettono.
 */
const pvPars = /* glsl */`
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
  float pvVignette(vec2 uv) {
    return smoothstep(0.8, 0.25 * 0.799, distance(uv, vec2(0.5)) * (0.55 + 0.25));
  }
`

const fragment = pvPars + /* glsl */`
  uniform mat4 u_invProj;
  uniform mat4 u_camWorld;
  uniform vec2 u_bench;   // meta' larghezza e meta' profondita' del piano del banco
  uniform vec2 u_band;    // quanto e' larga la sfumatura sui lati e davanti/dietro
  uniform float u_top;    // sotto questa altezza si sfuma: il banco, e sul computer anche le cose sopra
  vec3 fadeToLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
  }
  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    // niente davanti: trasparente, si vede l'acqua del canvas dietro
    if (depth >= 0.99999) {
      outputColor = vec4(0.0);
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
    // sui bordi delle cose l'antialiasing mescola il pixel con lo sfondo del 3D, che e'
    // trasparente: il colore arriva premoltiplicato per la copertura (inputColor.a).
    // Trattarlo come pieno dava un filo nero tutto intorno (al logo, al banco)
    float cover = inputColor.a;
    if (cover <= 0.0) { outputColor = vec4(0.0); return; }
    vec3 c = inputColor.rgb / cover;
    float a = k * cover;
    if (a >= 0.999) { outputColor = vec4(c, 1.0); return; }
    // la sfumatura (e i bordi): la pagina somma a volte la cosa finita (ACES,
    // vignettatura, sRGB; premoltiplicata) e (1 - a) l'acqua che sta dietro, finita
    // allo stesso modo. Qui si calcola la cosa finita, la si scala di a, e si torna
    // indietro: il composer dopo rimette ACES e vignettatura e porta in sRGB
    float vg = max(pvVignette(uv), 1e-3);
    vec3 shown = a * pvToSrgb(pvAces(c) * vg);
    outputColor = vec4(pvAcesInv(fadeToLinear(shown) / vg), a);
  }
`

/** I valori dell'acqua, gli stessi per il canvas dell'acqua e per il vetro del logo.
 *  Il tempo, lo scroll e la scala li scrive WaterCanvas; il logo (u_logo) LogoModel */
export const water = {
  u_time: new THREE.Uniform(0),
  u_fade: new THREE.Uniform(1),
  u_white: new THREE.Uniform(0),
  u_res: new THREE.Uniform(new THREE.Vector2(1, 1)),
  u_scroll: new THREE.Uniform(0),
  u_scale: new THREE.Uniform(new THREE.Vector2(1, 1)),
  u_logo: new THREE.Uniform(new THREE.Vector4(0.5, 0.5, 0.3, 0)),   // lo aggiorna LogoModel
  u_neutral: new THREE.Uniform(1),   // la parete neutra in cima: lo scrive WaterCanvas
}

/** Quanto si vede la parete neutra dello studio: tutta in cima, sfuma nella piscina rosa scendendo verso il banco */
export function neutralAt(scrollY: number, h: number) {
  return 1 - THREE.MathUtils.smoothstep(scrollY / Math.max(1, h), 0.55, 1.25)
}

/** La scala della scena del logo di una volta: piano 16 × 10 a 7,5 di distanza, fov 35 (piu' largo sotto il 16:9) */
export function waterScale(w: number, h: number, out: THREE.Vector2) {
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
        ['u_invProj', new THREE.Uniform(new THREE.Matrix4())],
        ['u_camWorld', new THREE.Uniform(new THREE.Matrix4())],
        ['u_bench', new THREE.Uniform(new THREE.Vector2(BENCH.w / 2, BENCH.d / 2))],
        ['u_band', new THREE.Uniform(new THREE.Vector2(2.2, 1.1))],
        ['u_top', new THREE.Uniform(0.7)],
      ]),
    })
  }
}

/** L'acqua da sola, per il suo canvas (WaterCanvas): lo stesso disegno che il vetro del logo vede attraverso */
export const waterFragment = 'precision highp float;\n' + common + pvPars + /* glsl */`
  uniform vec2 u_px;
  void main() {
    // come usciva dal composer: ACES, vignettatura, sRGB
    vec2 uv = gl_FragCoord.xy / u_px;
    gl_FragColor = vec4(pvToSrgb(pvAces(backdrop(uv)) * pvVignette(uv)), 1.0);
  }
` 

/** Va messo dentro <EffectComposer>, per ultimo */
export function WorldBackdrop({ mobile = false }: { mobile?: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  const effect = useMemo(() => new BackdropEffect(), [])

  // in cima il logo galleggia e attraverso il vetro si vede l'acqua muoversi: li' il
  // mondo si ridisegna 30 volte al secondo. Altrove (banco compreso) solo quando cambia qualcosa
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden || useStore.getState().gameOpen || worldHold.on) return
      if (window.scrollY < window.innerHeight * 1.1) invalidate()
    }, 33)
    return () => { window.clearInterval(id); effect.dispose() }
  }, [invalidate, effect])

  useFrame(({ size, camera }) => {
    const u = effect.uniforms
    camera.updateMatrixWorld()   // la camera si e' appena mossa (Rig): niente bordo in ritardo di un fotogramma
    ;(u.get('u_invProj')!.value as THREE.Matrix4).copy(camera.projectionMatrixInverse)
    ;(u.get('u_camWorld')!.value as THREE.Matrix4).copy(camera.matrixWorld)
    water.u_res.value.set(size.width, size.height)
    waterScale(size.width, size.height, water.u_scale.value)
    // da telefono la camera e' vicina e il banco riempie lo schermo: una fascia
    // larga come sul computer coprirebbe di rosa il fascicolo e il Game Boy
    ;(u.get('u_band')!.value as THREE.Vector2).set(mobile ? 1.2 : 2.2, 1.4)
    // e da telefono sfuma solo il banco con il tappetino e il righello (fino a 2 cm): fascicolo e Game Boy
    // arrivano fino al bordo e restano interi
    u.get('u_top')!.value = 0.7
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
  // il fondo visto attraverso il vetro in un punto: in cima soprattutto la parete
  vec3 glassSeen(vec2 uv, vec2 hz) {
    vec3 s = hazedBy(water(uv), hz);
    // quasi solo la parete vera (con la luce corallo): dentro il vetro deve vedersi quello
    // che c'e' intorno, piegato. Se dentro e' diverso l'occhio lo legge come materiale pieno
    if (u_neutral > 0.001) s = mix(s, studioWall(uv, 1.0), u_neutral * 0.95);
    return s;
  }
` + pvPars

/** Va in fondo al fragment del vetro (dopo dithering_fragment). Chi lo usa dichiara
 *  prima vec2 glassShift (di quanto si sposta il fondale visto attraverso: rifrazione)
 *  e vec3 glassTint (come il vetro colorato filtra il fondale), float glassGlint (riflessi nitidi) */
export const glassComposite = /* glsl */`
  {
    // come sulla tela di una volta: fusione sui colori gia' pronti per lo schermo (sRGB)
    // il vapore una volta sola, nel punto del vetro: serve al fondo visto attraverso
    // (spostato di poco dalla rifrazione) e al velo davanti
    vec2 hz = haze(gl_FragCoord.xy / u_px);
    // in cima, sulla parete neutra, attraverso il vetro si vede soprattutto la parete:
    // il vetro e' trasparente, tinto di rosa, e l'acqua resta un velo che si muove dentro.
    // Dove la rifrazione e' forte (i fianchi tondi) i tre colori si piegano di poco
    // diverso: la dispersione di un prisma, l'orlo iridato del vetro vero
    vec2 baseUv = gl_FragCoord.xy / u_px;
    vec3 seen;
    if (length(glassShift) > 0.004) {
      vec3 sr = glassSeen(baseUv + glassShift * 1.12, hz);
      vec3 sg = glassSeen(baseUv + glassShift, hz);
      vec3 sb = glassSeen(baseUv + glassShift * 0.88, hz);
      seen = vec3(sr.r, sg.g, sb.b);
    } else seen = glassSeen(baseUv + glassShift, hz);
    vec3 bgc = pvToSrgb(seen) * glassTint;
    vec3 g = pvToSrgb(pvAces(gl_FragColor.rgb));
    // sulla tela di una volta si vedevano anche i fianchi delle lettere dietro al fronte:
    // due strati di vetro, piu' bianchi di uno
    float a2 = 1.0 - (1.0 - gl_FragColor.a) * (1.0 - gl_FragColor.a);
    vec3 c = mix(bgc, g, a2);
    // un velo del vapore passa anche davanti al vetro: l'aria e' spessa
    c = 1.0 - (1.0 - c) * (1.0 - hz.x * 0.28);
    // i riflessi nitidi sopra a tutto
    c = 1.0 - (1.0 - c) * (1.0 - clamp(glassGlint, 0.0, 1.0));
    gl_FragColor = vec4(pvAcesInv(srgbToLinearBg(c)), 1.0);
  }
`

/** Tiene aggiornata la misura del buffer per il vetro */
export function GlassSync() {
  const gl = useThree((s) => s.gl)
  useFrame(() => { gl.getDrawingBufferSize(glassUniforms.u_px.value) })
  return null
}
