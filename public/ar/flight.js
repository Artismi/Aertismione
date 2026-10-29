// Dalla realtà aumentata alla home senza stacchi.
// La home si carica subito in un iframe invisibile; al tocco il logo AR lascia il biglietto,
// vola nella posa esatta del logo della home (che la home pubblica in window.__artismiLogo,
// vedi LogoModel.tsx) e ci si dissolve sopra. Poi l'iframe diventa la pagina.
import * as THREE from 'three';

const HOME_URL = '/';
const DURATION = 1.8;
const SPIN = 0; // rad/s: sul biglietto il logo non gira piu' su se stesso (dondola come in home), e nel volo nemmeno

let frame = null;

export function preloadHome() {
  if (frame) return frame;
  frame = document.createElement('iframe');
  frame.id = 'home';
  frame.src = HOME_URL;
  frame.title = 'Artismi Design Studio';
  frame.tabIndex = -1;
  frame.setAttribute('aria-hidden', 'true');
  document.body.prepend(frame);
  return frame;
}

function homeWindow() {
  try {
    const w = frame?.contentWindow;
    return w && w.location.href !== 'about:blank' ? w : null; // lancia se l'iframe non è dello stesso sito
  } catch {
    return null;
  }
}

function homeLogo() {
  const b = homeWindow()?.__artismiLogo;
  return b && b.loaded && b.visible && b.cameraSpace?.length === 16 ? b : null;
}

// Nasconde il logo della home mentre il nostro vola (vedi `hold` in LogoModel.tsx).
function holdHomeLogo(hold) {
  const b = homeWindow()?.__artismiLogo;
  if (b) b.hold = hold;
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const phase = (t, a, b) => clamp01((t - a) / (b - a));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function decompose(m) {
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  m.decompose(pos, quat, scale);
  return { pos, quat, scale };
}

// Posa di ripiego se la home non è ancora pronta: logo al centro, di fronte, largo
// quanto in home (2.86 unità a 6 dalla camera).
function fallbackPose(toGltf) {
  const homeScale = 2.86 / 1.5;
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(0, -0.2, -6),
    new THREE.Quaternion(),
    new THREE.Vector3(homeScale, homeScale, homeScale),
  );
  return { matrix: m, fov: 35, toGltf };
}

/**
 * @param {object} o
 * @param {THREE.WebGLRenderer} o.renderer   renderer che sta disegnando l'ologramma
 * @param {THREE.Camera} o.camera            la sua camera
 * @param {THREE.Scene} o.scene              la scena di partenza (continua a essere disegnata mentre si spegne)
 * @param {object} o.holo                    ologramma (createHologram)
 * @param {(v:number)=>void} o.fadeSource    sfuma ciò che c'è dietro (video della fotocamera o anteprima)
 * @param {()=>void} o.stopSource            spegne fotocamera/anteprima a volo finito
 */
export function flyToHome({ renderer, camera, scene, holo, fadeSource, stopSource }) {
  preloadHome();
  const pivot = holo.logo.pivot;
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  // Il logo passa in una scena sua, in coordinate camera.
  const start = decompose(new THREE.Matrix4().multiplyMatrices(camera.matrixWorldInverse, pivot.matrixWorld));
  const flyScene = new THREE.Scene();
  flyScene.environment = scene.environment;
  const flyCam = new THREE.PerspectiveCamera(camera.fov ?? 35, camera.aspect ?? innerWidth / innerHeight, 0.01, 1000);
  pivot.removeFromParent();
  pivot.matrixAutoUpdate = false;
  flyScene.add(pivot, holo.logo.composite);
  holo.depart();
  holo.pulse();

  const target = new THREE.Matrix4();
  const readTarget = () => {
    const b = homeLogo();
    if (b) {
      target.fromArray(b.cameraSpace).multiply(holo.logo.toGltf);
      return { fov: b.fov, ready: true };
    }
    const f = fallbackPose(holo.logo.toGltf);
    target.copy(f.matrix);
    return { fov: f.fov, ready: false };
  };

  // Stessa proiezione, unità diverse: in AR le distanze sono in pixel. Si riscala la partenza
  // (posizione e scala insieme non cambiano l'immagine) per interpolare tra grandezze simili.
  readTarget();
  const k = start.pos.length() / Math.max(1e-6, decompose(target).pos.length());
  start.pos.divideScalar(k);
  start.scale.divideScalar(k);
  const fov0 = flyCam.fov;

  const spinQ = new THREE.Quaternion();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const logScale0 = new THREE.Vector3(Math.log(start.scale.x), Math.log(start.scale.y), Math.log(start.scale.z));
  const yAxis = new THREE.Vector3(0, 1, 0);

  frame.classList.add('arriving');
  document.body.dataset.state = 'flying';
  holdHomeLogo(true);

  return new Promise((resolve) => {
    const clock = new THREE.Clock();
    let t = 0;
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1);
      t += dt;
      const u = clamp01(t / DURATION);
      const e = easeInOut(u);
      const { fov } = readTarget();
      const end = decompose(target);

      // Continua a girare alla stessa velocità e intanto converge sulla posa della home.
      spinQ.setFromAxisAngle(yAxis, SPIN * t);
      q.copy(start.quat).multiply(spinQ).slerp(end.quat, e);
      pos.lerpVectors(start.pos, end.pos, e);
      scl.set(
        Math.exp(THREE.MathUtils.lerp(logScale0.x, Math.log(end.scale.x), e)),
        Math.exp(THREE.MathUtils.lerp(logScale0.y, Math.log(end.scale.y), e)),
        Math.exp(THREE.MathUtils.lerp(logScale0.z, Math.log(end.scale.z), e)),
      );
      pivot.matrix.compose(pos, q, scl);
      pivot.matrixWorldNeedsUpdate = true;
      flyCam.fov = THREE.MathUtils.lerp(fov0, fov, e);
      flyCam.aspect = innerWidth / innerHeight;
      flyCam.updateProjectionMatrix();

      fadeSource(1 - phase(u, 0.08, 0.6));
      frame.style.opacity = String(phase(u, 0.15, 0.7));
      // Arrivato in posizione, il nostro logo si dissolve in quello della home.
      if (u > 0.8) holdHomeLogo(false);
      holo.setLogoFade(1 - phase(u, 0.84, 1));
      holo.update(dt);

      holo.renderLogo(renderer, flyCam, flyScene.environment);
      renderer.render(scene, camera);
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(flyScene, flyCam);
      renderer.autoClear = autoClear;

      if (u >= 1) {
        renderer.setAnimationLoop(null);
        takeOver(stopSource);
        resolve();
      }
    });
  });
}

// Senza logo da far volare (QR non inquadrato, pulsante in basso): solo dissolvenza.
export function fadeToHome(stopSource) {
  preloadHome();
  document.body.dataset.state = 'flying';
  frame.classList.add('arriving');
  const t0 = performance.now();
  return new Promise((resolve) => {
    const step = () => {
      const u = clamp01((performance.now() - t0) / 700);
      frame.style.opacity = String(easeInOut(u));
      if (u < 1) requestAnimationFrame(step);
      else { takeOver(stopSource); resolve(); }
    };
    requestAnimationFrame(step);
  });
}

// L'iframe diventa la pagina: indirizzo e titolo seguono la navigazione al suo interno.
function takeOver(stopSource) {
  try { stopSource(); } catch { /* fotocamera già chiusa */ }
  const w = homeWindow();
  if (!w) {
    location.href = HOME_URL; // iframe non accessibile: navigazione normale
    return;
  }
  document.body.dataset.state = 'home';
  frame.classList.remove('arriving');
  frame.classList.add('active');
  frame.removeAttribute('aria-hidden');
  frame.removeAttribute('tabindex');
  frame.style.opacity = '1';
  for (const id of ['stage', 'preview', 'bg']) document.getElementById(id)?.replaceChildren();
  frame.focus();

  let timer = 0;
  const sync = () => {
    try {
      const loc = w.location;
      const url = loc.pathname + loc.search + loc.hash;
      if (url !== location.pathname + location.search + location.hash) history.replaceState(null, '', url);
      if (w.document.title && document.title !== w.document.title) document.title = w.document.title;
    } catch { /* l'iframe è uscito dal sito: non c'è più nulla da seguire */
      clearInterval(timer);
    }
  };
  sync();
  timer = setInterval(sync, 400);
}
