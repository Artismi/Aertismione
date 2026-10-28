import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../stores/useStore'
import { causticsFragment } from '@/shaders/logoGlass'

// ─── Vertex shader ────────────────────────────────────────────────────────────
const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// ─── Fragment shader ──────────────────────────────────────────────────────────
// Tecnica: zero-crossing di un singolo campo liscio.
// field(p,t) = onda dominante + perturbazione a bassa ampiezza.
// Gli zero-crossing di un campo C-infinito sono SEMPRE curve C-infinito;
// si biforcano e si fondono nei punti sella — esattamente i filamenti
// di luce sul fondo di una piscina.
// Un solo campo → UN'unica famiglia di curve, senza caos da sovrapposizione.
export { causticsFragment }

// ─── Component ────────────────────────────────────────────────────────────────
export function CausticsPlane() {
  const matRef  = useRef<THREE.ShaderMaterial>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(() => ({
    u_time:  { value: 0 },
    u_fade:  { value: 1 },
    u_white: { value: 0 },
    u_res:   { value: new THREE.Vector2(1, 1) },
  }), [])

  useFrame(({ camera, size }, delta) => {
    if (!matRef.current || !meshRef.current) return

    const { scrollY, aboutSectionTop, contactSectionTop } = useStore.getState()

    uniforms.u_time.value += delta
    uniforms.u_res.value.set(size.width, size.height)

    // Il piano segue la camera — sempre visibile indipendentemente
    // da dove si trova la camera nella scena 3D
    meshRef.current.position.y = camera.position.y
    meshRef.current.position.z = camera.position.z - 7.5

    // Smoothstep per transizioni nebbiose (nessun gradino visibile)
    const ss = (a: number, b: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
      return t * t * (3 - 2 * t)
    }

    // Finestra 1: Hero — La griglia rosa deve rimanere SEMPRE visibile!
    const f1 = 1.0   // Annullata la dissolvenza rapida. Sfondo procedurale onnipresente.

    // Finestra 2: About/Avatar — nebbia che sale lentamente
    let f2 = 0
    if (aboutSectionTop > 0) {
      const fadeIn  = ss(aboutSectionTop - 1200, aboutSectionTop + 200, scrollY)  // 1400px
      const fadeOut = contactSectionTop > 0
        ? 1 - ss(contactSectionTop - 400, contactSectionTop + 800, scrollY)       // 1200px
        : 1
      f2 = fadeIn * fadeOut
    }

    // Hero a piena opacità rosa, about più presente ai bordi
    const fade = Math.max(f1 * 1.0, f2 * 0.78)
    uniforms.u_fade.value  = fade
    // u_white: 0 nell'hero, 1 nella sezione about (transizione morbida)
    uniforms.u_white.value = f2 > 0.01 ? Math.min(1, f2 / 0.4) : 0
    matRef.current.visible = fade > 0.005
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -1.5]} renderOrder={1}>
      <planeGeometry args={[16, 10]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={causticsFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={true}
      />
    </mesh>
  )
}
