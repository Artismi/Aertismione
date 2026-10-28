#!/usr/bin/env python3
"""Il biglietto Artismi, fronte e retro.

Fronte notte con il logo a contorno al vivo in rosa; il QR e' una tessera rosa con la didascalia, come
l'etichetta di un'opera. Retro rosa in prugna. I colori sono quelli della pagina AR.
Scrive biglietto-fronte.html e biglietto-retro.html (1020 x 660 px = 85 x 55 mm). I testi riassumono
src/config/content.ts (HERO, SERVICES, CONTACT): se cambiano li', aggiornali qui.

    python3 scripts/biglietto.py [--tipo instrument|cormorant|archivo] [--out ar-print]
    poi:  node scripts/render-biglietto.mjs [cartella]      (le immagini PNG)

Il fronte e' anche il bersaglio AR: se cambia, vanno rifatti public/ar/assets/target.mind e card-front.png.
"""
import argparse, os
import segno

ap = argparse.ArgumentParser()
ap.add_argument('--tipo', default='instrument')
ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'ar-print'))
A = ap.parse_args()
os.makedirs(A.out, exist_ok=True)
FONTI = os.path.relpath(os.path.join(os.path.dirname(__file__), '..', 'ar-print', 'fonts'), A.out)

URL = 'HTTPS://WWW.ARTISMIDESIGNSTUDIO.COM/AR'
NOTTE = '#14121C'; ROSA = '#F5C7D6'; PRUGNA = '#2B1622'

# ─── i caratteri: un titolo (.t) e un testo piccolo (.p) ──────────────────────────────────────
def face(fam, file, w='400', st='normal', extra=''):
    return f'@font-face {{ font-family: "{fam}"; src: url("{FONTI}/{file}") format("woff2"); font-weight: {w}; font-style: {st}; {extra} }}'

TIPI = {
    # serif editoriale da rivista, sottile e alto; sans pulito per le note
    'instrument': dict(
        facce=[face('Instrument Serif', 'instrument-serif-latin-400-normal.woff2'), face('Instrument Serif', 'instrument-serif-latin-400-italic.woff2', st='italic'),
               face('Instrument Sans', 'instrument-sans-latin-400-normal.woff2'), face('Instrument Sans', 'instrument-sans-latin-500-normal.woff2', '500')],
        t='font-family: "Instrument Serif", serif; font-weight: 400;', ti='font-style: italic;',
        p='font-family: "Instrument Sans", sans-serif; font-weight: 500;', claim=78, firma=64, servizi=24),
    # garamond da libro, corsivo leggero; mono da dattiloscritto per le note
    'cormorant': dict(
        facce=[face('Cormorant Garamond', 'cormorant-garamond-latin-300-normal.woff2', '300'), face('Cormorant Garamond', 'cormorant-garamond-latin-300-italic.woff2', '300', 'italic'),
               face('Cormorant Garamond', 'cormorant-garamond-latin-500-normal.woff2', '500'), face('IBM Plex Mono', 'ibm-plex-mono-latin-400-normal.woff2')],
        t='font-family: "Cormorant Garamond", serif; font-weight: 300;', ti='font-style: italic;',
        p='font-family: "IBM Plex Mono", monospace; font-weight: 400;', claim=80, firma=66, servizi=26),
    # grottesco stretto e pesante, da manifesto: tutto maiuscolo e serrato
    'archivo': dict(
        facce=[face('Archivo', 'archivo-latin-wdth-normal.woff2', '100 900', extra='font-stretch: 62% 125%;')],
        t='font-family: "Archivo", sans-serif; font-weight: 800; font-stretch: 62%; text-transform: uppercase; letter-spacing: -.01em;', ti='',
        p='font-family: "Archivo", sans-serif; font-weight: 500; font-stretch: 100%;', claim=70, firma=56, servizi=22),
}
T = TIPI[A.tipo]

# ─── il QR: una tessera rosa, il codice netto e la didascalia sotto ─────────────────────────
def tessera():
    qr = segno.make(URL, error='q', micro=False, boost_error=False)
    M = qr.matrix; N = len(M); Q = 2                       # margine di due moduli: il minimo che si legge bene
    occhio = lambda r, c: any(fr <= r < fr + 7 and fc <= c < fc + 7 for fr, fc in ((0, 0), (0, N - 7), (N - 7, 0)))
    s = [f'<rect x="{c+.04}" y="{r+.04}" width=".92" height=".92"/>' for r in range(N) for c in range(N) if M[r][c] and not occhio(r, c)]
    for fr, fc in ((0, 0), (0, N - 7), (N - 7, 0)):
        s.append(f'<rect x="{fc+.5}" y="{fr+.5}" width="6" height="6" fill="none" stroke="{PRUGNA}" stroke-width="1"/>')
        s.append(f'<rect x="{fc+2}" y="{fr+2}" width="3" height="3"/>')
    return (f'<svg class="qr" viewBox="{-Q} {-Q} {N+2*Q} {N+2*Q}" role="img" aria-label="QR: {URL.lower()}">'
            f'<g fill="{PRUGNA}">{"".join(s)}</g></svg>')

# ─── la pagina ──────────────────────────────────────────────────────────────────────────────
def pagina(nome, titolo, fondo, ink, stile, corpo):
    facce = '\n  '.join(T['facce'])
    html = f'''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>{titolo}</title>
<!-- generato da scripts/biglietto.py (--tipo {A.tipo}): modifica li', non qui -->
<style>
  {facce}
  @page {{ size: 85mm 55mm; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 1020px; height: 660px; background: {fondo}; color: {ink}; overflow: hidden; }}
  .card {{ position: relative; width: 1020px; height: 660px; }}
  .t {{ {T['t']} line-height: .95; }}
  .t em, .ti {{ {T['ti']} }}
  .p {{ {T['p']} font-size: 14px; letter-spacing: .06em; }}
  .up {{ text-transform: uppercase; letter-spacing: .2em; font-size: 12px; }}
  .rule {{ position: absolute; left: 56px; right: 56px; height: 0; border-top: 1px solid {ink}; }}
{stile}
</style>
</head>
<body>
<div class="card">
{corpo}
</div>
</body>
</html>
'''
    open(os.path.join(A.out, nome), 'w', encoding='utf-8').write(html)

forma = open(os.path.join(os.path.dirname(__file__), 'logo-forma.svg'), encoding='utf-8').read()
d = forma.split(' d="', 1)[1].split('"', 1)[0]

# ─── fronte ─────────────────────────────────────────────────────────────────────────────────
pagina('biglietto-fronte.html', 'Biglietto Artismi · fronte', NOTTE, ROSA, f'''
  .logo {{ position: absolute; left: -130px; top: -6px; width: 1210px; }}
  .logo path {{ fill: none; stroke: {ROSA}; stroke-width: 3.6; stroke-linejoin: round; }}
  .piede {{ position: absolute; left: 0; bottom: 0; padding: 22px 30px 34px 48px; background: {NOTTE}; }}
  .piede .t {{ font-size: {T['firma']}px; }}
  .piede .p {{ margin-top: 12px; font-size: 15px; letter-spacing: .1em; }}
  .tessera {{ position: absolute; right: 40px; bottom: 34px; width: 214px; background: {ROSA}; color: {PRUGNA}; padding: 12px 12px 14px;
             box-shadow: 0 0 0 5px {NOTTE}; }}
  .tessera .qr {{ display: block; width: 190px; height: 190px; }}
  .tessera .nota {{ margin-top: 8px; padding-top: 8px; border-top: 1px solid {PRUGNA}; }}
  .tessera .t {{ font-size: 21px; line-height: 1.05; }}
''', f'''  <svg class="logo" viewBox="0 0 1000 603"><path d="{d}"/></svg>
  <div class="piede"><p class="t ti">Design Studio</p><p class="p">artismidesignstudio.com</p></div>
  <div class="tessera">{tessera()}
    <div class="nota"><p class="t">Inquadra il fronte:<br><em>il logo prende vita.</em></p></div></div>''')

# ─── retro ──────────────────────────────────────────────────────────────────────────────────
SERVIZI = ['Identità completa', 'Illustrazioni, stampe e gadget', 'Web, app e realtà aumentata', 'Progettazione partecipata', 'Gestione social']
pagina('biglietto-retro.html', 'Biglietto Artismi · retro', ROSA, PRUGNA, f'''
  .testa {{ position: absolute; left: 56px; top: 40px; }}
  .claim {{ position: absolute; left: 54px; top: 100px; font-size: {T['claim']}px; }}
  .line {{ position: absolute; left: 56px; top: {100 + int(T['claim'] * 1.95) + 26}px; width: 470px; font-size: 15px; line-height: 1.55; letter-spacing: .02em; }}
  .servizi {{ position: absolute; right: 56px; top: 250px; width: 360px; list-style: none; }}
  .servizi li {{ display: flex; gap: 16px; align-items: baseline; padding: 8px 0 7px; border-top: 1px solid {PRUGNA}; }}
  .servizi li:last-child {{ border-bottom: 1px solid {PRUGNA}; }}
  .servizi b {{ font-size: 11px; letter-spacing: .12em; font-weight: 500; }}
  .servizi span {{ font-size: {T['servizi']}px; line-height: 1; }}
  .contatti {{ position: absolute; left: 56px; right: 56px; bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }}
  .contatti .t {{ font-size: 30px; line-height: 1.05; }}
  .contatti ul {{ list-style: none; text-align: right; font-size: 15px; line-height: 1.7; }}
''', f'''  <p class="testa p up">Artismi — Design Studio</p>
  <div class="rule" style="top:66px"></div>
  <h1 class="claim t">Diamo un <em>volto</em><br>alla tua attività.</h1>
  <p class="line p">Identità visive, illustrazione e murales per negozi, associazioni e piccole imprese.</p>
  <ol class="servizi">{"".join(f'<li><b class="p">{i+1:02d}</b><span class="t">{t}</span></li>' for i, t in enumerate(SERVIZI))}</ol>
  <div class="rule" style="bottom:130px"></div>
  <div class="contatti"><p class="t">Inquadra il fronte:<br><em>il logo prende vita.</em></p>
    <ul class="p"><li>WhatsApp +39 393 195 9752</li><li>apizzoglio@gmail.com</li></ul></div>''')
print(A.out, A.tipo)
