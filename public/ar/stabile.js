// L'ologramma agganciato al biglietto, senza scatti.
//
// MindAR stima a ogni lettura dove sta il biglietto. Quando una parte esce dall'inquadratura (il QR in un
// angolo) restano meno punti da seguire e per qualche lettura la stima salta: rotazione sbagliata, biglietto
// piu' vicino o piu' lontano. L'ologramma e' molto piu' grande del biglietto, quindi il salto si vede tutto.
//
// Qui l'ologramma non sta piu' sull'ancora di MindAR ma su un gruppo suo, che segue l'ancora cosi':
//  - un salto brusco (rotazione, distanza o spostamento) si accetta solo se dura 150 ms: un movimento
//    vero dura, un errore di stima no;
//  - la scala resta quella del biglietto: cambia solo lentissimamente;
//  - da fermi il tremolio si smorza, nei movimenti ampi si segue subito.
import * as THREE from 'three';

const SALTO_GRADI = 9;      // rotazione oltre la quale una lettura e' sospetta
const SALTO_DIST = 0.1;     // variazione relativa della distanza (avanti/indietro)
const SALTO_LATO = 0.22;    // spostamento di lato, relativo alla distanza
const CONFERMA_MS = 150;    // per quanto un salto deve durare perche' ci si creda

export function createStabilizer(anchorGroup) {
  const group = new THREE.Group();
  group.matrixAutoUpdate = false;
  group.visible = false;

  const pM = new THREE.Vector3(), qM = new THREE.Quaternion(), sM = new THREE.Vector3();
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  const pS = new THREE.Vector3(), qS = new THREE.Quaternion(); // il salto in attesa di conferma
  let ready = false, salto0 = 0, seguo = false;

  function reset() { ready = false; salto0 = 0; seguo = false; }

  function update(now = performance.now()) {
    if (!anchorGroup.visible) { group.visible = false; if (ready) reset(); return; }
    anchorGroup.matrix.decompose(pM, qM, sM);

    if (!ready) {
      p.copy(pM); q.copy(qM); s.copy(sM); ready = true;
    } else {
      const dist = Math.max(1e-6, p.length());
      const dAng = THREE.MathUtils.radToDeg(q.angleTo(qM));
      const dDist = Math.abs(pM.length() / dist - 1);
      const dLato = pM.distanceTo(p) / dist;
      const salto = dAng > SALTO_GRADI || dDist > SALTO_DIST || dLato > SALTO_LATO;

      if (salto && !seguo) {
        // un salto: ci si crede solo se la stima resta li' (stessa posa) per CONFERMA_MS
        const stesso = salto0 && qS.angleTo(qM) < THREE.MathUtils.degToRad(SALTO_GRADI) && pS.distanceTo(pM) / dist < SALTO_LATO;
        if (!stesso) salto0 = now;
        pS.copy(pM); qS.copy(qM);
        if (now - salto0 >= CONFERMA_MS) seguo = true;
      } else if (!salto) {
        salto0 = 0; seguo = false;
      }
      if (seguo) {
        // salto confermato: lo si raggiunge in pochi fotogrammi
        q.slerp(qM, 0.35); p.lerp(pM, 0.35);
      } else if (!salto) {
        // smorzamento che si apre con il movimento: tremolio assorbito, gesti seguiti
        const kR = THREE.MathUtils.clamp(0.12 + dAng / SALTO_GRADI * 0.6, 0.12, 0.7);
        const kP = THREE.MathUtils.clamp(0.15 + (dLato / SALTO_LATO + dDist / SALTO_DIST) * 0.5, 0.15, 0.75);
        q.slerp(qM, kR);
        p.lerp(pM, kP);
      }
      s.lerp(sM, 0.01); // il biglietto non cambia misura
    }
    group.matrix.compose(p, q, s);
    group.matrixWorldNeedsUpdate = true;
    group.visible = true;
  }

  return { group, update, reset };
}
