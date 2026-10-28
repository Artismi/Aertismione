#!/usr/bin/env python3
"""QR tribale circolare per il biglietto Artismi.

Un QR vero (correzione H) al centro di un disco: i moduli sono gocce che si fondono con i vicini, come il
tratto del logo; intorno al codice il disco si riempie di altri moduli (finti, non toccano i dati) e il
bordo e' un anello con le spine, come le punte delle lettere. I tre occhi restano netti: senza quelli il
telefono non trova il codice.

    python3 scripts/qr-tribale.py [url] [--out ar-print/qr-tribale.svg] [--ink #1A1A1A] [--seme 7]
"""
import argparse, math, random
import segno

ap = argparse.ArgumentParser()
ap.add_argument('url', nargs='?', default='HTTPS://WWW.ARTISMIDESIGNSTUDIO.COM/AR')
ap.add_argument('--out', default='ar-print/qr-tribale.svg')
ap.add_argument('--ink', default='#1A1A1A')
ap.add_argument('--carta', default='none', help='fondo del disco (none = trasparente, il bianco della carta)')
ap.add_argument('--seme', type=int, default=7)
ap.add_argument('--spine', type=int, default=28)
A = ap.parse_args()

qr = segno.make(A.url, error='h', micro=False)
M = [[bool(v) for v in row] for row in qr.matrix]
N = len(M)
rnd = random.Random(A.seme)

R_DOT = 0.40          # raggio della goccia (modulo = 1)
QUIET = 1             # moduli vuoti intorno al codice: separano gli occhi dal riempimento
c0 = N / 2
R_DISCO = math.hypot(c0 + QUIET, c0 + QUIET) + 2.6   # il codice con il suo margine sta dentro il disco
R_ANELLO = R_DISCO + 0.9
SPESS = 0.9

def finder(r, c):
    for fr, fc in ((0, 0), (0, N - 7), (N - 7, 0)):
        if fr <= r < fr + 7 and fc <= c < fc + 7: return True
    return False

# la griglia estesa: dentro il codice i moduli veri, fuori (oltre il margine) quelli decorativi
G = int(math.ceil(R_DISCO)) + 1
dark = {}
for r in range(-G, N + G):
    for c in range(-G, N + G):
        x, y = c + .5 - c0, r + .5 - c0
        if 0 <= r < N and 0 <= c < N:
            if M[r][c] and not finder(r, c): dark[(r, c)] = True
            continue
        if -QUIET <= r < N + QUIET and -QUIET <= c < N + QUIET: continue
        d = math.hypot(x, y)
        if d > R_DISCO - .7: continue
        # piu' fitto verso il bordo: il disco "si chiude" nell'anello
        p = .38 + .3 * max(0, (d - (c0 + 2)) / (R_DISCO - c0 - 2))
        if rnd.random() < p: dark[(r, c)] = True

out = []
f = lambda v: f'{v:.3f}'.rstrip('0').rstrip('.')
def cerchio(cx, cy, r): out.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"/>')
def rett(x, y, w, h): out.append(f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"/>')

for (r, c) in dark:
    cx, cy = c + .5, r + .5
    cerchio(cx, cy, R_DOT)
    # i ponti verso destra e in basso: le gocce vicine si fondono in un tratto solo
    if dark.get((r, c + 1)): rett(cx, cy - R_DOT * .82, 1, R_DOT * 1.64)
    if dark.get((r + 1, c)): rett(cx - R_DOT * .82, cy, R_DOT * 1.64, 1)
    # dove quattro si toccano, il buco in mezzo si chiude
    if dark.get((r, c + 1)) and dark.get((r + 1, c)) and dark.get((r + 1, c + 1)): rett(cx, cy, 1, 1)

# gli occhi: anello tondo-quadro 7x7, vuoto 5x5, pupilla 3x3 a goccia
occhi = []
for fr, fc in ((0, 0), (0, N - 7), (N - 7, 0)):
    x, y = fc, fr
    occhi.append(f'<path fill-rule="evenodd" d="M{x+2} {y} h3 a2 2 0 0 1 2 2 v3 a2 2 0 0 1 -2 2 h-3 a2 2 0 0 1 -2 -2 v-3 a2 2 0 0 1 2 -2z '
                 f'M{x+2.2} {y+1} a1.2 1.2 0 0 0 -1.2 1.2 v2.6 a1.2 1.2 0 0 0 1.2 1.2 h2.6 a1.2 1.2 0 0 0 1.2 -1.2 v-2.6 a1.2 1.2 0 0 0 -1.2 -1.2z"/>')
    occhi.append(f'<rect x="{x+2}" y="{y+2}" width="3" height="3" rx="1.2"/>')

# l'anello con le spine: alterna punte lunghe e corte, leggermente piegate come le lettere
spine = []
K = A.spine
for i in range(K):
    a = 2 * math.pi * i / K + rnd.uniform(-.04, .04)
    lunga = i % 2 == 0
    h = (4.2 if lunga else 2.2) * rnd.uniform(.85, 1.15)
    rb = R_ANELLO + SPESS / 2 - .1
    w = (1.1 if lunga else .75) / rb  # mezza larghezza della base: in moduli, poi in radianti
    piega = rnd.choice((-1, 1)) * rnd.uniform(.03, .07)   # la punta si piega di lato, come le spine del logo
    p1 = (c0 + rb * math.cos(a - w), c0 + rb * math.sin(a - w))
    p2 = (c0 + rb * math.cos(a + w), c0 + rb * math.sin(a + w))
    tip = (c0 + (rb + h) * math.cos(a + piega), c0 + (rb + h) * math.sin(a + piega))
    m1 = (c0 + (rb + h * .5) * math.cos(a - w * .15 + piega * .2), c0 + (rb + h * .5) * math.sin(a - w * .15 + piega * .2))
    m2 = (c0 + (rb + h * .5) * math.cos(a + w * .15 + piega * .2), c0 + (rb + h * .5) * math.sin(a + w * .15 + piega * .2))
    spine.append(f'<path d="M{f(p1[0])} {f(p1[1])} Q{f(m1[0])} {f(m1[1])} {f(tip[0])} {f(tip[1])} Q{f(m2[0])} {f(m2[1])} {f(p2[0])} {f(p2[1])}z"/>')

ext = R_ANELLO + SPESS / 2 + 5
vb = f'{f(c0-ext)} {f(c0-ext)} {f(2*ext)} {f(2*ext)}'
fondo = '' if A.carta == 'none' else f'<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R_ANELLO)}" fill="{A.carta}"/>'
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">
<title>Artismi AR — {A.url} — QR tribale, {N}x{N} moduli, correzione H</title>
{fondo}
<g fill="{A.ink}">
{chr(10).join(out)}
{chr(10).join(occhi)}
{chr(10).join(spine)}
</g>
<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R_ANELLO)}" fill="none" stroke="{A.ink}" stroke-width="{SPESS}"/>
</svg>
'''
open(A.out, 'w').write(svg)
print(A.out, f'{N}x{N} moduli, {len(dark)} gocce, disco {R_ANELLO*2:.1f} moduli')
