import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../stores/useStore'

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
const fragmentShader = /* glsl */`
  uniform float u_time;
  uniform float u_fade;
  uniform float u_white; // 0 = rosa hero, 1 = bianco about
  uniform vec2  u_res;
  varying vec2  vUv;

  // Tre componenti in direzioni diverse → molti punti sella → rete ramificata.
  // La rete emerge dallo ZERO-CROSSING di (a+b+c): un'unica curva continua
  // che si biforca ai punti sella. Nessun abs(sin(f*k)) → niente spigoli.
  float field(vec2 p, float t) {
    // 3 onde a 120° con ampiezza uguale → isotropia perfetta.
    // Nessuna direzione privilegiata: la ragnatela si muove
    // uniformemente in tutte le direzioni.

    // Dir 0°
    float a = sin(p.x * 1.4 + sin(p.y * 1.1 + t * 0.34) * 1.0 + t * 0.26);

    // Dir 120°: rot(120°) = (-0.5, +0.866)
    vec2 p2 = vec2(-0.500 * p.x - 0.866 * p.y,
                    0.866 * p.x - 0.500 * p.y);
    float b = sin(p2.x * 1.4 + sin(p2.y * 1.1 + t * 0.29) * 1.0 + t * 0.21);

    // Dir 240°: rot(240°) = (-0.5, -0.866)
    vec2 p3 = vec2(-0.500 * p.x + 0.866 * p.y,
                   -0.866 * p.x - 0.500 * p.y);
    float c = sin(p3.x * 1.4 + sin(p3.y * 1.1 + t * 0.25) * 1.0 + t * 0.17);

    return (a + b + c) / 3.0;
  }

  void main() {
    float t  = u_time * 0.22;  // lento: i punti sella evolvono piano → legami duraturi
    vec2  uv = vUv;
    uv.x *= u_res.x / u_res.y;
    uv   *= 22.5;

    // ── Campo di flusso condiviso ─────────────────────────────────
    // Due campionature a bassa frequenza dello stesso field → vettore 2D
    // che rappresenta la "corrente d'acqua" sottostante.
    // Entrambi i layer vengono deformati da questo stesso flusso:
    // si muovono casualmente MA in modo coerente — network interdipendente.
    float flowX = field(uv * 0.18 + vec2(0.0, 0.0), t * 0.18);
    float flowY = field(uv * 0.18 + vec2(3.9, 2.2), t * 0.18);
    vec2  flow  = vec2(flowX, flowY) * 1.4;

    // ── Unico campo: l'intera superficie d'acqua ─────────────────
    float f = field(uv + flow, t);

    // ── Modulazione neuronale: dove le linee si attivano/silenziamo ──
    // Due campi lenti e larghi (scala 0.20) definiscono zone di
    // "attivazione". Il prodotto li rende discontinui: entrambi
    // devono essere positivi perché la linea sia visibile.
    // A e B usano offset spaziali diversi → rompono in zone indipendenti
    // ma la stessa lentezza li tiene coordinati nel tempo.
    // Scale più alte (0.32 / 0.22) → zone di attivazione più piccole → gap più frequenti
    float modA = (field(uv * 0.32 + vec2(0.0, 0.0), t * 0.10) * 0.5 + 0.5)
               * (field(uv * 0.22 + vec2(1.9, 2.6), t * 0.08) * 0.5 + 0.5);
    float breakA = smoothstep(0.14, 0.48, modA);

    float modB = (field(uv * 0.32 + vec2(3.2, 1.5), t * 0.10) * 0.5 + 0.5)
               * (field(uv * 0.22 + vec2(0.4, 3.8), t * 0.08) * 0.5 + 0.5);
    float breakB = smoothstep(0.14, 0.48, modB);

    // Layer A: livello f = 0 — filamenti principali
    float coreA = max(0.0, 1.0 - abs(f) / 0.10);
    coreA = coreA * coreA * coreA;
    float haloA = max(0.0, 1.0 - abs(f) / 0.21);
    haloA = haloA * haloA;
    float causticA = (coreA * 0.75 + haloA * 0.25) * breakA;

    // Layer B: livello |f| = 0.5 — eco coordinato
    float fB    = abs(f) - 0.50;
    float coreB = max(0.0, 1.0 - abs(fB) / 0.09);
    coreB = coreB * coreB * coreB;
    float haloB = max(0.0, 1.0 - abs(fB) / 0.21);
    haloB = haloB * haloB;
    float causticB = (coreB * 0.60 + haloB * 0.20) * breakB;

    // ── Ombre — inverse di max(A,B), sfumate a bassa frequenza ───
    vec2  uvS  = uv * 0.14 + vec2(2.3, 1.1);
    float sf   = field(uvS, t * 0.50);
    float both = max(causticA, causticB);
    float dark = (1.0 - both) * clamp(0.30 + 0.70 * sf, 0.0, 1.0) * 0.80;

    // ── Maschera locale — bianco solo al centro (dietro i modelli 3D)
    // I modelli sono centrati nel viewport; la maschera è un cerchio morbido
    // che sbiadisce verso i bordi dove il rosa rimane pieno.
    vec2 uvC = vUv - vec2(0.50, 0.50);
    uvC.x   *= u_res.x / u_res.y;           // corregge aspect ratio
    float modelDist = length(uvC);
    float modelMask = 1.0 - smoothstep(0.18, 0.52, modelDist);
    float localWhite = u_white * modelMask;  // bianco solo dove ci sono i modelli

    // ── Colore — rosa ovunque, bianco solo nella zona modelli ────
    vec3 base_pink  = vec3(0.960, 0.780, 0.840);
    vec3 base_white = vec3(0.990, 0.985, 0.988);
    vec3 base       = mix(base_pink, base_white, localWhite);

    vec3 lineA_pink  = vec3(1.000, 0.920, 0.950);
    vec3 lineA_white = vec3(1.000, 0.998, 0.999);
    vec3 lineA       = mix(lineA_pink, lineA_white, localWhite);

    vec3 lineB_pink  = vec3(0.980, 0.880, 0.920);
    vec3 lineB_white = vec3(0.998, 0.994, 0.996);
    vec3 lineB       = mix(lineB_pink, lineB_white, localWhite);

    vec3 shad_pink  = vec3(0.600, 0.400, 0.500);
    vec3 shad_white = vec3(0.860, 0.845, 0.852);
    vec3 shadow_col = mix(shad_pink, shad_white, localWhite);

    vec3 col = mix(base, shadow_col, dark * 0.7);
    col = mix(col, lineA, causticA * 0.70);
    col = mix(col, lineB, causticB * 0.50);

    gl_FragColor = vec4(col, u_fade);
  }
`

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
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={true}
      />
    </mesh>
  )
}
