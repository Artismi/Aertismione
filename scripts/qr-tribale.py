#!/usr/bin/env python3
"""QR circolare per il biglietto Artismi.

Un QR vero (correzione Q) al centro di un disco. I moduli sono puntini tondi; intorno al codice il disco
continua con puntini finti (non toccano i dati) che rimpiccioliscono verso il bordo, come una mezzatinta;
il bordo e' un anello sottile, dello spessore del contorno del logo. Gli occhi sono tondi ma pieni e
netti: senza quelli il telefono non trova il codice.

    python3 scripts/qr-tribale.py [url] [--out ar-print/qr-tribale.svg] [--ink #1A1A1A] [--seme 3]
"""
import argparse, math, random
import segno

ap = argparse.ArgumentParser()
ap.add_argument('url', nargs='?', default='HTTPS://WWW.ARTISMIDESIGNSTUDIO.COM/AR')
ap.add_argument('--out', default='ar-print/qr-tribale.svg')
ap.add_argument('--ink', default='#1A1A1A')
ap.add_argument('--errore', default='q', help='correzione: l, m, q, h (piu\' alta = codice piu\' fitto)')
ap.add_argument('--seme', type=int, default=3)
ap.add_argument('--anello', type=float, default=.32, help='spessore dell\'anello, in moduli')
A = ap.parse_args()

qr = segno.make(A.url, error=A.errore, micro=False, boost_error=False)
M = [[bool(v) for v in row] for row in qr.matrix]
N = len(M)
rnd = random.Random(A.seme)

R_DOT = 0.40          # raggio del puntino (modulo = 1)
QUIET = 1             # moduli vuoti intorno al codice: separano gli occhi dal riempimento
c0 = N / 2
R_DISCO = math.hypot(c0 + QUIET, c0 + QUIET) + 1.2   # il codice con il suo margine sta dentro il disco
R_ANELLO = R_DISCO + .8

f = lambda v: f'{v:.3f}'.rstrip('0').rstrip('.')
occhio = lambda r, c: any(fr <= r < fr + 7 and fc <= c < fc + 7 for fr, fc in ((0, 0), (0, N - 7), (N - 7, 0)))

punti = []
G = int(math.ceil(R_DISCO)) + 1
for r in range(-G, N + G):
    for c in range(-G, N + G):
        cx, cy = c + .5, r + .5
        if 0 <= r < N and 0 <= c < N:
            if M[r][c] and not occhio(r, c): punti.append((cx, cy, R_DOT))
            continue
        if -QUIET <= r < N + QUIET and -QUIET <= c < N + QUIET: continue
        d = math.hypot(cx - c0, cy - c0)
        if d > R_DISCO - .45: continue
        if rnd.random() > .5: continue
        # mezzatinta: dal margine del codice al bordo il puntino passa da pieno a un granello
        t = max(0, min(1, (d - (c0 + QUIET)) / (R_DISCO - c0 - QUIET)))
        punti.append((cx, cy, R_DOT * (1 - .62 * t)))

ext = R_ANELLO + A.anello / 2 + .5
vb = f'{f(c0-ext)} {f(c0-ext)} {f(2*ext)} {f(2*ext)}'
occhi = []
for fr, fc in ((0, 0), (0, N - 7), (N - 7, 0)):
    x, y = fc + 3.5, fr + 3.5
    # anello tondo pieno (spesso un modulo, come quello quadrato) e pupilla
    occhi.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="3" fill="none" stroke="{A.ink}" stroke-width="1"/>')
    occhi.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="1.5"/>')

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">
<title>Artismi AR — {A.url} — QR circolare, {N}x{N} moduli, correzione {A.errore.upper()}</title>
<g fill="{A.ink}">
{chr(10).join(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}"/>' for x, y, r in punti)}
{chr(10).join(occhi)}
</g>
<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R_ANELLO)}" fill="none" stroke="{A.ink}" stroke-width="{f(A.anello)}"/>
</svg>
'''
open(A.out, 'w').write(svg)
print(A.out, f'{N}x{N} moduli, {len(punti)} puntini, disco {R_ANELLO*2:.1f} moduli')
