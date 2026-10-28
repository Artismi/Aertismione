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
</div></body></html>
'''
    open(os.path.join(out, 'biglietto-retro.html'), 'w', encoding='utf-8').write(html)
    # il render vuole anche un fronte: si copia quello vero
    fr = open(os.path.join(QUI, '..', 'ar-print', 'biglietto-fronte.html'), encoding='utf-8').read().replace('url("fonts/', f'url("{F}/')
    open(os.path.join(out, 'biglietto-fronte.html'), 'w', encoding='utf-8').write(fr)

CONTATTI = '<p>WhatsApp +39 393 195 9752</p><p>apizzoglio@gmail.com</p>'

# A · indice: i servizi come l'indice di una rivista, i numeri enormi in colonna
scrivi('retro-indice', ROSA, PRUGNA, f'''
  .testa {{ position: absolute; left: 48px; top: 40px; right: 48px; display: flex; justify-content: space-between; }}
  .claim {{ position: absolute; left: 48px; top: 92px; width: 330px; font-size: 54px; line-height: .95; }}
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
import re
# il sigillo e' lo stesso del fronte: lo si prende gia' disegnato da biglietto-fronte.html
SIGILLO = re.search(r'<svg class="sigillo".*?</svg>', open(os.path.join(QUI, '..', 'ar-print', 'biglietto-fronte.html'), encoding='utf-8').read(), re.S).group(0)
# una riga per servizio: a cosa serve (riassunto di SERVICES.promise in src/config/content.ts)
DETTAGLI = ['Dal logo ai muri del negozio', 'Disegni che la gente porta con sé', 'Online come dal vivo', 'Con chi vivrà il progetto', 'I tuoi canali, con la tua voce']
scrivi('retro-fusione', NOTTE, ROSA, f'''
  .sigillo {{ position: absolute; right: 30px; top: 22px; width: 300px; height: 300px; }}
  .prima {{ position: absolute; left: 50px; top: 52px; font-size: 34px; }}
  .volto {{ position: absolute; left: 34px; top: 74px; font-size: 220px; line-height: .8; letter-spacing: -.03em; white-space: nowrap; }}
  .dopo {{ position: absolute; left: 52px; top: 268px; font-size: 34px; }}
  .linea {{ position: absolute; left: 48px; right: 48px; height: 0; border-top: 1px solid {ROSA}; }}
  .indice {{ position: absolute; left: 48px; right: 48px; top: 352px; list-style: none; display: grid; grid-template-columns: 1fr 1.15fr 1.1fr 1.05fr 1fr; gap: 16px; }}
  .indice .a {{ display: block; font-size: 64px; line-height: .8; letter-spacing: -.02em; }}
  .indice .c {{ display: block; margin-top: 12px; font-size: 21px; line-height: 1.05; text-wrap: balance; }}
  .indice .m {{ display: block; margin-top: 9px; font-size: 11px; line-height: 1.45; letter-spacing: .03em; opacity: .78; text-wrap: balance; }}
  .piede {{ position: absolute; left: 48px; right: 48px; bottom: 38px; display: flex; justify-content: space-between; align-items: baseline; }}
  .piede .c {{ font-size: 24px; }}
  .piede .m {{ display: flex; gap: 34px; }}
''', f'''  {SIGILLO}
  <p class="prima a">Diamo un</p>
  <p class="volto c">volto</p>
  <p class="dopo a">alla tua attività.</p>
  <div class="linea" style="top:332px"></div>
  <ol class="indice">{"".join(f'<li><span class="a">{i+1:02d}</span><span class="c">{t}</span><span class="m">{x}</span></li>' for i, (t, x) in enumerate(zip(SERVIZI, DETTAGLI)))}</ol>
  <div class="linea" style="bottom:86px"></div>
  <div class="piede"><p class="c">Inquadra il fronte: il logo prende vita.</p><div class="m"><p>WhatsApp +39 393 195 9752</p><p>apizzoglio@gmail.com</p></div></div>''')
print('scritte le proposte del retro')
