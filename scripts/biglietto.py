#!/usr/bin/env python3
"""Il biglietto Artismi, fronte e retro.

Fronte notte con il logo a contorno al vivo in rosa; il QR al centro di un sigillo tondo rosa, con la
frase che gli gira intorno. Retro notte: volto con la i del logo e l'indice dei servizi. I colori sono quelli della pagina AR.
Scrive biglietto-fronte.html e biglietto-retro.html (1020 x 660 px = 85 x 55 mm). I testi riassumono
src/config/content.ts (HERO, SERVICES, CONTACT): se cambiano li', aggiornali qui.

    python3 scripts/biglietto-retri.py && python3 scripts/biglietto.py [--tipo misto|instrument|cormorant|archivo] [--out ar-print]
    poi:  node scripts/render-biglietto.mjs [cartella]      (le immagini PNG)

Il fronte e' anche il bersaglio AR: se cambia, vanno rifatti public/ar/assets/target.mind e card-front.png.
"""
import argparse, math, os
import segno

ap = argparse.ArgumentParser()
ap.add_argument('--tipo', default='misto')
ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'ar-print'))
A = ap.parse_args()
os.makedirs(A.out, exist_ok=True)
FONTI = os.path.relpath(os.path.join(os.path.dirname(__file__), '..', 'ar-print', 'fonts'), A.out)

URL = 'HTTPS://WWW.ARTISMIDESIGNSTUDIO.COM/AR'
NOTTE = '#35144E'; ROSA = '#F5C7D6'; PRUGNA = '#2B1622'; AMBRA = '#C8860A'   # il viola e il rosa del sito, l'ambra solo per gli accenti
f = lambda v: f'{v:.3f}'.rstrip('0').rstrip('.')

# ─── i caratteri: un titolo (.t) e un testo piccolo (.p) ──────────────────────────────────────
def face(fam, file, w='400', st='normal', extra=''):
    return f'@font-face {{ font-family: "{fam}"; src: url("{FONTI}/{file}") format("woff2"); font-weight: {w}; font-style: {st}; {extra} }}'

TIPI = {
    # serif editoriale da rivista, sottile e alto; sans pulito per le note
    'instrument': dict(
        facce=[face('Instrument Serif', 'instrument-serif-latin-400-normal.woff2'), face('Instrument Serif', 'instrument-serif-latin-400-italic.woff2', st='italic'),
               face('Instrument Sans', 'instrument-sans-latin-400-normal.woff2'), face('Instrument Sans', 'instrument-sans-latin-500-normal.woff2', '500')],
        t='font-family: "Instrument Serif", serif; font-weight: 400;', ti='font-style: italic;',
        p='font-family: "Instrument Sans", sans-serif; font-weight: 500;', claim=78, firma=64, servizi=24, anello=('Instrument Sans', 500)),
    # garamond da libro, corsivo leggero; mono da dattiloscritto per le note
    'cormorant': dict(
        facce=[face('Cormorant Garamond', 'cormorant-garamond-latin-300-normal.woff2', '300'), face('Cormorant Garamond', 'cormorant-garamond-latin-300-italic.woff2', '300', 'italic'),
               face('Cormorant Garamond', 'cormorant-garamond-latin-500-normal.woff2', '500'), face('IBM Plex Mono', 'ibm-plex-mono-latin-400-normal.woff2')],
        t='font-family: "Cormorant Garamond", serif; font-weight: 300;', ti='font-style: italic;',
        p='font-family: "IBM Plex Mono", monospace; font-weight: 400;', claim=80, firma=66, servizi=26, anello=('IBM Plex Mono', 400)),
    # grottesco stretto e pesante, da manifesto: tutto maiuscolo e serrato
    'archivo': dict(
        facce=[face('Archivo', 'archivo-latin-wdth-normal.woff2', '100 900', extra='font-stretch: 62% 125%;')],
        t='font-family: "Archivo", sans-serif; font-weight: 800; font-stretch: 62%; text-transform: uppercase; letter-spacing: -.01em;', ti='',
        p='font-family: "Archivo", sans-serif; font-weight: 500; font-stretch: 100%;', claim=70, firma=56, servizi=22, anello=('Archivo', 600)),
    # il meglio dei due: il grottesco stretto per le parole forti, il garamond corsivo per gli accenti e
    # l'elenco, il mono per le note. Il contrasto fra i due pesi e' la voce del biglietto
    'misto': dict(
        facce=[face('Archivo', 'archivo-latin-wdth-normal.woff2', '100 900', extra='font-stretch: 62% 125%;'),
               face('Cormorant Garamond', 'cormorant-garamond-latin-300-normal.woff2', '300'), face('Cormorant Garamond', 'cormorant-garamond-latin-300-italic.woff2', '300', 'italic'),
               face('IBM Plex Mono', 'ibm-plex-mono-latin-400-normal.woff2')],
        t='font-family: "Archivo", sans-serif; font-weight: 780; font-stretch: 62%; text-transform: uppercase; letter-spacing: -.005em;',
        em='font-family: "Cormorant Garamond", serif; font-weight: 300; font-style: italic; text-transform: none; letter-spacing: 0; font-size: 1.16em; line-height: .8;',
        ti='', serv='font-family: "Cormorant Garamond", serif; font-weight: 300; text-transform: none; letter-spacing: 0;',
        p='font-family: "IBM Plex Mono", monospace; font-weight: 400;', claim=72, firma=58, servizi=26, anello=('IBM Plex Mono', 400)),
}
T = TIPI[A.tipo]
T.setdefault('em', T['ti']); T.setdefault('serv', '')

# ─── il QR: il sigillo tondo, il codice al centro e la frase che gli gira intorno ─────────────
def sigillo(ink=PRUGNA, carta=ROSA, disco=False, bordo=None, frase='  Inquadra il biglietto · il logo prende vita · realtà aumentata  '):  # gli spazi ai capi: la bilia in alto sta nel respiro
    qr = segno.make(URL, error='q', micro=False, boost_error=False)
    M = [[bool(v) for v in r] for r in qr.matrix]; N = len(M); c0 = N / 2
    occhio = lambda r, c: any(fr <= r < fr + 7 and fc <= c < fc + 7 for fr, fc in ((0, 0), (0, N - 7), (N - 7, 0)))
    R1 = math.hypot(c0, c0) + 1.3          # il codice e il suo margine stanno dentro il primo anello
    FS = 2.9                                # corpo della frase, in moduli
    RT = R1 + 1.25 + FS * .36               # linea di base della frase
    R2 = R1 + 2.5 + FS                      # anello esterno
    R3 = R2 + 1.6                           # filo piu' esterno, con le crocette di registro
    HAIR = .2; FILO = .42
    s = []
    for r in range(N):
        for c in range(N):
            if M[r][c] and not occhio(r, c): s.append(f'<rect x="{f(c+.07)}" y="{f(r+.07)}" width=".86" height=".86" rx=".22"/>')
    for fr, fc in ((0, 0), (0, N - 7), (N - 7, 0)):
        s.append(f'<rect x="{fc+.5}" y="{fr+.5}" width="6" height="6" rx="1.5" fill="none" stroke="{ink}" stroke-width="1"/>')
        s.append(f'<rect x="{fc+2}" y="{fr+2}" width="3" height="3" rx=".8"/>')
    giro = 2 * math.pi * RT
    # la frase parte in alto e gira in senso orario; textLength la stende esatta sul cerchio
    testo = (f'<path id="giro" fill="none" d="M{f(c0)} {f(c0-RT)} A{f(RT)} {f(RT)} 0 1 1 {f(c0-.001)} {f(c0-RT)}"/>'
             f'<text font-family="{T["anello"][0]}" font-weight="{T["anello"][1]}" font-size="{f(FS)}" letter-spacing="0" fill="{ink}">'
             f'<textPath href="#giro" textLength="{f(giro)}" lengthAdjust="spacing" xml:space="preserve">{frase.upper()}</textPath></text>')
    croci = []
    for a in (0, 90, 180, 270):                 # crocette di registro sul filo esterno, come in tipografia
        ar = math.radians(a)
        x, y = c0 + R3 * math.cos(ar), c0 + R3 * math.sin(ar)
        dx, dy = math.cos(ar), math.sin(ar)
        croci.append(f'<line x1="{f(x-dx*1.2)}" y1="{f(y-dy*1.2)}" x2="{f(x+dx*1.2)}" y2="{f(y+dy*1.2)}"/>')
    bilia = f'<circle cx="{f(c0)}" cy="{f(c0-R2)}" r="1" fill="{carta}" stroke="{ink}" stroke-width="{f(FILO)}"/>'
    ext = R3 + 2.6
    return (f'<svg class="sigillo" xmlns="http://www.w3.org/2000/svg" viewBox="{f(c0-ext)} {f(c0-ext)} {f(2*ext)} {f(2*ext)}" role="img" aria-label="QR: {URL.lower()}">'
            + (f'<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R3+1.4)}" fill="{carta}"' + (f' stroke="{bordo}" stroke-width="1.6"' if bordo else '') + '/>' if disco else '') +
            f'<g fill="{ink}">{"".join(s)}</g>{testo}'
            f'<g fill="none" stroke="{ink}" stroke-linecap="round">'
            f'<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R1)}" stroke-width="{f(FILO)}"/>'
            f'<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R2)}" stroke-width="{f(FILO)}"/>'
            f'<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R3)}" stroke-width="{f(HAIR)}"/>'
            f'<g stroke-width="{f(HAIR)}">{"".join(croci)}</g></g>{bilia}</svg>')


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
  .t em {{ {T['em']} }}
  .ti {{ {T['ti']} }}
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
</body>
</html>
'''
    open(os.path.join(A.out, nome), 'w', encoding='utf-8').write(html)

forma = open(os.path.join(os.path.dirname(__file__), 'logo-forma.svg'), encoding='utf-8').read()
d = forma.split(' d="', 1)[1].split('"', 1)[0]

# ─── fronte ─────────────────────────────────────────────────────────────────────────────────
# il logo grande, al vivo solo a sinistra, mai coperto: a destra della i, nella colonna libera, la firma in alto e
# il sigillo col QR in basso
pagina('biglietto-fronte.html', 'Biglietto Artismi · fronte', NOTTE, ROSA, f'''
  .logo {{ position: absolute; left: -142px; top: 52px; width: 950px; }}   /* grande e al vivo a sinistra (via solo il ricciolo della a), la i finisce a 723 px */
  .logo path {{ fill: none; stroke: {ROSA}; stroke-width: 3.6; stroke-linejoin: round; }}
  .piede {{ position: absolute; right: 40px; top: 46px; text-align: right; }}
  .piede .t {{ font-size: 56px; line-height: .86; }}
  .piede .p {{ margin-top: 14px; font-size: 13px; letter-spacing: .06em; color: {AMBRA}; }}   /* l'unico accento d'ambra */
  .sigillo {{ position: absolute; right: 22px; bottom: 20px; width: 252px; height: 252px; }}
''', f'''  <svg class="logo" viewBox="0 0 1000 603"><path d="{d}"/></svg>
  <div class="piede"><p class="t ti">Design<br>Studio</p><p class="p">artismidesignstudio.com</p></div>
  {sigillo(disco=True, bordo=NOTTE)}''')

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
  .servizi span {{ {T['serv']} font-size: {T['servizi']}px; line-height: 1; }}
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
    <ul class="p"><li>WhatsApp +39 393 195 9752</li><li>andrea@artismidesignstudio.com</li></ul></div>''')
# il retro definitivo e' retro-bc di scripts/biglietto-retri.py (notte, la i della figura, volto enorme):
# si lancia prima quello, poi questo lo copia accanto al fronte
if A.tipo == 'misto':
    fus = os.path.join(os.path.dirname(__file__), '..', 'ar-print', 'varianti', 'retro-bc', 'biglietto-retro.html')
    r = open(fus, encoding='utf-8').read().replace('url("../../fonts/', f'url("{FONTI}/')
    open(os.path.join(A.out, 'biglietto-retro.html'), 'w', encoding='utf-8').write(r)
print(A.out, A.tipo)
