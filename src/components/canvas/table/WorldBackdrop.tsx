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
import {
  worldCommon as common, pvPars, createWaterUniforms, neutralAt, waterScale, waterFragment, glassPars, glassComposite,
} from '@/shaders/logoGlass'
import { useStore } from '@/stores/useStore'
import { BENCH } from './Bench'
import { worldHold } from './shared'

// lo shader della piscina diventa una funzione; le uv riproducono la scala che
// aveva sul piano 16 × 10 a 7,5 di distanza (fov 35) nella scena del logo
// la scala segue lo schermo come faceva la scena del logo (ResponsiveCamera): sotto
// il 16:9 la camera allargava l'inquadratura e il disegno dell'acqua si faceva piu' fitto


/**
 * La correzione colore del composer, a mano: ACES (ToneMapping) e poi la vignettatura
 * (Vignette, offset 0.25 e darkness 0.55 come in Table3D). Il composer mette per primo
 * l'effetto che legge la profondita' (questo), quindi tutto quello che esce di qui,
 * acqua compresa, passava poi per ACES e vignettatura: il canvas dell'acqua le rifa'
 * uguali, e la sfumatura del banco e il vetro del logo le tolgono e le rimettono.
 */


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
export const water = createWaterUniforms()
export { neutralAt, waterScale, waterFragment, glassPars, glassComposite }

/** Quanto si vede la parete neutra dello studio: tutta in cima, sfuma nella piscina rosa scendendo verso il banco */

/** La scala della scena del logo di una volta: piano 16 × 10 a 7,5 di distanza, fov 35 (piu' largo sotto il 16:9) */

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


/** Va in fondo al fragment del vetro (dopo dithering_fragment). Chi lo usa dichiara
 *  prima vec2 glassShift (di quanto si sposta il fondale visto attraverso: rifrazione)
 *  e vec3 glassTint (come il vetro colorato filtra il fondale), float glassGlint (riflessi nitidi)
 *  e vec3 glassSheen (i riflessi colorati del fronte lucidato) */


/** Tiene aggiornata la misura del buffer per il vetro */
export function GlassSync() {
  const gl = useThree((s) => s.gl)
  useFrame(() => { gl.getDrawingBufferSize(glassUniforms.u_px.value) })
  return null
}
