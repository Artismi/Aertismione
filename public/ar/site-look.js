// Il logo "come sul sito": ogni fotogramma lo si disegna fuori schermo nell'ambiente della home
// (fondale a caustiche, vetro di LogoModel.tsx, le sue quattro luci, tone mapping ACES come
// React Three Fiber) dallo stesso punto di vista della camera AR. Poi lo si ritaglia sulla
// sagoma del logo e lo si posa nella scena: dentro le lettere il vetro della home con il rosa
// che traspare, fuori la stanza vista dalla fotocamera.
import * as THREE from 'three';
import { CAUSTICS_GLSL } from '/ar/caustics.js';

const RT_SCALE = 0.75; // risoluzione del passaggio fuori schermo rispetto allo schermo

// ACES Filmic di three.js (quello che R3F applica in home). Fuori schermo three.js non
// definisce le funzioni di tone mapping, quindi la formula è riportata qui.
const ACES_GLSL = /* glsl */ `
  vec3 arRRTAndODTFit(vec3 v) {
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
  }
  vec3 arACESFilmic(vec3 color) {
    const mat3 inM = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
    const mat3 outM = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
    color *= 1.0 / 0.6;
    color = outM * arRRTAndODTFit(inM * color);
    return clamp(color, 0.0, 1.0);
  }
`;

function revealChunk() {
  return /* glsl */ `
    float yN = (vObjY - uMinY) / (uMaxY - uMinY);
    if (yN > uReveal + 0.002) discard;`;
}

export function createSiteLook({ geo, reveal, minY, maxY, logoFade, time }) {
  const siteScene = new THREE.Scene();
  const maskScene = new THREE.Scene();
  const logoMatrix = new THREE.Matrix4();

  // Fondale della home a tutto schermo, colori grezzi come in CausticsPlane.tsx.
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uRes;
      ${CAUSTICS_GLSL}
      void main() {
        vec2 uv = gl_FragCoord.xy / uRes.y * 18.0;
        gl_FragColor = vec4(caustics(uv, uTime).rgb, 1.0);
      }
    `,
    uniforms: { uTime: time, uRes: { value: new THREE.Vector2(1, 1) } },
    depthTest: false,
    depthWrite: false,
  }));
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -10;
  siteScene.add(backdrop);

  const common = { uReveal: reveal, uMinY: minY, uMaxY: maxY };
  const objYVertex = /* glsl */ `
    varying float vObjY;
    void main() {
      vObjY = position.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Pre-passata di profondità: il vetro mostra il fondale, mai le proprie parti nascoste.
  const depth = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: common,
    vertexShader: objYVertex,
    fragmentShader: `uniform float uReveal, uMinY, uMaxY; varying float vObjY;
      void main() { ${revealChunk()} gl_FragColor = vec4(0.0); }`,
    colorWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 2,
  }));

  // Il vetro di LogoModel.tsx, con gli stessi parametri.
  const glass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#eef5ff'),
    emissive: new THREE.Color('#c8e8ff'),
    emissiveIntensity: 0.32,
    roughness: 0.0,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    envMapIntensity: 5.5,
    transparent: true,
    depthWrite: false,
    depthFunc: THREE.LessEqualDepth,
    side: THREE.FrontSide,
  });
  glass.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, common);
    shader.vertexShader = 'varying float vObjY;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\n  vObjY = position.y;');
    shader.fragmentShader = 'uniform float uReveal, uMinY, uMaxY;\nvarying float vObjY;\n' + ACES_GLSL + shader.fragmentShader
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>' + revealChunk())
      .replace('#include <alphamap_fragment>', `#include <alphamap_fragment>
        float NdotV = abs(dot(normalize(vNormal), normalize(vViewPosition)));
        diffuseColor.a *= 0.18 + NdotV * NdotV * NdotV * 0.74;`)
      // Fuori schermo three.js non applica tone mapping né conversione sRGB: li si fa qui,
      // come R3F sullo schermo della home (ACES + sRGB), così i colori combaciano.
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        gl_FragColor.rgb = sRGBTransferOETF(vec4(arACESFilmic(gl_FragColor.rgb), 1.0)).rgb;
        float band = smoothstep(0.06, 0.0, abs(yN - uReveal)) * step(uReveal, 0.999);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.93, 0.96), band);
        gl_FragColor.a = max(gl_FragColor.a, band);`);
  };
  const body = new THREE.Mesh(geo, glass);
  body.renderOrder = 2;

  // Contorno vetro satinato della home (rumore lungo la linea, indaco).
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.ShaderMaterial({
    uniforms: { ...common, u_opacity: { value: 0.32 } },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      varying float vObjY;
      void main() {
        vPos = position;
        vObjY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float u_opacity, uReveal, uMinY, uMaxY;
      varying vec3 vPos;
      varying float vObjY;
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      void main() {
        ${revealChunk()}
        float n = hash(vPos * 600.0);
        vec3 col = mix(vec3(0.08, 0.07, 0.18), vec3(0.18, 0.16, 0.30), n);
        gl_FragColor = vec4(col, u_opacity * (0.55 + 0.45 * n));
      }
    `,
    transparent: true,
    depthWrite: false,
    depthFunc: THREE.LessEqualDepth,
  }));
  edges.renderOrder = 3;

  const logo = new THREE.Group();
  logo.matrixAutoUpdate = false;
  logo.add(depth, body, edges);
  siteScene.add(logo);

  // Le quattro luci della home, fisse rispetto alla camera come lì (camera ferma, logo davanti).
  // Direzioni dalla luce al logo nello spazio camera; intensità = intensità/distanza² della home.
  const lights = new THREE.Group();
  for (const s of [
    { dir: [0, 4, -3], i: 0.72, c: '#ffffff' },
    { dir: [0, 0, 4], i: 0.75, c: '#e8f4ff' },
    { dir: [3, 1, -2], i: 0.58, c: '#fce4f0' },
    { dir: [-3, -2, -1], i: 0.37, c: '#f0e8ff' },
  ]) {
    const l = new THREE.DirectionalLight(s.c, s.i);
    l.position.set(...s.dir);
    lights.add(l, l.target);
  }
  siteScene.add(lights);

  // Sagoma del logo (con lo stesso "stampaggio" dal basso): è la maschera del ritaglio.
  const maskMesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: common,
    vertexShader: objYVertex,
    fragmentShader: `uniform float uReveal, uMinY, uMaxY; varying float vObjY;
      void main() { ${revealChunk()} gl_FragColor = vec4(1.0); }`,
  }));
  const maskLogo = new THREE.Group();
  maskLogo.matrixAutoUpdate = false;
  maskLogo.add(maskMesh);
  maskScene.add(maskLogo);

  const rtOpts = { samples: 4, depthBuffer: true };
  const rtColor = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const rtMask = new THREE.WebGLRenderTarget(1, 1, rtOpts);

  // Il ritaglio: un quad a schermo intero che prende il colore dove c'è la sagoma.
  const composite = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D tColor, tMask;
      uniform vec2 uRes;
      uniform float uLogoFade;
      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;
        float m = texture2D(tMask, uv).r;
        if (m < 0.002) discard;
        gl_FragColor = vec4(texture2D(tColor, uv).rgb, m * uLogoFade);
      }
    `,
    uniforms: { tColor: { value: rtColor.texture }, tMask: { value: rtMask.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uLogoFade: logoFade },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }));
  composite.frustumCulled = false;
  composite.renderOrder = 6; // dopo la parete posteriore del cono, prima del velo anteriore

  const size = new THREE.Vector2();
  const clear = new THREE.Color();
  // La scena della home si disegna in coordinate camera, con una camera che guarda lungo -Z
  // come quella del sito: luce d'ambiente e luci arrivano sul vetro dalle stesse direzioni
  // della home qualunque sia l'orientamento del telefono.
  const viewCam = new THREE.PerspectiveCamera();

  return {
    composite,
    /** Disegna il logo nell'ambiente della home dal punto di vista di `camera`. */
    render(renderer, camera, pivot, environment) {
      renderer.getDrawingBufferSize(size);
      const w = Math.max(1, Math.round(size.x * RT_SCALE));
      const h = Math.max(1, Math.round(size.y * RT_SCALE));
      if (rtColor.width !== w || rtColor.height !== h) { rtColor.setSize(w, h); rtMask.setSize(w, h); }
      backdrop.material.uniforms.uRes.value.set(w, h);
      composite.material.uniforms.uRes.value.copy(size);

      pivot.updateWorldMatrix(true, false);
      camera.updateMatrixWorld();
      logoMatrix.multiplyMatrices(camera.matrixWorldInverse, pivot.matrixWorld);
      logo.matrix.copy(logoMatrix);
      maskLogo.matrix.copy(logoMatrix);
      logo.matrixWorldNeedsUpdate = maskLogo.matrixWorldNeedsUpdate = true;
      viewCam.projectionMatrix.copy(camera.projectionMatrix);
      viewCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
      siteScene.environment = environment;

      const prevTarget = renderer.getRenderTarget();
      const prevAlpha = renderer.getClearAlpha();
      renderer.getClearColor(clear);
      const prevAutoClear = renderer.autoClear;
      renderer.autoClear = true;
      renderer.setClearColor(0x000000, 0);
      renderer.setRenderTarget(rtColor);
      renderer.render(siteScene, viewCam);
      renderer.setRenderTarget(rtMask);
      renderer.render(maskScene, viewCam);
      renderer.setRenderTarget(prevTarget);
      renderer.setClearColor(clear, prevAlpha);
      renderer.autoClear = prevAutoClear;
    },
  };
}
