#!/usr/bin/env python3
"""Il biglietto Artismi, fronte e retro, in stile editoriale.

Scrive ar-print/biglietto-fronte.html e ar-print/biglietto-retro.html (1020 x 660 px = 85 x 55 mm), con i
caratteri del sito (Fraunces, JetBrains Mono, in ar-print/fonts) e, sul fronte, il sigillo: il QR vero al
centro di un cerchio di evocazione, con la frase che gli gira intorno. I testi riassumono
src/config/content.ts (HERO, SERVICES, CONTACT): se cambiano li', aggiornali qui.

    python3 scripts/biglietto.py           poi:   node scripts/render-biglietto.mjs   (le immagini PNG)

Il fronte e' anche il bersaglio AR: se cambia, vanno rifatti public/ar/assets/target.mind e card-front.png.
"""
import math, os, random
import segno

ROOT = os.path.join(os.path.dirname(__file__), '..', 'ar-print')
URL = 'HTTPS://WWW.ARTISMIDESIGNSTUDIO.COM/AR'
INK = '#1A1A1A'; CARTA = '#F4F2EE'
f = lambda v: f'{v:.3f}'.rstrip('0').rstrip('.')

# ─── il sigillo ──────────────────────────────────────────────────────────────────────────────
def sigillo(frase='  Inquadra il biglietto · il logo prende vita · realtà aumentata  '):  # gli spazi ai capi: la bilia in alto sta nel respiro
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
        s.append(f'<rect x="{fc+.5}" y="{fr+.5}" width="6" height="6" rx="1.5" fill="none" stroke="{INK}" stroke-width="1"/>')
        s.append(f'<rect x="{fc+2}" y="{fr+2}" width="3" height="3" rx=".8"/>')
    giro = 2 * math.pi * RT
    # la frase parte in alto e gira in senso orario; textLength la stende esatta sul cerchio
    testo = (f'<path id="giro" fill="none" d="M{f(c0)} {f(c0-RT)} A{f(RT)} {f(RT)} 0 1 1 {f(c0-.001)} {f(c0-RT)}"/>'
             f'<text font-family="JetBrains Mono" font-weight="500" font-size="{f(FS)}" letter-spacing="0" fill="{INK}">'
             f'<textPath href="#giro" textLength="{f(giro)}" lengthAdjust="spacing" xml:space="preserve">{frase.upper()}</textPath></text>')
    croci = []
    for a in (0, 90, 180, 270):                 # crocette di registro sul filo esterno, come in tipografia
        ar = math.radians(a)
        x, y = c0 + R3 * math.cos(ar), c0 + R3 * math.sin(ar)
        dx, dy = math.cos(ar), math.sin(ar)
        croci.append(f'<line x1="{f(x-dx*1.2)}" y1="{f(y-dy*1.2)}" x2="{f(x+dx*1.2)}" y2="{f(y+dy*1.2)}"/>')
    bilia = f'<circle cx="{f(c0)}" cy="{f(c0-R2)}" r="1" fill="{CARTA}" stroke="{INK}" stroke-width="{f(FILO)}"/>'
    ext = R3 + 1.6
    return (f'<svg class="sigillo" xmlns="http://www.w3.org/2000/svg" viewBox="{f(c0-ext)} {f(c0-ext)} {f(2*ext)} {f(2*ext)}" role="img" aria-label="QR: {URL.lower()}">'
            f'<g fill="{INK}">{"".join(s)}</g>{testo}'
            f'<g fill="none" stroke="{INK}" stroke-linecap="round">'
            f'<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R1)}" stroke-width="{f(FILO)}"/>'
            f'<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R2)}" stroke-width="{f(FILO)}"/>'
            f'<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R3)}" stroke-width="{f(HAIR)}"/>'
            f'<g stroke-width="{f(HAIR)}">{"".join(croci)}</g></g>{bilia}</svg>')

MATERIA = ''

# ─── la pagina comune ────────────────────────────────────────────────────────────────────────
TESTA = f'''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>{{titolo}}</title>
<!-- generato da scripts/biglietto.py: modifica li', non qui -->
<style>
  @font-face {{ font-family: "Fraunces"; src: url("fonts/fraunces-latin-full-normal.woff2") format("woff2"); font-weight: 100 900; font-style: normal; }}
  @font-face {{ font-family: "Fraunces"; src: url("fonts/fraunces-latin-full-italic.woff2") format("woff2"); font-weight: 100 900; font-style: italic; }}
  @font-face {{ font-family: "JetBrains Mono"; src: url("fonts/jetbrains-mono-latin-400-normal.woff2") format("woff2"); font-weight: 400; }}
  @font-face {{ font-family: "JetBrains Mono"; src: url("fonts/jetbrains-mono-latin-500-normal.woff2") format("woff2"); font-weight: 500; }}
  @page {{ size: 85mm 55mm; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 1020px; height: 660px; background: {CARTA}; overflow: hidden; }}
  body {{ color: {INK}; font-family: "JetBrains Mono", monospace; }}
  .card {{ position: relative; width: 1020px; height: 660px; }}
  .mono {{ font: 500 13px/1 "JetBrains Mono", monospace; letter-spacing: .22em; text-transform: uppercase; }}
  .rule {{ position: absolute; left: 56px; right: 56px; height: 0; border-top: 1.5px solid {INK}; }}
  .hair {{ border-top-width: .75px; }}
  .serif {{ font-family: "Fraunces", Georgia, serif; font-variation-settings: "SOFT" 50, "WONK" 1; }}
{{stile}}
</style>
</head>
<body>
<div class="card">
{{materia}}
{{corpo}}
</div>
</body>
</html>
'''

def pagina(nome, titolo, stile, corpo):
    open(os.path.join(ROOT, nome), 'w', encoding='utf-8').write(TESTA.replace('{titolo}', titolo).replace('{stile}', stile).replace('{corpo}', corpo).replace('{materia}', MATERIA))

# ─── fronte ──────────────────────────────────────────────────────────────────────────────────
forma = open(os.path.join(os.path.dirname(__file__), 'logo-forma.svg'), encoding='utf-8').read()
d = forma.split(' d="', 1)[1].split('"', 1)[0]
def logo_contorno(d):
    # il logo a contorno, con il filo netto: nessuna texture
    return (f'<svg class="logo" viewBox="0 0 1000 603"><path d="{d}" fill="none" stroke="{INK}" '
            f'stroke-width="4.4" stroke-linejoin="round"/></svg>')

pagina('biglietto-fronte.html', 'Biglietto Artismi · fronte', f'''
  .testa {{ position: absolute; left: 56px; right: 56px; top: 40px; display: flex; justify-content: space-between; }}
  .logo {{ position: absolute; left: 50px; top: 92px; width: 600px; }}
  .piede {{ position: absolute; left: 56px; bottom: 44px; }}
  .piede .serif {{ font-size: 44px; line-height: 1; font-style: italic; font-weight: 380; letter-spacing: -.01em; }}
  .piede .mono {{ margin-top: 14px; font-size: 14px; letter-spacing: .16em; text-transform: none; }}
  .sigillo {{ position: absolute; right: 34px; bottom: 30px; width: 330px; height: 330px; }}
''', f'''  <div class="testa mono"><span>Artismi</span><span>N° 01 — Biglietto</span></div>
  <div class="rule hair" style="top:66px"></div>
  {logo_contorno(d)}
  <div class="piede"><p class="serif">Design Studio</p><p class="mono">artismidesignstudio.com</p></div>
  {sigillo()}''')

# ─── retro ───────────────────────────────────────────────────────────────────────────────────
SERVIZI = ['Identità completa', 'Illustrazioni, stampe e gadget', 'Web, app e realtà aumentata', 'Progettazione partecipata', 'Gestione social']
pagina('biglietto-retro.html', 'Biglietto Artismi · retro', f'''
  .testa {{ position: absolute; left: 56px; right: 56px; top: 40px; display: flex; justify-content: space-between; }}
  .claim {{ position: absolute; left: 56px; top: 96px; font-size: 62px; line-height: 1.02; font-weight: 360; letter-spacing: -.02em; }}
  .claim em {{ font-style: italic; font-weight: 420; }}
  .line {{ position: absolute; left: 58px; top: 238px; width: 560px; font-size: 15px; line-height: 1.55; letter-spacing: .02em; }}
  .servizi {{ position: absolute; right: 56px; top: 236px; width: 330px; list-style: none; }}
  .servizi li {{ display: flex; gap: 16px; align-items: baseline; padding: 7px 0; border-top: .75px solid {INK}; }}
  .servizi li:last-child {{ border-bottom: .75px solid {INK}; }}
  .servizi b {{ font: 500 11px/1 "JetBrains Mono", monospace; letter-spacing: .12em; }}
  .servizi span {{ font-size: 19px; line-height: 1.15; }}
  .contatti {{ position: absolute; left: 56px; right: 56px; bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }}
  .contatti .serif {{ font-size: 24px; font-style: italic; font-weight: 380; }}
  .contatti ul {{ list-style: none; text-align: right; font-size: 14px; line-height: 1.7; letter-spacing: .04em; }}
''', f'''  <div class="testa mono"><span>Artismi — Design Studio</span><span>N° 01 — Retro</span></div>
  <div class="rule hair" style="top:66px"></div>
  <h1 class="claim serif">Diamo un <em>volto</em><br>alla tua attività.</h1>
  <p class="line">Identità visive, illustrazione e murales per negozi, associazioni e piccole imprese.</p>
  <ol class="servizi">{"".join(f'<li><b>{i+1:02d}</b><span class="serif">{t}</span></li>' for i, t in enumerate(SERVIZI))}</ol>
  <div class="rule" style="bottom:126px"></div>
  <div class="contatti"><p class="serif">Inquadra il fronte:<br>il logo prende vita.</p>
    <ul><li>WhatsApp +39 393 195 9752</li><li>apizzoglio@gmail.com</li><li>@giovane_kudos</li></ul></div>''')
print('scritti biglietto-fronte.html e biglietto-retro.html')
