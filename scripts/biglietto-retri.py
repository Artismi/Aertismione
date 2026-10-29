#!/usr/bin/env python3
"""Tre proposte per il retro del biglietto, da confrontare: ar-print/varianti/retro-{indice,volto,dettaglio}/.

    python3 scripts/biglietto-retri.py && node scripts/render-biglietto.mjs ar-print/varianti/retro-indice  (ecc.)
"""
import os

QUI = os.path.dirname(os.path.abspath(__file__))
NOTTE = '#14121C'; ROSA = '#F5C7D6'; PRUGNA = '#2B1622'
SERVIZI = ['Identità completa', 'Illustrazioni, stampe e gadget', 'Web, app e realtà aumentata', 'Progettazione partecipata', 'Gestione social']
forma = open(os.path.join(QUI, 'logo-forma.svg'), encoding='utf-8').read()
D = forma.split(' d="', 1)[1].split('"', 1)[0]

def scrivi(nome, fondo, ink, stile, corpo):
    out = os.path.join(QUI, '..', 'ar-print', 'varianti', nome); os.makedirs(out, exist_ok=True)
    F = os.path.relpath(os.path.join(QUI, '..', 'ar-print', 'fonts'), out)
    html = f'''<!doctype html>
<html lang="it"><head><meta charset="utf-8"><title>Biglietto Artismi · retro</title>
<!-- generato da scripts/biglietto-retri.py -->
<style>
  @font-face {{ font-family: "Archivo"; src: url("{F}/archivo-latin-wdth-normal.woff2") format("woff2"); font-weight: 100 900; font-stretch: 62% 125%; }}
  @font-face {{ font-family: "Cormorant Garamond"; src: url("{F}/cormorant-garamond-latin-300-normal.woff2") format("woff2"); font-weight: 300; }}
  @font-face {{ font-family: "Cormorant Garamond"; src: url("{F}/cormorant-garamond-latin-300-italic.woff2") format("woff2"); font-weight: 300; font-style: italic; }}
  @font-face {{ font-family: "Fraunces"; src: url("{F}/fraunces-latin-full-italic.woff2") format("woff2"); font-weight: 100 900; font-style: italic; }}
  @font-face {{ font-family: "IBM Plex Mono"; src: url("{F}/ibm-plex-mono-latin-400-normal.woff2") format("woff2"); font-weight: 400; }}
  @page {{ size: 85mm 55mm; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 1020px; height: 660px; background: {fondo}; color: {ink}; overflow: hidden; }}
  .card {{ position: relative; width: 1020px; height: 660px; }}
  .a {{ font-family: "Archivo", sans-serif; font-weight: 780; font-stretch: 62%; text-transform: uppercase; line-height: .86; }}
  .c {{ font-family: "Cormorant Garamond", serif; font-weight: 300; font-style: italic; }}
  .m {{ font-family: "IBM Plex Mono", monospace; font-size: 14px; letter-spacing: .05em; line-height: 1.6; }}
  .u {{ text-transform: uppercase; letter-spacing: .2em; font-size: 12px; }}
{stile}
</style></head>
<body><div class="card">
{corpo}
</div>
<script>
// [lettering] le righe con data-fit si giustificano sulla larghezza dell'elemento indicato: i titoli in
// Archivo cambiano corpo, le righe in mono cambiano spaziatura. Il blocco diventa una forma sola.
document.fonts.ready.then(() => {{
  const larg = el => {{ const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; }};
  document.querySelectorAll('[data-fit]').forEach(el => {{
    const W = larg(document.querySelector(el.dataset.fit)), cs = getComputedStyle(el);
    if (el.dataset.modo === 'spazio') {{ const n = el.textContent.length; const ls = parseFloat(cs.letterSpacing) || 0; el.style.letterSpacing = (ls + (W - larg(el)) / Math.max(1, n - 1)) + 'px'; }}
    else {{ let fs = parseFloat(cs.fontSize); for (let i = 0; i < 4; i++) {{ fs *= W / larg(el); el.style.fontSize = fs + 'px'; }} }}
  }});
  window.__fit = true;
}});
</script>
<script>
// [lettering] il blocco del claim: ogni riga larga uguale, misurata sull'inchiostro (non sulla scatola del carattere),
// e le righe distribuite in altezza con lo stesso spazio fra l'una e l'altra; se non ci stanno, il blocco si stringe.
document.fonts.ready.then(() => {{
  document.querySelectorAll('[data-blocco]').forEach(box => {{
    const righe = [...box.children], W0 = box.clientWidth, H = box.clientHeight, GAP = 18;
    const cv = document.createElement('canvas').getContext('2d');
    const misura = (el, fs) => {{ el.style.fontSize = fs + 'px'; const cs = getComputedStyle(el);
      cv.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      const st = parseFloat(cs.fontStretch); cv.fontStretch = st <= 65 ? 'extra-condensed' : st <= 80 ? 'condensed' : 'normal';   // il canvas vuole la parola, non la percentuale
      const t = cs.textTransform === 'uppercase' ? el.textContent.toUpperCase() : el.textContent, m = cv.measureText(t);
      return {{ w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, l: m.actualBoundingBoxLeft, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent,
               fa: m.fontBoundingBoxAscent, fd: m.fontBoundingBoxDescent, fs: fs }}; }};
    let W = W0, M = [];
    for (let k = 0; k < 6; k++) {{
      M = righe.map(el => {{ const m = misura(el, 100); return misura(el, 100 * W / m.w); }});
      const h = M.reduce((s, m) => s + m.a + m.d, 0);
      if (h + GAP * (righe.length - 1) <= H) break;
      W *= (H - GAP * (righe.length - 1)) / h;
    }}
    const h = M.reduce((s, m) => s + m.a + m.d, 0), gap = (H - h) / (righe.length - 1);
    let y = 0;
    righe.forEach((el, i) => {{ const m = M[i], base = (m.fs - (m.fa + m.fd)) / 2 + m.fa;   // la linea di base dentro la riga (line-height 1)
      el.style.left = m.l + 'px'; el.style.top = (y + m.a - base) + 'px'; y += m.a + m.d + gap; }});
  }});
  window.__blocco = true;
}});
</script>
</body></html>
'''
    open(os.path.join(out, 'biglietto-retro.html'), 'w', encoding='utf-8').write(html)
    # il render vuole anche un fronte: si copia quello vero
    fr = open(os.path.join(QUI, '..', 'ar-print', 'biglietto-fronte.html'), encoding='utf-8').read().replace('url("fonts/', f'url("{F}/')
    open(os.path.join(out, 'biglietto-fronte.html'), 'w', encoding='utf-8').write(fr)

CONTATTI = '<p>WhatsApp +39 393 195 9752</p><p>apizzoglio@gmail.com</p>'

# A · indice: i servizi come l'indice di una rivista, i numeri enormi in colonna
scrivi('retro-indice', ROSA, PRUGNA, f'''
  .testa {{ position: absolute; left: 48px; top: 40px; right: 48px; display: flex; justify-content: space-between; }}
  .claim {{ position: absolute; left: 48px; top: 50px; width: 330px; font-size: 54px; line-height: .95; }}
  .claim .c {{ text-transform: none; font-size: 1.22em; line-height: .7; }}
  .indice {{ position: absolute; left: 430px; right: 48px; top: 36px; list-style: none; }}
  .indice li {{ display: grid; grid-template-columns: 128px 1fr; align-items: end; height: 104px; border-bottom: 1px solid {PRUGNA}; }}
  .indice li:first-child {{ border-top: 0; }}
  .indice .a {{ font-size: 112px; line-height: .8; letter-spacing: -.02em; }}
  .indice .c {{ font-size: 33px; line-height: 1; padding-bottom: 12px; }}
  .piede {{ position: absolute; left: 48px; bottom: 40px; width: 350px; }}
  .piede .c {{ font-size: 26px; line-height: 1.05; margin-bottom: 16px; }}
''', f'''  <p class="testa m u"><span>Artismi — Design Studio</span></p>
  <h1 class="claim a">Diamo un <span class="c">volto</span> alla tua attività.</h1>
  <ol class="indice">{"".join(f'<li><span class="a">{i+1:02d}</span><span class="c">{t}</span></li>' for i, t in enumerate(SERVIZI))}</ol>
  <div class="piede"><p class="c">Inquadra il fronte:<br>il logo prende vita.</p><div class="m">{CONTATTI}</div></div>''')

# B · volto: una parola sola, enorme, che esce dal biglietto; il resto della frase e' minuscolo intorno
scrivi('retro-volto', ROSA, PRUGNA, f'''
  .volto {{ position: absolute; left: -36px; top: 40px; font-size: 470px; line-height: .8; letter-spacing: -.03em; white-space: nowrap; }}
  .prima {{ position: absolute; left: 50px; top: 46px; }}
  .dopo {{ position: absolute; right: 48px; top: 318px; text-align: right; }}
  .prima, .dopo {{ font-size: 46px; }}
  .servizi {{ position: absolute; left: 50px; bottom: 40px; list-style: none; }}
  .servizi li::before {{ content: counter(list-item, decimal-leading-zero) "  "; }}
  .contatti {{ position: absolute; right: 48px; bottom: 40px; text-align: right; }}
  .contatti .c {{ font-size: 24px; margin-bottom: 12px; }}
''', f'''  <p class="volto c">volto</p>
  <p class="prima a">Diamo un</p>
  <p class="dopo a">alla tua<br>attività.</p>
  <ol class="servizi m">{"".join(f'<li>{t}</li>' for t in SERVIZI)}</ol>
  <div class="contatti"><p class="c">Inquadra il fronte: il logo prende vita.</p><div class="m">{CONTATTI}</div></div>''')

# C · dettaglio: il retro e' notte come il fronte; un dettaglio del logo (la i con la sua bilia) ingrandito al vivo
scrivi('retro-dettaglio', NOTTE, ROSA, f'''
  .det {{ position: absolute; right: -60px; top: -330px; width: 2600px; clip-path: inset(0 0 0 79%); }}  /* il dettaglio solo a destra: il testo resta sul nero */
  .det path {{ fill: none; stroke: {ROSA}; stroke-width: 1.6; stroke-linejoin: round; }}
  .testa {{ position: absolute; left: 48px; top: 40px; }}
  .claim {{ position: absolute; left: 48px; top: 96px; font-size: 64px; }}
  .claim .c {{ text-transform: none; font-size: 1.2em; line-height: .7; }}
  .servizi {{ position: absolute; left: 50px; top: 330px; list-style: none; }}
  .servizi li {{ font-size: 28px; line-height: 1.22; }}
  .servizi b {{ font-family: "IBM Plex Mono", monospace; font-style: normal; font-size: 12px; letter-spacing: .1em; margin-right: 14px; vertical-align: 6px; }}
  .contatti {{ position: absolute; left: 48px; bottom: 40px; }}
  .contatti .c {{ font-size: 24px; margin-bottom: 10px; }}
''', f'''  <svg class="det" viewBox="0 0 1000 603"><path d="{D}"/></svg>
  <p class="testa m u">Artismi — Design Studio</p>
  <h1 class="claim a">Diamo un <span class="c">volto</span><br>alla tua attività.</h1>
  <ol class="servizi c">{"".join(f'<li><b>{i+1:02d}</b>{t}</li>' for i, t in enumerate(SERVIZI))}</ol>
  <div class="contatti"><p class="c">Inquadra il fronte: il logo prende vita.</p><div class="m">{CONTATTI}</div></div>''')
# FUSIONE · il nero del dettaglio, "volto" enorme, l'indice coi numeri grandi: tre fasce, una cosa per fascia
# una riga per servizio: a cosa serve (riassunto di SERVICES.promise in src/config/content.ts)
DETTAGLI = ['Dal logo ai muri del negozio', 'Disegni che la gente porta con sé', 'Online come dal vivo', 'Con chi vivrà il progetto', 'I tuoi canali, con la tua voce']
scrivi('retro-fusione', NOTTE, ROSA, f'''
  .det {{ position: absolute; left: -868px; top: -282px; width: 2000px; clip-path: inset(0 0 46% 77.6%); }}  /* la i col pallino, accanto a volto */
  .det path {{ fill: none; stroke: {ROSA}; stroke-width: 2.2; stroke-linejoin: round; }}
  .claim {{ position: absolute; left: 48px; top: 50px; display: inline-flex; flex-direction: column; align-items: flex-start; }}
  .claim .a {{ display: block; font-size: 40px; line-height: .82; white-space: nowrap; letter-spacing: 0; }}
  .claim .volto {{ display: block; font-size: 242px; line-height: .74; letter-spacing: -.035em; white-space: nowrap; margin: 22px 0 10px -10px; }}  /* la l sale fino a sfiorare INSIEME, senza toccarla */
  .linea {{ position: absolute; left: 48px; right: 48px; height: 0; border-top: 1px solid {ROSA}; }}
  .indice {{ position: absolute; left: 48px; right: 48px; top: 408px; list-style: none; display: grid; grid-template-columns: 1fr 1.15fr 1.1fr 1.05fr 1fr; gap: 16px; }}
  .indice .a {{ display: block; font-size: 64px; line-height: .8; letter-spacing: -.02em; }}
  .indice .c {{ display: block; margin-top: 12px; font-size: 21px; line-height: 1.05; text-wrap: balance; }}
  .indice .m {{ display: block; margin-top: 9px; font-size: 11px; line-height: 1.45; letter-spacing: .03em; opacity: .78; text-wrap: balance; }}
  .piede {{ position: absolute; left: 48px; right: 48px; bottom: 38px; display: flex; justify-content: space-between; align-items: baseline; }}
  .piede .c {{ font-size: 24px; }}
  .piede .m {{ display: flex; gap: 34px; }}
''', f'''  <svg class="det" viewBox="0 0 1000 603"><path d="{D}"/></svg>
  <h1 class="claim"><span class="a" data-fit="#volto">Diamo insieme un</span><span class="volto c" id="volto">volto</span><span class="a" data-fit="#volto">alla tua attività.</span></h1>
  <div class="linea" style="top:388px"></div>
  <ol class="indice">{"".join(f'<li><span class="a">{i+1:02d}</span><span class="c">{t}</span><span class="m">{x}</span></li>' for i, (t, x) in enumerate(zip(SERVIZI, DETTAGLI)))}</ol>
  <div class="linea" style="bottom:86px"></div>
  <div class="piede"><p class="c">Inquadra il fronte: il logo prende vita.</p><div class="m"><p>WhatsApp +39 393 195 9752</p><p>apizzoglio@gmail.com</p></div></div>''')
# B + C · il nero e la figura della C, volto enorme della B; servizi in mono col loro dettaglio
# la figura della i come nello schizzo: dall'alto scende un lato solo della punta (il destro), gira sotto il
# pallino e sul braccio, la gamba resta chiusa con la sua punta, e dall'altro lato della gamba la linea risale,
# scavalca e scende dritta lungo la gamba della m fino a uscire dal basso. Due linee che spariscono fuori.
from svgpathtools import parse_path
_P = parse_path(D); _sp = _P.continuous_subpaths()
FIG = _sp[0].cropped(0.75455, 0.9236).d()           # dalla punta in alto (842, 88) giu' fino a (764, 515) sulla gamba della m
TESTA = _sp[6].d()                                  # il pallino
SC = 2.0                                            # la punta in alto esce di sopra
FTX, FTY = 772 - 879 * SC, 545 - 421.7 * SC         # la punta della i scende fra 04 e 05 (772 px), la gamba della m fra 03 e 04
FONDO = 660 - 86                                    # la figura si ferma sul filetto di sotto
import numpy as _np
def _incroci(y_px):
    yl = (y_px - FTY) / SC; fig = parse_path(FIG); xs = []
    T = _np.linspace(0, 1, 20001); Z = _np.array([fig.point(t) for t in T]); dy = Z.imag - yl
    for i in _np.nonzero(_np.sign(dy[:-1]) != _np.sign(dy[1:]))[0]:
        xs.append(FTX + SC * (Z[i].real + (Z[i+1].real - Z[i].real) * (-dy[i]) / (dy[i+1] - dy[i])))
    return sorted(xs)
TOP, H = 34, 324                 # il claim, sopra il filetto dei servizi
CW = 520                         # larghezza massima del claim, prima della figura
RIGA = 388                       # il filetto: sotto ci sono i servizi, la figura ci finisce sopra
# il filetto di sopra: dentro la i (fra i due lati della sua gamba) non c'e'
_x = _incroci(RIGA)                                 # da sinistra: gamba della m, lato sinistro e lato destro della gamba della i
FILETTO = (f'<div class="linea" style="top:{RIGA}px; right: auto; width: {_x[1] - 48:.1f}px"></div>'
           f'<div class="linea" style="top:{RIGA}px; left: {_x[2]:.1f}px"></div>')
scrivi('retro-bc', NOTTE, ROSA, f'''
  .det {{ position: absolute; left: 0; top: 0; width: 1020px; height: {FONDO}px; overflow: hidden; }}  /* la figura scende fra i servizi */
  .det path {{ fill: none; stroke: {ROSA}; stroke-width: {2.2 / SC:.3f}; stroke-linejoin: round; stroke-linecap: round; }}
  .det path.alone {{ stroke: {NOTTE}; stroke-width: {16 / SC:.3f}; }}  /* dove la figura attraversa il filetto di sopra, il filetto si interrompe */
  /* il claim: tre righe composte sull'inchiostro vero (blocco.js qui sotto), larghe uguali, senza toccarsi, che riempiono il riquadro */
  .claim {{ position: absolute; left: 48px; top: {TOP}px; width: {CW}px; height: {H}px; }}
  .claim span {{ position: absolute; left: 0; top: 0; white-space: nowrap; line-height: 1; letter-spacing: 0; }}
  .claim .v {{ font-family: "Fraunces", serif; font-style: italic; font-weight: 330; font-variation-settings: "SOFT" 100, "WONK" 1, "opsz" 144; }}
  .linea {{ position: absolute; left: 48px; right: 48px; height: 0; border-top: 1px solid {ROSA}; }}
  .indice {{ position: absolute; left: 48px; right: 48px; top: {RIGA + 20}px; list-style: none; display: grid; grid-template-columns: 162px 175px 162px 190px 1fr; gap: 16px; }}
  .indice li:nth-child(3) > .m {{ max-width: 110px; }}
  .indice li:nth-child(4) > span {{ max-width: 128px; }}  /* lo 04 sta fra la gamba della m e la gamba della i */
  .indice .a {{ display: block; font-size: 64px; line-height: .8; letter-spacing: -.02em; }}
  .indice .c {{ display: block; margin-top: 12px; font-size: 21px; line-height: 1.05; text-wrap: balance; }}
  .indice .m {{ display: block; margin-top: 9px; font-size: 11px; line-height: 1.45; letter-spacing: .03em; opacity: .78; text-wrap: balance; }}
  .piede {{ position: absolute; left: 48px; right: 48px; bottom: 36px; display: flex; justify-content: space-between; }}
''', f'''  {FILETTO}
  <svg class="det" viewBox="0 0 1020 {FONDO}"><defs><clipPath id="riga"><rect x="0" y="{RIGA - 10}" width="1020" height="20"/></clipPath></defs>
    <g clip-path="url(#riga)"><g transform="translate({FTX:.2f} {FTY:.2f}) scale({SC:.4f})"><path class="alone" d="{FIG}"/></g></g>
    <g transform="translate({FTX:.2f} {FTY:.2f}) scale({SC:.4f})"><path d="{FIG}"/><path d="{TESTA}"/></g></svg>
  <h1 class="claim" data-blocco><span class="a">Diamo insieme un</span><span class="v">volto</span><span class="a">alla tua attività.</span></h1>
  <ol class="indice">{"".join(f'<li><span class="a">{i+1:02d}</span><span class="c">{t}</span><span class="m">{x}</span></li>' for i, (t, x) in enumerate(zip(SERVIZI, DETTAGLI)))}</ol>
  <div class="linea" style="bottom:86px"></div>
  <div class="piede m"><p>WhatsApp +39 393 195 9752</p><p>artismidesignstudio.com</p><p>apizzoglio@gmail.com</p></div>''')
print('scritte le proposte del retro')
