// Dalla realtà aumentata alla home senza stacchi.
// La home si carica subito in un iframe invisibile; al tocco il logo AR lascia il biglietto,
// vola nella posa esatta del logo della home (che la home pubblica in window.__artismiLogo,
// vedi LogoModel.tsx) e ci si dissolve sopra. Poi l'iframe diventa la pagina.
import * as THREE from 'three';

const HOME_URL = '/';
const DURATION = 2.4; // il movimento di camera, dal biglietto alla home

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
 * Il volo verso la home, da regista: il logo resta dov'e' sul biglietto e si muove la camera.
 * A ogni fotogramma si calcola dove dovrebbe stare la camera perche' il logo AR si veda
 * esattamente come quello della home (stessa posizione sullo schermo, grandezza, rotazione:
 * window.__artismiLogo, vedi LogoModel.tsx) e la si porta li', con un movimento morbido. Con il
 * logo si muove tutto: biglietto, moneta, cono e la stanza, congelata su un piano alla distanza
 * del biglietto (roomPhoto), che si allontana in prospettiva. Intanto dietro si accende la home;
 * arrivati, il logo AR si dissolve in quello della home.
 *
 * @param {object} o
 * @param {THREE.WebGLRenderer} o.renderer   renderer che sta disegnando l'ologramma
 * @param {THREE.PerspectiveCamera} o.camera la sua camera (quella della fotocamera o dell'anteprima)
 * @param {THREE.Scene} o.scene              la scena di partenza: resta tutta in scena e si allontana
 * @param {object} o.holo                    ologramma (createHologram)
 * @param {(v:number)=>void} o.fadeSource    sfuma ciò che c'è dietro (video della fotocamera o anteprima)
 * @param {()=>void} o.stopSource            spegne fotocamera/anteprima a volo finito
 * @param {(()=>HTMLCanvasElement|null)} [o.roomPhoto] l'ultimo fotogramma della fotocamera, come si vede sullo schermo
 */
export function flyToHome({ renderer, camera, scene, holo, fadeSource, stopSource, roomPhoto }) {
  preloadHome();
  const pivot = holo.logo.pivot;
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  holo.depart();
  holo.pulse();

  const flyCam = new THREE.PerspectiveCamera(camera.fov ?? 35, camera.aspect ?? innerWidth / innerHeight, camera.near * 0.05, camera.far);
  const start = decompose(camera.matrixWorld);
  const fov0 = flyCam.fov;

  // La stanza: l'ultimo fotogramma su un piano che copre esattamente l'inquadratura, alla distanza
  // del logo. Al primo istante e' identico al video, che si spegne; poi si allontana con il resto.
  let room = null;
  const photo = roomPhoto?.();
  if (photo) {
    const logoPos = new THREE.Vector3().setFromMatrixPosition(pivot.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
    const d = Math.max(1e-3, -logoPos.z);
    const h = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tex = new THREE.CanvasTexture(photo);
    tex.colorSpace = THREE.SRGBColorSpace;
    room = new THREE.Mesh(new THREE.PlaneGeometry(h * camera.aspect, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
    room.position.set(0, 0, -d).applyMatrix4(camera.matrixWorld);
    room.quaternion.copy(start.quat);
    room.renderOrder = -100;
    scene.add(room);
    fadeSource(0);
  }

  // Dove deve stare la camera perche' il logo si veda come in home: camera = logo · (logo in camera)⁻¹.
  // La scala si lascia: una camera scalata insieme al mondo vede la stessa immagine.
  const target = new THREE.Matrix4();
  const camEnd = new THREE.Matrix4();
  const readTarget = () => {
    const b = homeLogo();
    if (b) target.fromArray(b.cameraSpace).multiply(holo.logo.toGltf);
    else target.copy(fallbackPose(holo.logo.toGltf).matrix);
    pivot.updateWorldMatrix(true, false);
    camEnd.multiplyMatrices(pivot.matrixWorld, target.clone().invert());
    return { fov: b ? b.fov : 35, end: decompose(camEnd) };
  };

  const pos = new THREE.Vector3();
  const q = new THREE.Quaternion();
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
      holo.update(dt);
      const { fov, end } = readTarget();

      pos.lerpVectors(start.pos, end.pos, e);
      q.copy(start.quat).slerp(end.quat, e);
      flyCam.position.copy(pos);
      flyCam.quaternion.copy(q);
      flyCam.fov = THREE.MathUtils.lerp(fov0, fov, e);
      flyCam.aspect = innerWidth / innerHeight;
      flyCam.updateProjectionMatrix();
      flyCam.updateMatrixWorld(true);

      if (!room) fadeSource(1 - phase(u, 0.08, 0.6));
      else room.material.opacity = 1 - phase(u, 0.3, 0.8);
      frame.style.opacity = String(phase(u, 0.25, 0.8));
      // Arrivato in posizione, il nostro logo si dissolve in quello della home.
      if (u > 0.8) holdHomeLogo(false);
      holo.setLogoFade(1 - phase(u, 0.84, 1));

      holo.renderLogo(renderer, flyCam, scene.environment);
      renderer.render(scene, flyCam);

      if (u >= 1) {
        renderer.setAnimationLoop(null);
        if (room) { room.removeFromParent(); room.material.map.dispose(); room.material.dispose(); room.geometry.dispose(); }
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
