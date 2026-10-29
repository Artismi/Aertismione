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
  gateDist: 0.12,    // un salto di distanza oltre questo (in proporzione, piu' quanto ci si muove in dt) e' sospetto
  maxDistPerSec: 1.5,// quanto in fretta si avvicina o allontana il telefono (in proporzione al secondo)
  candTolDist: 0.06, // le letture sospette entro questo (in proporzione alla distanza) sono la stessa posa
  showAfter: 3,      // si mostra dalla terza lettura dopo l'aggancio
  warmup: 5,         // le prime letture dopo l'aggancio si seguono subito: la prima posa di
                     // MindAR (quella del riconoscimento) e' imprecisa, e prenderla come
                     // riferimento faceva scartare come sospette le letture giuste che seguono
                     // (piu' di 5 e si accettano anche le letture ribaltate dell'inizio)
};

const alpha = (fc, dt) => 1 / (1 + 1 / (2 * Math.PI * fc * dt));

export function createStabilizer(anchorGroup, options) {
  const o = { ...DEFAULTS, ...options };
  const group = new THREE.Group();
  group.matrixAutoUpdate = false;
  group.visible = false;

  const pM = new THREE.Vector3(), qM = new THREE.Quaternion(), sM = new THREE.Vector3();
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  const candQ = new THREE.Quaternion(), candP = new THREE.Vector3();
  const lastRaw = new THREE.Matrix4();
  let ready = false, last = 0, speedR = 0, speedP = 0, cand = 0, warm = 0;

  function reset() { ready = false; cand = 0; speedR = 0; speedP = 0; warm = 0; }

  function update(now = performance.now()) {
    if (!anchorGroup.visible) { group.visible = false; if (ready) reset(); return; }
    // Si lavora solo quando MindAR ha una lettura nuova. Si disegna piu' spesso di quanto MindAR
    // legga (60 contro 20-30 al secondo): contando i fotogrammi disegnati, una sola lettura
    // ribaltata si "ripeteva" da sola fino a sembrare vera, e l'ologramma si capovolgeva.
    if (ready && anchorGroup.matrix.equals(lastRaw)) return;
    lastRaw.copy(anchorGroup.matrix);
    anchorGroup.matrix.decompose(pM, qM, sM);

    if (!ready) {
      p.copy(pM); q.copy(qM); s.copy(sM); ready = true; last = now; warm = 1;
    } else {
      const dt = THREE.MathUtils.clamp((now - last) / 1000, 1 / 120, 0.25);
      last = now;
      const ang = q.angleTo(qM);
      const gate = THREE.MathUtils.degToRad(o.gateDeg + o.maxDegPerSec * dt);
      const dist = Math.max(1e-6, p.length());
      // di quanto cambia la distanza dal telefono, in proporzione: avanti e indietro
      const dDist = Math.abs(pM.length() / dist - 1);
      const gateD = o.gateDist + o.maxDistPerSec * dt;

      if (warm < o.warmup) {
        // appena agganciato: si segue subito (la prima posa e' la meno precisa)
        warm += 1;
        p.lerp(pM, 0.6);
        q.slerp(qM, 0.6);
      } else if (ang > gate || dDist > gateD) {
        // sospetta (ribaltata, o di colpo molto piu' vicina o lontana): si tiene la posa di
        // prima, finche' la stessa lettura non si ripete
        if (cand && candQ.angleTo(qM) < THREE.MathUtils.degToRad(o.candTolDeg) && candP.distanceTo(pM) / dist < o.candTolDist) cand += 1;
        else { cand = 1; candQ.copy(qM); candP.copy(pM); }
        if (cand >= o.confirmFrames) { q.slerp(qM, 0.5); p.lerp(pM, 0.5); cand = 0; speedR = 0; speedP = 0; }
      } else {
        cand = 0;
        const vP = pM.distanceTo(p) / dist / dt;
        speedP += (vP - speedP) * alpha(o.dCut, dt);
        p.lerp(pM, alpha(o.minCutP + o.betaP * speedP, dt));
        speedR += (ang / dt - speedR) * alpha(o.dCut, dt);
        q.slerp(qM, alpha(o.minCut + o.beta * speedR, dt));
      }
    }
    group.matrix.compose(p, q, s);
    group.matrixWorldNeedsUpdate = true;
    // si mostra dalla terza lettura: la prima, quella del riconoscimento, sbaglia spesso la
    // distanza (l'ologramma compariva enorme, attaccato al telefono)
    group.visible = warm >= o.showAfter;
  }

  return { group, update, reset };
}
