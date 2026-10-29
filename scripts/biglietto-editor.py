#!/usr/bin/env python3
"""L'editor del biglietto: fronte e retro come sono, con i testi da riscrivere e spostare a mano.

Prende ar-print/biglietto-fronte.html e ar-print/biglietto-retro.html cosi' come escono dai generatori e li
mette in una pagina sola (ar-print/biglietto-editor.html, pubblicata come Artifact con i caratteri in fonts/).
Ogni faccia vive nel suo shadow DOM, cosi' gli stili delle due non si pestano. Le modifiche (testo,
spostamento, corpo) si salvano nel db dell'artifact, documento biglietto/modifiche: da li' si rileggono e si
riportano nei generatori.

    python3 scripts/biglietto-editor.py
"""
import json, os, re

QUI = os.path.dirname(os.path.abspath(__file__))
AR = os.path.join(QUI, '..', 'ar-print')

# quali testi si possono toccare, per faccia
TESTI = {
    'fronte': '.piede .t, .piede .p',
    'retro': '.claim span, .indice li > span, .piede p',
}

facce, font = {}, []
for nome in ('fronte', 'retro'):
    h = open(os.path.join(AR, f'biglietto-{nome}.html'), encoding='utf-8').read()
    css = re.search(r'<style>(.*?)</style>', h, re.S).group(1)
    for ff in re.findall(r'@font-face\s*\{[^}]*\}', css):
        ff = re.sub(r'url\("(?:\.\./)*fonts/', 'url("fonts/', ff)
        if ff not in font: font.append(ff)
    css = re.sub(r'@font-face\s*\{[^}]*\}', '', css)
    css = re.sub(r'@page\s*\{[^}]*\}', '', css)
    m = re.search(r'html,\s*body\s*\{([^}]*)\}', css)
    fondo = re.search(r'background:\s*([^;]+);', m.group(1)).group(1).strip()
    ink = re.search(r'color:\s*([^;]+);', m.group(1)).group(1).strip()
    css = css.replace(m.group(0), '')
    css += f'\n.card {{ background: {fondo}; color: {ink}; overflow: hidden; }}\n'
    corpo = re.search(r'<div class="card">(.*)</div>\s*<script>', h, re.S).group(1)
    facce[nome] = {'css': css, 'html': corpo, 'testi': TESTI[nome]}

PAGINA = r'''<title>Editor biglietto</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
FONTI
/* l'editor: due facce del biglietto una sopra l'altra, la barra degli strumenti in alto, fissa */
:root {
  --bg: #ECE8EE; --panel: #FFFFFF; --fg: #1E1A24; --muted: #6B6475; --line: #D5CFDA; --accent: #B4366E; --sel: #2F7CF6;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace; --tit: "Archivo", "Arial Narrow", sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #0E0C12; --panel: #1A1720; --fg: #EEE9F1; --muted: #9C94A6; --line: #2E2936; --accent: #F59AC1; --sel: #6FA6FF; color-scheme: dark } }
:root[data-theme="dark"] { --bg: #0E0C12; --panel: #1A1720; --fg: #EEE9F1; --muted: #9C94A6; --line: #2E2936; --accent: #F59AC1; --sel: #6FA6FF; color-scheme: dark }
[hidden] { display: none !important; }
body { background: var(--bg); color: var(--fg); font-family: var(--mono); font-size: 13px; }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--panel); }
.barra { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--panel); border-bottom: 1px solid var(--line);
  padding-block: 10px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
  display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; }
.barra h1 { font: 760 22px/1 var(--tit); font-stretch: 62%; text-transform: uppercase; letter-spacing: .01em; margin: 0 8px 0 0; }
.gruppo { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
button { font: inherit; color: var(--fg); background: transparent; border: 1px solid var(--line); border-radius: 4px; padding: 6px 10px; cursor: pointer; }
button:hover:not(:disabled) { border-color: var(--fg); }
button:focus-visible { outline: 2px solid var(--sel); outline-offset: 2px; }
button:disabled { opacity: .4; cursor: default; }
button.forte { background: var(--fg); color: var(--panel); border-color: var(--fg); }
.stato { color: var(--muted); margin-left: auto; }
.conferma { display: flex; gap: 6px; align-items: center; color: var(--accent); }
main { padding-block: 18px 40px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
  display: grid; gap: 26px; max-width: 1100px; margin: 0 auto; }
.faccia { display: grid; gap: 8px; min-width: 0; }
.faccia h2 { margin: 0; font: 500 11px/1 var(--mono); letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
.cornice { width: 100%; aspect-ratio: 1020 / 660; max-width: 100%; position: relative; overflow: hidden; border-radius: 3px; box-shadow: 0 1px 0 var(--line), 0 12px 30px -18px rgba(0,0,0,.45); }
.cornice > div { position: absolute; left: 0; top: 0; width: 1020px; height: 660px; transform-origin: 0 0; }
.aiuto { color: var(--muted); line-height: 1.6; max-width: 70ch; }
.aiuto kbd { font: inherit; border: 1px solid var(--line); border-radius: 3px; padding: 0 4px; }
textarea { width: 100%; min-height: 120px; font: 12px/1.5 var(--mono); color: var(--fg); background: var(--panel); border: 1px solid var(--line); border-radius: 4px; padding: 8px; }
@media (prefers-reduced-motion: no-preference) { .cornice { transition: box-shadow .2s; } }
</style>

<header class="barra">
  <h1>Biglietto · editor</h1>
  <div class="gruppo" aria-label="Elemento selezionato">
    <button id="piu" disabled title="Ingrandisci il testo selezionato">A+</button>
    <button id="meno" disabled title="Rimpicciolisci il testo selezionato">A−</button>
    <button id="scrivi" disabled>Modifica testo</button>
    <button id="riporta" disabled>Riporta com'era</button>
  </div>
  <div class="gruppo">
    <button id="tutto">Ripristina tutto</button>
    <span class="conferma" id="conferma" hidden>Annullo tutte le modifiche?
      <button id="si" class="forte">Sì, ripristina</button><button id="no">No</button></span>
    <button id="copia">Copia modifiche</button>
  </div>
  <span class="stato" id="stato" role="status">Caricamento…</span>
</header>

<main>
  <p class="aiuto">Trascina un testo per spostarlo; le frecce lo spostano di 1 px (con <kbd>Maiusc</kbd> di 10). Doppio clic, o “Modifica testo”, per riscriverlo; <kbd>Esc</kbd> o un clic fuori per finire. Le modifiche si salvano da sole.</p>
  <section class="faccia"><h2>Fronte</h2><div class="cornice"><div id="fronte"></div></div></section>
  <section class="faccia"><h2>Retro</h2><div class="cornice"><div id="retro"></div></div></section>
  <textarea id="esporta" hidden readonly aria-label="Modifiche in formato JSON"></textarea>
</main>

<script>
const FACCE = DATI;
const $ = id => document.getElementById(id);
const stato = $('stato');
const mod = { fronte: {}, retro: {} };      // per ogni testo: {dx, dy, k, testo}
const el = {};                                // chiave -> elemento, e i valori di partenza
let sel = null, db = null, docRef = null, scrittura = null, inCorso = false, inAttesa = false;

// ── le due facce, ciascuna nel suo shadow DOM ──────────────────────────────────────────────
for (const nome of ['fronte', 'retro']) {
  const host = $(nome), root = host.attachShadow({ mode: 'open' }), f = FACCE[nome];
  root.innerHTML = '<style>' + f.css + `
    .ed { cursor: grab; touch-action: none; outline: 1px dashed transparent; outline-offset: 3px; }
    .ed:hover { outline-color: rgba(120,160,255,.55); }
    .ed.sel { outline: 1.5px solid #6FA6FF; }
    .ed[contenteditable="true"] { cursor: text; outline: 1.5px solid #F59AC1; }
  </style><div class="card">` + f.html + '</div>';
  root.querySelectorAll(f.testi).forEach((n, i) => {
    const k = nome + '-' + i; n.classList.add('ed'); n.dataset.k = k; n.tabIndex = 0;
    el[k] = { n, faccia: nome, fs: parseFloat(getComputedStyle(n).fontSize), testo: n.innerHTML };
  });
}
// le righe giustificate del fronte (data-fit) si ricalcolano dentro lo shadow DOM
function giustifica() {
  for (const nome of ['fronte', 'retro']) {
    const root = $(nome).shadowRoot;
    const larg = n => { const r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect().width / scala(nome); };
    root.querySelectorAll('[data-fit]').forEach(n => {
      const W = larg(root.querySelector(n.dataset.fit)); n.style.letterSpacing = '';
      const cs = getComputedStyle(n), ls = parseFloat(cs.letterSpacing) || 0, len = n.textContent.length;
      if (n.dataset.modo === 'spazio') n.style.letterSpacing = (ls + (W - larg(n)) / Math.max(1, len - 1)) + 'px';
    });
  }
}
function scala(nome) { const c = $(nome).parentElement; return c.clientWidth / 1020; }
function adatta() { for (const nome of ['fronte', 'retro']) $(nome).style.transform = 'scale(' + scala(nome) + ')'; }
addEventListener('resize', adatta); adatta();

// ── applicare le modifiche ─────────────────────────────────────────────────────────────────
function applica(k) {
  const e = el[k], m = mod[e.faccia][k] || {};
  e.n.style.translate = (m.dx || m.dy) ? `${m.dx || 0}px ${m.dy || 0}px` : '';
  e.n.style.fontSize = m.k && m.k !== 1 ? (e.fs * m.k) + 'px' : '';
  const t = m.testo !== undefined ? m.testo : e.testo;
  if (e.n.innerHTML !== t && e.n.contentEditable !== 'true') e.n.innerHTML = t;
}
function applicaTutto() { Object.keys(el).forEach(applica); giustifica(); }
function cambia(k, fn) {
  const f = el[k].faccia; const m = Object.assign({ dx: 0, dy: 0, k: 1 }, mod[f][k]); fn(m);
  const vuoto = !m.dx && !m.dy && m.k === 1 && (m.testo === undefined || m.testo === el[k].testo);
  if (vuoto) delete mod[f][k]; else mod[f][k] = m;
  applica(k); giustifica(); salva();
}

// ── selezione, trascinamento, testo ───────────────────────────────────────────────────────
function seleziona(k) {
  if (sel && sel !== k) finisciTesto();
  document.querySelectorAll('.cornice > div').forEach(h => h.shadowRoot.querySelectorAll('.ed.sel').forEach(n => n.classList.remove('sel')));
  sel = k; if (k) el[k].n.classList.add('sel');
  for (const b of ['piu', 'meno', 'scrivi', 'riporta']) $(b).disabled = !k;
}
function iniziaTesto(k) {
  const n = el[k].n; n.contentEditable = 'true'; n.focus();
  const r = document.createRange(); r.selectNodeContents(n); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
}
function finisciTesto() {
  if (!sel) return; const n = el[sel].n; if (n.contentEditable !== 'true') return;
  n.contentEditable = 'false'; const t = n.innerHTML; cambia(sel, m => { m.testo = t; });
}
for (const nome of ['fronte', 'retro']) {
  const root = $(nome).shadowRoot;
  root.addEventListener('pointerdown', ev => {
    const n = ev.target.closest && ev.target.closest('.ed');
    if (!n) { seleziona(null); return; }
    const k = n.dataset.k; if (n.contentEditable === 'true') return;   // si sta scrivendo: il clic serve al testo
    seleziona(k); ev.preventDefault(); n.setPointerCapture(ev.pointerId);
    const s = scala(nome), x0 = ev.clientX, y0 = ev.clientY, m0 = Object.assign({ dx: 0, dy: 0 }, mod[nome][k]);
    const muovi = e => { el[k].n.style.translate = `${m0.dx + (e.clientX - x0) / s}px ${m0.dy + (e.clientY - y0) / s}px`; };
    const fine = e => { n.removeEventListener('pointermove', muovi); n.removeEventListener('pointerup', fine); n.removeEventListener('pointercancel', fine);
      const dx = Math.round(m0.dx + (e.clientX - x0) / s), dy = Math.round(m0.dy + (e.clientY - y0) / s);
      if (dx !== m0.dx || dy !== m0.dy) cambia(k, m => { m.dx = dx; m.dy = dy; }); };
    n.addEventListener('pointermove', muovi); n.addEventListener('pointerup', fine); n.addEventListener('pointercancel', fine);
  });
  root.addEventListener('dblclick', ev => { const n = ev.target.closest && ev.target.closest('.ed'); if (n) { seleziona(n.dataset.k); iniziaTesto(n.dataset.k); } });
  root.addEventListener('focusout', ev => { if (ev.target.contentEditable === 'true') finisciTesto(); });
  root.addEventListener('keydown', ev => {
    const n = ev.target.closest && ev.target.closest('.ed'); if (!n) return; const k = n.dataset.k;
    if (n.contentEditable === 'true') { if (ev.key === 'Escape') { ev.preventDefault(); n.blur(); } return; }
    const passo = ev.shiftKey ? 10 : 1, d = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[ev.key];
    if (d) { ev.preventDefault(); seleziona(k); cambia(k, m => { m.dx += d[0]; m.dy += d[1]; }); }
    if (ev.key === 'Enter') { ev.preventDefault(); seleziona(k); iniziaTesto(k); }
  });
  root.addEventListener('focusin', ev => { const n = ev.target.closest && ev.target.closest('.ed'); if (n && sel !== n.dataset.k) seleziona(n.dataset.k); });
}
$('piu').onclick = () => sel && cambia(sel, m => { m.k = Math.round(m.k * 1.05 * 1000) / 1000; });
$('meno').onclick = () => sel && cambia(sel, m => { m.k = Math.round(m.k / 1.05 * 1000) / 1000; });
$('scrivi').onclick = () => sel && iniziaTesto(sel);
$('riporta').onclick = () => { if (!sel) return; const f = el[sel].faccia; delete mod[f][sel]; el[sel].n.innerHTML = el[sel].testo; applica(sel); giustifica(); salva(); };
$('tutto').onclick = () => { $('conferma').hidden = false; $('tutto').hidden = true; };
$('no').onclick = () => { $('conferma').hidden = true; $('tutto').hidden = false; };
$('si').onclick = () => { mod.fronte = {}; mod.retro = {}; Object.values(el).forEach(e => { e.n.innerHTML = e.testo; }); applicaTutto(); salva(); $('no').onclick(); };
$('copia').onclick = async () => {
  const t = JSON.stringify(mod, null, 2), ta = $('esporta'); ta.value = t;
  try { await navigator.clipboard.writeText(t); stato.textContent = 'Modifiche copiate'; }
  catch { ta.hidden = false; ta.focus(); ta.select(); stato.textContent = 'Seleziona e copia il testo qui sotto'; }
};

// ── salvataggio: il db dell'artifact (documento biglietto/modifiche), o solo questa pagina ────
function salva() { clearTimeout(scrittura); scrittura = setTimeout(scrivi, 500); stato.textContent = 'Modifiche non salvate…'; }
async function scrivi() {
  if (!docRef) { try { localStorage.setItem('biglietto-modifiche', JSON.stringify(mod)); } catch {} stato.textContent = 'Salvato solo su questo browser'; return; }
  if (inCorso) { inAttesa = true; return; }
  inCorso = true;
  try { await docRef.set({ fronte: mod.fronte, retro: mod.retro }); stato.textContent = 'Salvato'; }
  catch (e) { stato.textContent = e && e.code === 'invalid_argument' ? 'Puoi guardare ma non salvare' : 'Non salvato: riprova tra poco'; }
  inCorso = false; if (inAttesa) { inAttesa = false; scrivi(); }
}
function carica(dati) {
  if (!dati) return;
  for (const f of ['fronte', 'retro']) mod[f] = JSON.parse(JSON.stringify(dati[f] || {}));
  Object.values(el).forEach(e => { if (e.n.contentEditable !== 'true') e.n.innerHTML = e.testo; });
  applicaTutto(); if (sel) el[sel].n.classList.add('sel');
}
document.fonts.ready.then(() => {
  Object.values(el).forEach(e => { e.fs = parseFloat(getComputedStyle(e.n).fontSize); });
  try { carica(JSON.parse(localStorage.getItem('biglietto-modifiche') || 'null')); } catch {}
  applicaTutto(); stato.textContent = 'Pronto';
  (window.claude ? claude.use('db') : Promise.resolve(null)).then(d => {
    db = d; if (!db) { stato.textContent = 'Le modifiche restano su questo browser'; return; }
    docRef = db.doc('biglietto/modifiche');
    docRef.onSnapshot(s => { if (s.metadata.hasPendingWrites || scrittura && stato.textContent.startsWith('Modifiche non')) return;
      if (s.exists) carica(s.data()); stato.textContent = 'Salvato'; }, () => { docRef = null; stato.textContent = 'Le modifiche restano su questo browser'; });
  });
});
</script>
'''

out = PAGINA.replace('FONTI', '\n'.join(font)).replace('DATI', json.dumps(facce, ensure_ascii=False))
open(os.path.join(AR, 'biglietto-editor.html'), 'w', encoding='utf-8').write(out)
print('ar-print/biglietto-editor.html', f'{len(out) // 1024} KB', 'caratteri:', len(font))
