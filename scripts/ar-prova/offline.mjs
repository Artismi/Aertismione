// Fa passare le pose grezze registrate da uno stabilizzatore e misura l'errore della cima.
import * as THREE from 'three';
import { readFileSync, readdirSync } from 'node:fs';
const [,, stabPath, ...rest] = process.argv;
const params = rest[0] ? JSON.parse(rest[0]) : undefined;
const files = readdirSync(process.env.RAW).filter((f) => f.endsWith('.json'));
const { createStabilizer } = await import(new URL(stabPath, 'file://' + process.cwd() + '/').href);
const TOP = 125 / 85;
let score = 0;
const lines = [];
for (const f of files) {
  const r = JSON.parse(readFileSync(process.env.RAW + '/' + f));
  const proj = new THREE.Matrix4().fromArray(r.proj), L = Math.max(r.W, r.H);
  const px = (m, p) => { const v = new THREE.Vector4(...p, 1).applyMatrix4(m).applyMatrix4(proj); return [(v.x / v.w + 1) / 2 * r.W, (1 - v.y / v.w) / 2 * r.H]; };
  const anchor = { visible: false, matrix: new THREE.Matrix4() };
  const st = createStabilizer(anchor, params);
  const e = [], c = [];
  for (const row of r.rows) {
    anchor.visible = !!row.m;
    if (row.m) anchor.matrix.fromArray(row.m);
    st.update(row.i * 1000 / 30);
    if (!row.m || !st.group.visible) continue;
    const t = px(st.group.matrix, [0, 0, TOP]), k = px(st.group.matrix, [0, 0, 0]);
    e.push(Math.hypot(t[0] - row.true.top[0], t[1] - row.true.top[1]) / L * 100);
    c.push(Math.hypot(k[0] - row.true.ctr[0], k[1] - row.true.ctr[1]) / L * 100);
  }
  e.sort((a, b) => a - b); c.sort((a, b) => a - b);
  const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
  score += q(e, 0.5) + 0.5 * q(e, 0.95) + 2 * q(c, 0.5);
  lines.push(`${f.slice(2, -11).padEnd(22)} cima med ${q(e, .5).toFixed(1).padStart(4)}% p95 ${q(e, .95).toFixed(1).padStart(5)}%  centro med ${q(c, .5).toFixed(2)}%`);
}
if (!process.env.QUIET) console.log(lines.join('\n'));
console.log('punteggio', score.toFixed(2));
