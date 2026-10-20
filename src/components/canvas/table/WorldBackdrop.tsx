'use client'

/**
 * Il fondale del mondo: la piscina rosata (lo shader di CausticsPlane).
 *
 * E' un effetto di post-produzione, applicato per ultimo e solo dove non c'e'
 * niente davanti (profondita' vuota): il tavolo e le cose che ha sopra hanno i
 * loro colori, e il rosa resta identico a quello di sempre, senza la
 * correzione colore da render che lo smorzava. Nella sezione Chi sono
 * schiarisce verso il bianco, come prima.
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

// lo shader della piscina diventa una funzione; le uv riproducono la scala che
// aveva sul piano 16 × 10 a 7,5 di distanza (fov 35) nella scena del logo
const fragment = causticsFragment
  .replace(/varying vec2\s+vUv;/, '')
  .replace('void main() {', 'vec4 causticsColor(vec2 vUv) {')
  .replace('gl_FragColor = vec4(col, u_fade);', 'return vec4(col, u_fade);') + /* glsl */`
  vec3 srgbToLinearBg(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
  }
  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    if (depth >= 0.99999) {
      float a = u_res.x / u_res.y;
      vec2 vUv = 0.5 + (uv - 0.5) * vec2(0.2957 * a, 0.473);
      outputColor = vec4(srgbToLinearBg(causticsColor(vUv).rgb), 1.0);
    } else {
      outputColor = inputColor;
    }
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
      ]),
    })
  }
}

const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Va messo dentro <EffectComposer>, per ultimo */
export function WorldBackdrop() {
  const invalidate = useThree((s) => s.invalidate)
  const effect = useMemo(() => new BackdropEffect(), [])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden && !useStore.getState().gameOpen) invalidate()
    }, 42)
    return () => { window.clearInterval(id); effect.dispose() }
  }, [invalidate, effect])

  useFrame(({ size }, delta) => {
    const u = effect.uniforms
    u.get('u_time')!.value += Math.min(delta, 0.1)
    ;(u.get('u_res')!.value as THREE.Vector2).set(size.width, size.height)
    // nella sezione Chi sono l'acqua schiarisce verso il bianco
    const { scrollY, aboutSectionTop, contactSectionTop } = useStore.getState()
    let white = 0
    if (aboutSectionTop > 0) {
      const fadeIn = ss(aboutSectionTop - 1200, aboutSectionTop + 200, scrollY)
      const fadeOut = contactSectionTop > 0 ? 1 - ss(contactSectionTop - 400, contactSectionTop + 800, scrollY) : 1
      white = Math.min(1, (fadeIn * fadeOut) / 0.4)
    }
    u.get('u_white')!.value = white
  })

  return <primitive object={effect} dispose={null} />
}
