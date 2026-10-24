// Caustiche rosa della home (CausticsPlane.tsx): stesso campo, stessi colori.
// CAUSTICS_GLSL si include negli shader; mountCausticsBackground() fa da sfondo a tutto schermo.
import * as THREE from 'three';

export const CAUSTICS_GLSL = /* glsl */ `
  float cField(vec2 p, float t) {
    float a = sin(p.x * 1.4 + sin(p.y * 1.1 + t * 0.34) * 1.0 + t * 0.26);
    vec2 p2 = vec2(-0.500 * p.x - 0.866 * p.y, 0.866 * p.x - 0.500 * p.y);
    float b = sin(p2.x * 1.4 + sin(p2.y * 1.1 + t * 0.29) * 1.0 + t * 0.21);
    vec2 p3 = vec2(-0.500 * p.x + 0.866 * p.y, -0.866 * p.x - 0.500 * p.y);
    float c = sin(p3.x * 1.4 + sin(p3.y * 1.1 + t * 0.25) * 1.0 + t * 0.17);
    return (a + b + c) / 3.0;
  }

  // rgb = colore della piscina rosa, a = intensità dei filamenti di luce.
  vec4 caustics(vec2 uv, float time) {
    float t = time * 0.22;
    vec2 flow = vec2(cField(uv * 0.18, t * 0.18), cField(uv * 0.18 + vec2(3.9, 2.2), t * 0.18)) * 1.4;
    float f = cField(uv + flow, t);

    float modA = (cField(uv * 0.32, t * 0.10) * 0.5 + 0.5) * (cField(uv * 0.22 + vec2(1.9, 2.6), t * 0.08) * 0.5 + 0.5);
    float breakA = smoothstep(0.14, 0.48, modA);
    float modB = (cField(uv * 0.32 + vec2(3.2, 1.5), t * 0.10) * 0.5 + 0.5) * (cField(uv * 0.22 + vec2(0.4, 3.8), t * 0.08) * 0.5 + 0.5);
    float breakB = smoothstep(0.14, 0.48, modB);

    float coreA = max(0.0, 1.0 - abs(f) / 0.10); coreA = coreA * coreA * coreA;
    float haloA = max(0.0, 1.0 - abs(f) / 0.21); haloA = haloA * haloA;
    float causticA = (coreA * 0.75 + haloA * 0.25) * breakA;

    float fB = abs(f) - 0.50;
    float coreB = max(0.0, 1.0 - abs(fB) / 0.09); coreB = coreB * coreB * coreB;
    float haloB = max(0.0, 1.0 - abs(fB) / 0.21); haloB = haloB * haloB;
    float causticB = (coreB * 0.60 + haloB * 0.20) * breakB;

    float sf = cField(uv * 0.14 + vec2(2.3, 1.1), t * 0.50);
    float both = max(causticA, causticB);
    float dark = (1.0 - both) * clamp(0.30 + 0.70 * sf, 0.0, 1.0) * 0.80;

    vec3 col = mix(vec3(0.960, 0.780, 0.840), vec3(0.600, 0.400, 0.500), dark * 0.7);
    col = mix(col, vec3(1.000, 0.920, 0.950), causticA * 0.70);
    col = mix(col, vec3(0.980, 0.880, 0.920), causticB * 0.50);
    return vec4(col, both);
  }
`;

// Quad a tutto schermo, disegnato per primo: lo sfondo della home dietro la scena.
export function makeCausticsBackdropQuad() {
  const mat = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position.xy, 0.9999, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uAlpha;
      uniform vec2 uRes;
      ${CAUSTICS_GLSL}
      void main() {
        vec2 uv = gl_FragCoord.xy / uRes.y * 18.0;
        // Come in CausticsPlane.tsx: i colori escono così come sono, senza conversione sRGB.
        gl_FragColor = vec4(caustics(uv, uTime).rgb, uAlpha);
      }
    `,
    // Opaco finché non serve sfumarlo: da trasparente verrebbe disegnato sopra gli oggetti opachi.
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 1 }, uRes: { value: new THREE.Vector2(1, 1) } },
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  quad.renderOrder = -10;
  return quad;
}

// Sfondo animato autonomo (schermata iniziale e caricamento).
export function mountCausticsBackground(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const quad = makeCausticsBackdropQuad();
  scene.add(quad);
  const resize = () => {
    renderer.setSize(host.clientWidth, host.clientHeight);
    quad.material.uniforms.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
  };
  addEventListener('resize', resize);
  resize();
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    quad.material.uniforms.uTime.value += clock.getDelta();
    renderer.render(scene, camera);
  });
  return () => {
    removeEventListener('resize', resize);
    renderer.setAnimationLoop(null);
    renderer.dispose();
    renderer.domElement.remove();
  };
}
