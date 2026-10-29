// L'ologramma agganciato al biglietto, senza scatti.
//
// MindAR stima a ogni lettura dove sta il biglietto. Il biglietto resta quasi sempre al posto
// giusto, ma l'ologramma e' molto piu' grande del biglietto: un errore di pochi gradi
// nell'inclinazione, invisibile sulla carta, sposta la sua cima di centimetri. E da lontano,
// o di taglio, la stima a volte si ribalta (l'inclinazione speculare: un piano visto da lontano
// sembra uguale inclinato di qua o di la').
//
// Qui l'ologramma non sta sull'ancora di MindAR ma su un gruppo suo, che segue la posa rigida
// dell'ancora (posizione e rotazione; MindAR ha il suo filtro spento, vedi app.js, perche'
// filtrava i sedici numeri della matrice uno per uno e nei movimenti la deformava):
//  - la scala e' quella del biglietto, fissa: il biglietto non cambia misura;
//  - rotazione e posizione passano da un filtro One Euro: da fermi il tremolio si smorza, piu'
//    ci si muove piu' si segue da vicino;
//  - una rotazione che salta piu' di quanto una mano possa girare in quell'istante e' una lettura
//    ribaltata: si ignora, a meno che non si ripeta uguale per qualche fotogramma (allora era vera).
//
// I valori sono tarati su video sintetici del biglietto con posa nota (in verticale e in
// orizzontale, allontanandosi, inclinando, girando): misurano dove finisce la cima dell'ologramma.
import * as THREE from 'three';

const DEFAULTS = {
  minCut: 0.8,       // Hz: da fermi, quanto si smorza la rotazione
  beta: 1.5,         // quanto la velocita' di rotazione (rad/s) apre il filtro
  minCutP: 3.6,      // Hz: lo stesso per la posizione (la posizione di MindAR e' precisa)
  betaP: 1,          // quanto la velocita' (distanze/s) apre il filtro della posizione
  dCut: 1.0,         // Hz: la stima della velocita'
  gateDeg: 7,        // un salto di rotazione oltre questo (piu' quanto si gira in dt) e' sospetto
  maxDegPerSec: 130, // quanto una mano puo' girare il telefono
  candTolDeg: 3.7,   // le letture sospette che si somigliano entro questo sono la stessa posa
  confirmFrames: 7,  // tante letture sospette uguali di fila (~230 ms): la posa era vera
};

const alpha = (fc, dt) => 1 / (1 + 1 / (2 * Math.PI * fc * dt));

export function createStabilizer(anchorGroup, options) {
  const o = { ...DEFAULTS, ...options };
  const group = new THREE.Group();
  group.matrixAutoUpdate = false;
  group.visible = false;

  const pM = new THREE.Vector3(), qM = new THREE.Quaternion(), sM = new THREE.Vector3();
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  const candQ = new THREE.Quaternion();
  let ready = false, last = 0, speedR = 0, speedP = 0, cand = 0;

  function reset() { ready = false; cand = 0; speedR = 0; speedP = 0; }

  function update(now = performance.now()) {
    if (!anchorGroup.visible) { group.visible = false; if (ready) reset(); return; }
    anchorGroup.matrix.decompose(pM, qM, sM);

    if (!ready) {
      p.copy(pM); q.copy(qM); s.copy(sM); ready = true; last = now;
    } else {
      const dt = THREE.MathUtils.clamp((now - last) / 1000, 1 / 120, 0.25);
      last = now;
      const ang = q.angleTo(qM);
      const gate = THREE.MathUtils.degToRad(o.gateDeg + o.maxDegPerSec * dt);
      const dist = Math.max(1e-6, p.length());

      // la posizione non si ribalta: si segue sempre
      const vP = pM.distanceTo(p) / dist / dt;
      speedP += (vP - speedP) * alpha(o.dCut, dt);
      p.lerp(pM, alpha(o.minCutP + o.betaP * speedP, dt));

      if (ang > gate) {
        // sospetta: si tiene la rotazione di prima, finche' la stessa lettura non si ripete
        if (cand && candQ.angleTo(qM) < THREE.MathUtils.degToRad(o.candTolDeg)) cand += 1;
        else { cand = 1; candQ.copy(qM); }
        if (cand >= o.confirmFrames) { q.slerp(qM, 0.5); cand = 0; speedR = 0; }
      } else {
        cand = 0;
        speedR += (ang / dt - speedR) * alpha(o.dCut, dt);
        q.slerp(qM, alpha(o.minCut + o.beta * speedR, dt));
      }
    }
    group.matrix.compose(p, q, s);
    group.matrixWorldNeedsUpdate = true;
    group.visible = true;
  }

  return { group, update, reset };
}
