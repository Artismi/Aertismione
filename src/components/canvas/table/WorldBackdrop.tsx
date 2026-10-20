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
const fragment = causticsFragment
  .replace(/varying vec2\s+vUv;/, '')
  .replace('void main() {', 'vec4 causticsColor(vec2 vUv) {')
  .replace('gl_FragColor = vec4(col, u_fade);', 'return vec4(col, u_fade);') + /* glsl */`
  vec3 srgbToLinearBg(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
  }
  uniform float u_scroll;
  uniform mat4 u_invProj;
  uniform mat4 u_camWorld;
  uniform vec2 u_bench;   // meta' larghezza e meta' profondita' del piano del banco
  uniform vec2 u_band;    // quanto e' larga la sfumatura sui lati e davanti/dietro
  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    float a = u_res.x / u_res.y;
    vec2 vUv = 0.5 + (uv - 0.5) * vec2(0.2957 * a, 0.473) + vec2(0.0, u_scroll);
    if (depth >= 0.99999) {
      outputColor = vec4(srgbToLinearBg(causticsColor(vUv).rgb), 1.0);
      return;
    }
    // il banco sfuma nel fondale vicino ai bordi, invece di finire con un taglio:
    // dalla profondita' si risale al punto del mondo e si misura quanto dista dal bordo
    vec4 v = u_invProj * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec3 p = (u_camWorld * vec4(v.xyz / v.w, 1.0)).xyz;
    float k = 1.0;
    if (p.y < 0.7) {
      float e = min((u_bench.x - abs(p.x)) / u_band.x, (u_bench.y - abs(p.z)) / u_band.y);
      k = smoothstep(0.0, 1.0, e);
    }
    if (k >= 1.0) { outputColor = inputColor; return; }
    vec3 bg = srgbToLinearBg(causticsColor(vUv).rgb);
    outputColor = vec4(mix(bg, inputColor.rgb, k), 1.0);
  }
`

class BackdropEffect extends Effect {
  constructor() {
    super('BackdropEffect', fragment, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, THREE.Uniform>([
        ['u_time', new THREE.Uniform(0)],
        ['u_fade', new THREE.Uniform(1)],
        ['u_white', new THREE.Uniform(0)],
        ['u_res', new THREE.Uniform(new THREE.Vector2(1, 1))],
        ['u_scroll', new THREE.Uniform(0)],
        ['u_invProj', new THREE.Uniform(new THREE.Matrix4())],
        ['u_camWorld', new THREE.Uniform(new THREE.Matrix4())],
        ['u_bench', new THREE.Uniform(new THREE.Vector2(BENCH.w / 2, BENCH.d / 2))],
        ['u_band', new THREE.Uniform(new THREE.Vector2(2.2, 1.1))],
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
    u.get('u_time')!.value += Math.min(delta, 0.1)
    ;(u.get('u_res')!.value as THREE.Vector2).set(size.width, size.height)
    // da telefono la camera e' vicina e il banco riempie lo schermo: una fascia
    // larga come sul computer coprirebbe di rosa il fascicolo e il Game Boy
    ;(u.get('u_band')!.value as THREE.Vector2).set(mobile ? 0.8 : 2.2, mobile ? 0.3 : 1.1)
    // l'acqua scorre con la pagina, piu' piano del mondo: e' lontana
    u.get('u_scroll')!.value = window.scrollY / Math.max(1, size.height) * 0.12
  }, 0.6) // dopo Rig e Budget, prima del composer

  return <primitive object={effect} dispose={null} />
}
