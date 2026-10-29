// Ologramma Artismi: una moneta cromata appoggiata sul QR proietta un cono di luce
// attraversato dalle caustiche rosa della home; al centro ruota il logo di vetro.
// Unità: 1 = 25 mm sul biglietto prima dell'ingrandimento (app.js lo scala 4 volte).
// Asse Y = normale al biglietto (verso l'alto).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { CAUSTICS_GLSL } from '/ar/caustics.js';
import { createSiteLook } from '/ar/site-look.js';

const BLUSH = new THREE.Color('#ff9cc8');

const COIN_R = 0.15;
const COIN_H = 0.028;
const CONE_H = 2.1;
const CONE_R0 = 0.1;
const CONE_R1 = 1.25;
const LOGO_W = 1.5;
const LOGO_DEPTH = 0.45;
const LOGO_Y = 1.25;
const LOGO_LEAN = THREE.MathUtils.degToRad(-20); // inclinato all'indietro, verso chi legge il biglietto

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const phase = (t, a, b) => clamp01((t - a) / (b - a));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

// Uniform condivisi da tutti i materiali dell'ologramma.
const shared = {
  uTime: { value: 0 },
  uFade: { value: 0 },
  uBoost: { value: 0 },
  uOpen: { value: 0 },
  uLogoFade: { value: 1 }, // il logo sfuma da solo: nel volo verso la home resta visibile più a lungo
};

const VIEW_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vView;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

function holoMaterial(fragmentShader, uniforms = {}, opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: opts.vertexShader ?? VIEW_VERT,
    fragmentShader,
    uniforms: { ...shared, ...uniforms },
    transparent: true,
    depthWrite: false,
    side: opts.side ?? THREE.DoubleSide,
    toneMapped: false,
  });
}

// ─── Caustiche proiettate sulla carta attorno alla moneta ──────────────
function makeFloorCaustics() {
  const mat = holoMaterial(/* glsl */ `
    uniform float uTime, uFade, uOpen;
    varying vec2 vUv;
    ${CAUSTICS_GLSL}
    void main() {
      vec2 p = vUv - 0.5;
      float r = length(p) * 2.0;
      if (r > 1.0) discard;
      vec4 c = caustics(p * 7.0, uTime);
      float fall = exp(-r * r * 3.2);
      float a = (0.18 + c.a * 0.75) * fall * uFade * (0.4 + 0.6 * uOpen);
      gl_FragColor = vec4(mix(c.rgb, vec3(1.0), c.a * 0.5), a);
    }
  `);
  // Ingrandito 4 volte copre ~2,5 cm attorno alla moneta: resta dentro il biglietto.
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.002;
  mesh.renderOrder = 1;
  return mesh;
}

// ─── Moneta proiettore ─────────────────────────────────────────────────
function makeCoin() {
  const coin = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(COIN_R, COIN_R, COIN_H, 72),
    new THREE.MeshStandardMaterial({ color: '#f3eef2', metalness: 1, roughness: 0.16, envMapIntensity: 1.6 }),
  );
  body.position.y = COIN_H / 2;
  coin.add(body);

  // Zigrinatura del bordo: anello appena più largo e più ruvido.
  const knurl = new THREE.Mesh(
    new THREE.CylinderGeometry(COIN_R * 1.015, COIN_R * 1.015, COIN_H * 0.55, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: '#d9cfd6', metalness: 1, roughness: 0.45 }),
  );
  knurl.position.y = COIN_H / 2;
  coin.add(knurl);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(COIN_R * 0.9, 0.0045, 10, 96),
    new THREE.MeshBasicMaterial({ color: BLUSH, toneMapped: false }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = COIN_H + 0.001;
  coin.add(rim);

  // Faccia superiore: una piccola piscina di caustiche, la sorgente della luce.
  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(COIN_R * 0.82, 64),
    holoMaterial(/* glsl */ `
      uniform float uTime, uFade, uBoost;
      varying vec2 vUv;
      ${CAUSTICS_GLSL}
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        vec4 c = caustics(p * 5.0, uTime * 1.6);
        float core = exp(-r * 2.4);
        vec3 col = mix(c.rgb, vec3(1.0), core * 0.6 + c.a * 0.4);
        float a = (0.75 + 0.25 * core) * uFade * (1.0 + uBoost * 0.5);
        gl_FragColor = vec4(col, min(a, 1.0));
      }
    `),
  );
  lens.rotation.x = -Math.PI / 2;
  lens.position.y = COIN_H + 0.0015;
  lens.renderOrder = 2;
  coin.add(lens);

  const ticks = new THREE.Mesh(
    new THREE.RingGeometry(COIN_R * 0.84, COIN_R * 0.88, 96, 1),
    holoMaterial(/* glsl */ `
      uniform float uFade;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float ang = atan(p.y, p.x) / 6.28318 + 0.5;
        float a = step(0.5, fract(ang * 48.0)) * 0.8 * uFade;
        gl_FragColor = vec4(1.0, 0.96, 0.98, a);
        #include <colorspace_fragment>
      }
    `),
  );
  ticks.rotation.x = -Math.PI / 2;
  ticks.position.y = COIN_H + 0.002;
  ticks.renderOrder = 2;
  coin.add(ticks);

  return { coin, ticks };
}

// ─── Cono di luce ──────────────────────────────────────────────────────
// Dalla moneta fino a poco sotto le lettere è un fascio pieno: il fondale della home
// proiettato sul cono, bordi più accesi (fresnel), scanline e sfarfallio. Da lì in su si
// sfa in nebbia rosata che avvolge il logo e svanisce prima della cima.
// Il motivo si proietta da due lati (triplanare) in unità reali: stessa densità di curve
// in basso e in alto, niente filamenti stirati lungo la salita.
const LOGO_HALF_H = LOGO_W * 0.3;
const BEAM_END = LOGO_Y - LOGO_HALF_H - 0.08; // poco sotto la base del logo
const FOG_END = LOGO_Y + LOGO_HALF_H * 0.9;

function coneMaterial({ strength, filaments, density, side = THREE.DoubleSide }) {
  return holoMaterial(/* glsl */ `
    uniform float uTime, uFade, uBoost, uOpen;
    varying vec2 vUv;
    varying vec3 vN;
    varying vec3 vView;
    varying vec3 vPos;
    ${CAUSTICS_GLSL}
    void main() {
      float h = vUv.y;
      if (h > uOpen) discard;
      float open = smoothstep(uOpen, uOpen - 0.12, h);
      float y = vPos.y;
      // Fascio: pieno in basso, si spegne attorno alla base del logo.
      float fall = pow(1.0 - h, 0.8) * (1.0 - smoothstep(${(BEAM_END - 0.18).toFixed(3)}, ${(BEAM_END + 0.1).toFixed(3)}, y));
      // Nebbia: nasce dove il fascio si spegne, avvolge il logo e svanisce prima della cima.
      float fogBand = smoothstep(${(BEAM_END - 0.25).toFixed(3)}, ${(BEAM_END + 0.05).toFixed(3)}, y)
                    * (1.0 - smoothstep(${(LOGO_Y - 0.1).toFixed(3)}, ${FOG_END.toFixed(3)}, y));
      float fogNoise = 0.5 + 0.5 * cField(vec2(vPos.x + vPos.z * 0.7, y * 1.6 - uTime * 0.18) * 1.7, uTime * 0.35);
      float edge = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 1.4);
      vec2 radial = normalize(vPos.xz + 1e-5);
      vec2 w = pow(abs(radial), vec2(4.0));
      w /= (w.x + w.y);
      float drift = uTime * 0.12;
      vec4 cx = caustics(vec2(vPos.z, vPos.y - drift) * ${density.toFixed(2)} + vec2(7.3, 0.0), uTime);
      vec4 cz = caustics(vec2(vPos.x, vPos.y - drift) * ${density.toFixed(2)}, uTime);
      vec4 c = cx * w.x + cz * w.y;
      float scan = 0.88 + 0.12 * sin(h * 120.0 - uTime * 7.0);
      float flick = 0.94 + 0.06 * sin(uTime * 37.0) * sin(uTime * 23.0);
      float beam = (${strength.toFixed(2)} + edge * 0.45 + c.a * ${filaments.toFixed(2)}) * fall * scan * flick;
      float fog = (0.16 + edge * 0.2 + c.a * 0.12) * fogBand * fogNoise * fogNoise;
      float a = (beam + fog) * open;
      // Fascio: rosa pieno con le ombre prugna del fondale, filamenti bianchi (saturato perché
      // sopra la fotocamera il rosa pallido virerebbe al grigio). Nebbia: più chiara e lattiginosa.
      vec3 beamCol = mix(c.rgb * vec3(1.03, 0.8, 0.9), vec3(1.0, 0.97, 0.98), c.a * 0.9);
      vec3 fogCol = mix(vec3(0.98, 0.84, 0.9), vec3(1.0, 0.97, 0.98), 0.4 + c.a * 0.4);
      vec3 col = mix(beamCol, fogCol, clamp(fog / max(beam + fog, 1e-4), 0.0, 1.0));
      a *= uFade * (1.0 + uBoost * 1.5);
      gl_FragColor = vec4(col, min(a, 0.92));
    }
  `, {}, { side });
}

function makeCone() {
  const group = new THREE.Group();

  // Parete posteriore (le facce interne viste da fuori) prima del logo, parete anteriore dopo:
  // il logo sta "dentro" la luce e la nebbia, che gli passa sia dietro sia davanti.
  const outerGeo = new THREE.CylinderGeometry(CONE_R1, CONE_R0, CONE_H, 128, 1, true);
  outerGeo.translate(0, CONE_H / 2 + COIN_H, 0);
  const back = new THREE.Mesh(outerGeo, coneMaterial({ strength: 0.24, filaments: 0.85, density: 4.6, side: THREE.BackSide }));
  back.renderOrder = 2;
  const front = new THREE.Mesh(outerGeo, coneMaterial({ strength: 0.12, filaments: 0.5, density: 4.6, side: THREE.FrontSide }));
  front.renderOrder = 7;

  // Nucleo più stretto: dà volume al fascio tra la moneta e il logo (si ferma sotto le lettere).
  const innerH = CONE_H * 0.4;
  const innerGeo = new THREE.CylinderGeometry(CONE_R1 * 0.26, CONE_R0 * 0.8, innerH, 96, 1, true);
  innerGeo.translate(0, innerH / 2 + COIN_H, 0);
  const inner = new THREE.Mesh(innerGeo, coneMaterial({ strength: 0.14, filaments: 0.45, density: 5.2 }));
  inner.renderOrder = 3;

  group.add(back, front, inner);
  return group;
}

// ─── Particelle che salgono nel cono ───────────────────────────────────
function makeParticles(count = 160) {
  const geo = new THREE.BufferGeometry();
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  const mat = holoMaterial(/* glsl */ `
    uniform float uFade, uBoost;
    varying float vLife;
    varying float vTint;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float a = smoothstep(0.5, 0.0, d) * sin(vLife * 3.14159) * uFade * (0.85 + uBoost);
      gl_FragColor = vec4(mix(vec3(1.0), vec3(1.0, 0.7, 0.84), vTint), a);
      #include <colorspace_fragment>
    }
  `, { uPx: { value: 800 } }, {
    vertexShader: /* glsl */ `
      uniform float uTime, uOpen, uPx;
      attribute vec3 aSeed;
      varying float vLife;
      varying float vTint;
      void main() {
        float life = fract(aSeed.x + uTime * (0.06 + aSeed.y * 0.08));
        float y = ${COIN_H.toFixed(3)} + life * ${CONE_H.toFixed(3)} * uOpen;
        float r = mix(${CONE_R0.toFixed(3)}, ${CONE_R1.toFixed(3)}, life * uOpen) * sqrt(aSeed.z) * 0.9;
        float ang = aSeed.z * 61.0 + uTime * (0.2 + aSeed.y * 0.25);
        vec3 p = vec3(cos(ang) * r, y, sin(ang) * r);
        vLife = life;
        vTint = step(0.5, aSeed.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float scale = length(modelViewMatrix[0].xyz);
        gl_PointSize = (0.014 + aSeed.y * 0.014) * scale * projectionMatrix[1][1] * uPx * 0.5 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 8;
  return pts;
}

// ─── Logo di vetro (lo stesso vetro di LogoModel.tsx nel mondo della home) ───
function toFloat(attr, size = 3) {
  const arr = new Float32Array(attr.count * size);
  for (let i = 0; i < attr.count; i++) {
    arr[i * size] = attr.getX(i);
    arr[i * size + 1] = attr.getY(i);
    if (size > 2) arr[i * size + 2] = attr.getZ(i);
  }
  return new THREE.BufferAttribute(arr, size);
}

async function loadLogoGeometry(url) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  gltf.scene.updateMatrixWorld(true);
  let src;
  gltf.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
  // Il glb è quantizzato (interi normalizzati): si passa a float prima di trasformare.
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', toFloat(src.geometry.attributes.position));
  geo.setAttribute('normal', toFloat(src.geometry.attributes.normal));
  // il punto nell'ingombro del logo, per la mappa del ripieno del vetro (bilie: -1)
  geo.setAttribute('uv', toFloat(src.geometry.attributes.uv, 2));
  geo.setIndex(src.geometry.index);
  geo.applyMatrix4(src.matrixWorld);
  geo.computeBoundingBox();
  const center = geo.boundingBox.getCenter(new THREE.Vector3());
  const size = geo.boundingBox.getSize(new THREE.Vector3());
  geo.translate(-center.x, -center.y, -center.z);
  const s = LOGO_W / size.x;
  geo.scale(s, s, s);
  geo.rotateY(Math.PI); // come sul sito: il fronte guarda la camera
  // Spessore dimezzato: con l'estrusione piena le pareti interne delle lettere confondevano il tag.
  geo.scale(1, 1, LOGO_DEPTH);
  geo.computeBoundingBox();
  // Inversa delle trasformazioni appena applicate: porta la nostra geometria nello spazio
  // della scena glTF originale, quella che la home disegna. Serve al volo verso la home
  // (e a fine volo ridà al logo il suo spessore pieno).
  const toGltf = new THREE.Matrix4()
    .makeTranslation(center.x, center.y, center.z)
    .multiply(new THREE.Matrix4().makeScale(1 / s, 1 / s, 1 / s))
    .multiply(new THREE.Matrix4().makeRotationY(-Math.PI))
    .multiply(new THREE.Matrix4().makeScale(1, 1, 1 / LOGO_DEPTH));
  return { geo, toGltf };
}

// Il logo vive come trasformazione (pivot) nella scena AR, ma si disegna "come sul sito":
// site-look.js lo rende nell'ambiente della home e qui arriva solo il ritaglio.
function makeLogo(geo) {
  const pivot = new THREE.Group();
  const reveal = { value: 0 };
  const minY = { value: geo.boundingBox.min.y };
  const maxY = { value: geo.boundingBox.max.y };
  const look = createSiteLook({ geo, reveal, minY, maxY, logoFade: shared.uLogoFade, time: shared.uTime });
  pivot.position.y = LOGO_Y;
  return { pivot, reveal, look };
}

// Le quattro luci di LogoModel.tsx, come direzionali: sotto l'ancora AR le distanze
// sono in pixel e una luce puntiforme si spegnerebbe col decadimento.
function addLogoLights(root) {
  const target = new THREE.Object3D();
  target.position.set(0, LOGO_Y, 0);
  root.add(target);
  const specs = [
    { pos: [0, 4, 3], intensity: 1.6, color: '#ffffff' },   // chiave dall'alto-fronte
    { pos: [0, 0, -4], intensity: 1.2, color: '#e8f4ff' },  // controluce sui bordi
    { pos: [-3, 1, 2], intensity: 0.9, color: '#fce4f0' },  // riempimento rosa caldo
    { pos: [3, -2, 1], intensity: 0.5, color: '#f0e8ff' },  // accento basso
  ];
  for (const s of specs) {
    const light = new THREE.DirectionalLight(s.color, s.intensity);
    light.position.set(s.pos[0], LOGO_Y + s.pos[1], s.pos[2]);
    light.target = target;
    root.add(light);
  }
}


// Rotazione del logo attorno al suo asse, rispetto alla direzione del telefono: il dondolio
// della home (LogoModel nel mondo: ±10°, lento). Il giro completo di prima, ogni 9 secondi,
// a meta' mostrava il logo di taglio e di schiena: in prospettiva sembrava ribaltarsi.
function logoTurn(time) {
  return Math.sin(time * 0.3) * (Math.PI / 18);
}

// ─── Assemblaggio ──────────────────────────────────────────────────────
export async function createHologram({ logoUrl }) {
  const root = new THREE.Group();
  root.name = 'artismi-hologram';

  const floor = makeFloorCaustics();
  const { coin, ticks } = makeCoin();
  const cone = makeCone();
  const particles = makeParticles();
  const { geo: logoGeo, toGltf } = await loadLogoGeometry(logoUrl);
  const logo = makeLogo(logoGeo);
  root.add(floor, coin, cone, particles, logo.pivot, logo.look.composite);
  addLogoLights(root);

  // Volume invisibile per il tocco: moneta, cono e logo.
  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(CONE_R1 * 0.85, COIN_R * 1.6, COIN_H + CONE_H * 0.85, 24),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.position.y = (COIN_H + CONE_H * 0.85) / 2;
  root.add(hit);

  let time = 0;
  let introStart = 0;
  let lostAt = -Infinity;
  let departing = false;
  // Il logo sta fermo sul biglietto, come un oggetto vero: rivolto verso il lato da cui si legge
  // il biglietto, inclinato all'indietro di LOGO_LEAN (col telefono sopra il tavolo si legge di
  // fronte). Girandoci intorno lo si vede di lato e di dietro. Gli resta solo il dondolio.
  const qLean = new THREE.Quaternion().setFromAxisAngle(X_AXIS, LOGO_LEAN), qSpin = new THREE.Quaternion();

  return {
    root,
    hitTargets: [hit],
    // Per il volo verso la home: il pivot del logo e la matrice che porta la nostra
    // geometria nello spazio della scena glTF disegnata dalla home.
    logo: { pivot: logo.pivot, toGltf, composite: logo.look.composite },

    // Da chiamare a ogni fotogramma prima di disegnare la scena che contiene il ritaglio.
    renderLogo(renderer, camera, environment) {
      logo.look.render(renderer, camera, logo.pivot, environment);
    },

    // Come si sta girando il logo (per #debug).
    pose: () => ({ lean: LOGO_LEAN, turn: logoTurn(time) }),

    // Moneta, cono e particelle si spengono; il logo resta e continua a girare.
    depart() {
      departing = true;
    },
    setLogoFade(v) {
      shared.uLogoFade.value = v;
    },

    // Ricomincia l'apertura solo se il QR è sparito per più di un attimo.
    show() {
      if (time - lostAt > 1.2) introStart = time;
    },
    hide() {
      lostAt = time;
    },
    pulse() {
      shared.uBoost.value = 1.4;
    },
    setViewportHeight(px) {
      particles.material.uniforms.uPx.value = px;
    },

    update(dt, camera) {
      dt = Math.min(dt, 0.1);
      time += dt;
      const t = time - introStart;

      shared.uTime.value = time;
      shared.uBoost.value = Math.max(0, shared.uBoost.value - dt * 2.2);
      if (departing) {
        shared.uFade.value = Math.max(0, shared.uFade.value - dt / 0.45);
        // la moneta e' metallo pieno, non sfuma: si ritira insieme alla luce
        coin.scale.setScalar(Math.max(0.001, easeOut(shared.uFade.value)));
        return;
      }
      shared.uFade.value = phase(t, 0, 0.35);
      const open = easeOut(phase(t, 0.3, 1.2));
      shared.uOpen.value = open;

      coin.scale.setScalar(Math.max(0.001, easeBack(phase(t, 0, 0.5))));
      floor.scale.setScalar(0.3 + 0.7 * easeOut(phase(t, 0, 0.9)));
      ticks.rotation.z += dt * 0.5;

      logo.reveal.value = easeInOut(phase(t, 0.9, 2.1));

      // il dondolio intorno all'asse del logo inclinato (come un piatto), non intorno al biglietto
      qSpin.setFromAxisAngle(Y_AXIS, logoTurn(time));
      logo.pivot.quaternion.copy(qLean).multiply(qSpin);
      logo.pivot.position.y = LOGO_Y + Math.sin(time * 1.4) * 0.02;
    },
  };
}
