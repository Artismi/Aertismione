// Flusso della pagina /ar: intro → fotocamera (MindAR, tracking del QR) → ologramma → tocco → sito.
// Senza fotocamera (desktop, permesso negato, browser interni alle app) mostra un'anteprima 3D.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { createHologram } from '/ar/hologram.js';
import { makeCausticsBackdropQuad, mountCausticsBackground } from '/ar/caustics.js';
import { preloadHome, flyToHome, fadeToHome } from '/ar/flight.js';

const LOGO_URL = '/ar/assets/logo-ar.glb';
const TARGET_URL = '/ar/assets/target.mind'; // compilato dal fronte del biglietto
const CARD_URL = '/ar/assets/card-front.png';

// Biglietto 85×55 mm. L'ologramma è disegnato in unità da 25 mm e nasce dal centro
// del biglietto, ingrandito 4 volte.
const CARD_MM = { w: 85, h: 55 };
const HOLO_UNIT_MM = 25;
const HOLO_SCALE = 4;

const $ = (id) => document.getElementById(id);
const setState = (s) => { document.body.dataset.state = s; };

const hasCamera = !!navigator.mediaDevices?.getUserMedia;
const isTouch = matchMedia('(pointer: coarse)').matches;

let leaving = false;
let stopIntroBackground = () => {};
// Ciò che serve per far volare il logo dalla scena attiva (AR o anteprima) alla home.
let flight = null;

function goHome({ fly }) {
  if (leaving) return;
  leaving = true;
  navigator.vibrate?.(30);
  stopIntroBackground();
  if (fly && flight) flyToHome(flight);
  else fadeToHome(flight?.stopSource ?? (() => {}));
}

// La stessa luce d'ambiente della home: <Environment preset="studio" /> di drei carica
// questo HDR, ed è lui a dare al vetro i bagliori bianchi. Finché non arriva si usa
// l'ambiente sintetico di three.js.
const STUDIO_HDR = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/studio_small_03_1k.hdr';
let studioTexture = null;

function withEnvironment(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();
  const apply = (tex) => { scene.environment = tex; };
  if (studioTexture) { apply(studioTexture); return; }
  new RGBELoader().loadAsync(STUDIO_HDR).then((tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    studioTexture = tex;
    apply(tex);
  }).catch((err) => console.warn('HDR studio non caricato, resta l’ambiente sintetico', err));
}

// Un tocco (non un trascinamento) sull'ologramma porta al sito.
function onTap(el, cb) {
  let down = null;
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  el.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved < 12 && performance.now() - down.t < 600) cb(e);
    down = null;
  });
}

function hitTest(e, canvas, camera, targets) {
  const r = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  const ray = new THREE.Raycaster();
  ray.setFromCamera(ndc, camera);
  return ray.intersectObjects(targets, false).length > 0;
}

// ─── Realtà aumentata ──────────────────────────────────────────────────
let arStarted = false;

async function startAR() {
  if (arStarted) return; // un doppio tocco su "Attiva" non deve aprire due sessioni
  arStarted = true;
  setState('loading');
  const stage = $('stage');
  let mindar;
  try {
    const { MindARThree } = await import('mindar-image-three');
    mindar = new MindARThree({
      container: stage,
      imageTargetSrc: TARGET_URL,
      maxTrack: 1,
      uiLoading: 'no',
      uiScanning: 'no',
      uiError: 'no',
      // Filtro One Euro: smorza il tremolio fine da fermi ma segue subito i movimenti.
      // Valori più aggressivi (minCF 0.0001, beta 0.001) facevano restare l'ologramma
      // indietro di secondi quando il telefono si sposta.
      filterMinCF: 0.001,
      filterBeta: 50,
      warmupTolerance: 3,
      // L'ologramma è grande e si guarda da lontano: brevi perdite del biglietto non lo spengono.
      missTolerance: 20,
    });
    const { renderer, scene, camera } = mindar;
    withEnvironment(renderer, scene);
    scene.add(new THREE.HemisphereLight('#eef5ff', '#2a2350', 1.2));

    const holo = await createHologram({ logoUrl: LOGO_URL });
    // L'ancora è il fronte del biglietto: origine al centro, 1 = larghezza del biglietto.
    holo.root.rotation.x = Math.PI / 2; // Y dell'ologramma = normale uscente dal biglietto
    holo.root.scale.setScalar((HOLO_SCALE * HOLO_UNIT_MM) / CARD_MM.w);
    const anchor = mindar.addAnchor(0);
    anchor.group.add(holo.root);
    if (location.hash === '#debug') window.__ar = { THREE, scene, camera, renderer, holo, anchor };
    anchor.onTargetFound = () => { holo.show(); if (!leaving) setState('found'); };
    anchor.onTargetLost = () => { holo.hide(); if (!leaving) setState('scanning'); };

    await mindar.start();
    setState('scanning');
    flight = {
      renderer, camera, scene, holo,
      fadeSource: (v) => { const video = stage.querySelector('video'); if (video) video.style.opacity = String(v); },
      stopSource: () => mindar.stop(),
    };

    const syncSize = () => holo.setViewportHeight(renderer.domElement.height);
    syncSize();
    addEventListener('resize', syncSize);

    stopIntroBackground();
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      holo.update(clock.getDelta(), camera);
      if (anchor.visible) holo.renderLogo(renderer, camera, scene.environment);
      renderer.render(scene, camera);
    });

    onTap(stage, (e) => {
      if (anchor.visible && hitTest(e, renderer.domElement, camera, holo.hitTargets)) goHome({ fly: true });
    });
    $('go').onclick = (e) => { e.preventDefault(); goHome({ fly: anchor.visible }); };
  } catch (err) {
    console.warn('AR non disponibile', err);
    try { mindar?.stop(); } catch { /* niente da fermare */ }
    stage.replaceChildren();
    startPreview('denied');
  }
}

// ─── Anteprima senza fotocamera ────────────────────────────────────────
let previewStarted = false;
let stopPreview = () => {};

async function startPreview(reason) {
  stopIntroBackground();
  setState('preview');
  if (reason === 'denied') {
    $('preview-msg').textContent = 'Non riesco ad aprire la fotocamera. Se sei dentro un’app (Instagram, WhatsApp…), apri il link in Safari o Chrome.';
    $('retry').hidden = false;
  } else if (reason === 'nocamera') {
    $('preview-msg').textContent = 'Questo browser non dà accesso alla fotocamera: apri il link in Safari o Chrome.';
  }
  if (previewStarted) return;
  previewStarted = true;

  const host = $('preview');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  withEnvironment(renderer, scene);
  const backdrop = makeCausticsBackdropQuad();
  scene.add(backdrop);
  scene.add(new THREE.HemisphereLight('#fff4f8', '#99667f', 0.9));
  const sun = new THREE.DirectionalLight('#ffffff', 1.4);
  sun.position.set(2, 4, 3);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(35, host.clientWidth / host.clientHeight, 0.05, 100);

  // Il biglietto in unità dell'ologramma (25 mm), con il suo fronte stampato.
  const cardW = CARD_MM.w / HOLO_UNIT_MM;
  const cardH = CARD_MM.h / HOLO_UNIT_MM;
  const frontMap = new THREE.TextureLoader().load(CARD_URL);
  frontMap.colorSpace = THREE.SRGBColorSpace;
  frontMap.anisotropy = 8;
  const card = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.BoxGeometry(cardW, 0.014, cardH), new THREE.MeshStandardMaterial({ color: '#f6f4ef', roughness: 0.85 }));
  paper.position.y = -0.007;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(cardW, cardH), new THREE.MeshStandardMaterial({ map: frontMap, roughness: 0.9 }));
  front.rotation.x = -Math.PI / 2;
  front.position.y = 0.001;
  card.add(paper, front);
  scene.add(card);

  const holo = await createHologram({ logoUrl: LOGO_URL });
  if (location.hash === '#debug') window.__ar = { THREE, scene, camera, renderer, holo };
  holo.root.scale.setScalar(HOLO_SCALE);
  scene.add(holo.root);
  holo.show();

  // Orbita: trascina per girare, si muove piano da sola.
  const target = new THREE.Vector3(0, 3.6, 0);
  let theta = 0.5;
  let phi = 1.05;
  let idle = 0;
  let drag = null;
  host.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, theta, phi }; idle = 0; });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    theta = drag.theta - (e.clientX - drag.x) * 0.008;
    phi = Math.min(1.45, Math.max(0.35, drag.phi - (e.clientY - drag.y) * 0.006));
  });
  addEventListener('pointerup', () => { drag = null; });
  onTap(host, (e) => { if (hitTest(e, renderer.domElement, camera, holo.hitTargets)) goHome({ fly: true }); });
  $('go').onclick = (e) => { e.preventDefault(); goHome({ fly: true }); };

  const resize = () => {
    renderer.setSize(host.clientWidth, host.clientHeight);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    holo.setViewportHeight(renderer.domElement.height);
    backdrop.material.uniforms.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
  };
  addEventListener('resize', resize);
  resize();

  stopPreview = () => {
    renderer.setAnimationLoop(null);
    renderer.dispose();
    host.replaceChildren();
    previewStarted = false;
  };

  // Nel volo sfumano lo sfondo a caustiche e il biglietto; da trasparenti si disegnano
  // nell'ordine giusto (prima lo sfondo, renderOrder -10, poi la carta).
  const cardMaterials = [paper.material, front.material];
  flight = {
    renderer, camera, scene, holo,
    fadeSource: (v) => {
      backdrop.material.transparent = true;
      backdrop.material.uniforms.uAlpha.value = v;
      for (const m of cardMaterials) { m.transparent = true; m.opacity = v; }
    },
    stopSource: () => stopPreview(),
  };

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    idle += dt;
    if (!drag && idle > 2) theta += dt * 0.15;
    const dist = camera.aspect < 0.8 ? 30 : 21;
    camera.position.set(
      target.x + dist * Math.sin(phi) * Math.sin(theta),
      target.y + dist * Math.cos(phi),
      target.z + dist * Math.sin(phi) * Math.cos(theta),
    );
    camera.lookAt(target);
    backdrop.material.uniforms.uTime.value += dt;
    holo.update(dt, camera);
    holo.renderLogo(renderer, camera, scene.environment);
    renderer.render(scene, camera);
  });
}

// ─── Avvio ─────────────────────────────────────────────────────────────
// La home comincia a caricarsi subito, dietro alla richiesta della fotocamera.
preloadHome();

$('start').addEventListener('click', startAR);
$('retry').onclick = () => location.reload();
$('go').onclick = (e) => { e.preventDefault(); goHome({ fly: false }); };
$('skip').onclick = (e) => { e.preventDefault(); goHome({ fly: false }); };

// Tornando indietro dal sito la pagina può riaprirsi dalla cache con la fotocamera spenta.
addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });

if (!hasCamera) startPreview('nocamera');
else if (!isTouch) startPreview('desktop');
else {
  stopIntroBackground = mountCausticsBackground($('bg'));
  setState('intro');
}

// Da desktop si può comunque provare con la webcam.
if (hasCamera && !isTouch) {
  const retry = $('retry');
  retry.textContent = 'Prova con la webcam';
  retry.hidden = false;
  retry.onclick = () => { stopPreview(); startAR(); };
}
