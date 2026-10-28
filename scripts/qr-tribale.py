#!/usr/bin/env python3
"""QR del biglietto Artismi: il cerchio di evocazione dell'ologramma.

Al centro un QR vero (correzione Q), moduli quadrati appena arrotondati. Intorno, il sigillo da cui sale
l'ologramma: due anelli sottili, fra loro una ghiera di tacche come un quadrante, e tre bilie (come i
puntini delle i del logo) sull'anello esterno, in linea con i tre occhi del codice. Tutto e' disegnato
con il filo del logo a contorno; dentro il primo anello resta solo il codice.

    python3 scripts/qr-tribale.py [url] [--out ar-print/qr-tribale.svg] [--ink #1A1A1A]
"""
import argparse, math
import segno

ap = argparse.ArgumentParser()
ap.add_argument('url', nargs='?', default='HTTPS://WWW.ARTISMIDESIGNSTUDIO.COM/AR')
ap.add_argument('--out', default='ar-print/qr-tribale.svg')
ap.add_argument('--ink', default='#1A1A1A')
ap.add_argument('--errore', default='q', help="correzione: l, m, q, h (piu' alta = codice piu' fitto)")
ap.add_argument('--filo', type=float, default=.42, help='spessore delle linee, in moduli (come il contorno del logo)')
ap.add_argument('--tacche', type=int, default=96)
A = ap.parse_args()

qr = segno.make(A.url, error=A.errore, micro=False, boost_error=False)
M = [[bool(v) for v in r] for r in qr.matrix]
N = len(M); c0 = N / 2; W = A.filo; INK = A.ink
f = lambda v: f'{v:.3f}'.rstrip('0').rstrip('.')
occhio = lambda r, c: any(fr <= r < fr + 7 and fc <= c < fc + 7 for fr, fc in ((0, 0), (0, N - 7), (N - 7, 0)))

R1 = math.hypot(c0, c0) + 1.4      # primo anello: il codice e il suo margine ci stanno dentro
T0, T1, T2 = R1 + .9, R1 + 1.7, R1 + 2.6   # tacche: corte e lunghe
R2 = R1 + 3.5                      # anello esterno, dove stanno le bilie
RB = 1.15                          # raggio delle bilie

s = []
# il codice
for r in range(N):
    for c in range(N):
        if M[r][c] and not occhio(r, c): s.append(f'<rect x="{f(c+.06)}" y="{f(r+.06)}" width=".88" height=".88" rx=".24"/>')
for fr, fc in ((0, 0), (0, N - 7), (N - 7, 0)):
    s.append(f'<rect x="{fc+.5}" y="{fr+.5}" width="6" height="6" rx="1.6" fill="none" stroke="{INK}" stroke-width="1"/>')
    s.append(f'<rect x="{fc+2}" y="{fr+2}" width="3" height="3" rx=".9"/>')

linee = [f'<circle cx="{f(c0)}" cy="{f(c0)}" r="{f(R1)}"/>']
# angoli delle bilie: in diagonale, dalla parte dei tre occhi (alto-sinistra, alto-destra, basso-sinistra)
BILIE = [-135, -45, 135]
vuoto = lambda deg: any(abs((deg - b + 180) % 360 - 180) < 7 for b in BILIE)   # le tacche si aprono intorno alle bilie
for i in range(A.tacche):
    deg = i * 360 / A.tacche - 180
    if vuoto(deg): continue
    a = math.radians(deg)
    r_end = T2 if i % 8 == 0 else T1
    linee.append(f'<line x1="{f(c0+T0*math.cos(a))}" y1="{f(c0+T0*math.sin(a))}" x2="{f(c0+r_end*math.cos(a))}" y2="{f(c0+r_end*math.sin(a))}"/>')
# l'anello esterno si interrompe dove passa la bilia: la bilia ci sta dentro come una perla sul filo
gap = math.degrees(math.asin((RB + .55) / R2))
archi = sorted(BILIE)
for i, b in enumerate(archi):
    a0 = math.radians(b + gap); a1 = math.radians(archi[(i + 1) % len(archi)] - gap + (360 if i == len(archi) - 1 else 0))
    large = 1 if (a1 - a0) % (2 * math.pi) > math.pi else 0
    linee.append(f'<path d="M{f(c0+R2*math.cos(a0))} {f(c0+R2*math.sin(a0))} A{f(R2)} {f(R2)} 0 {large} 1 {f(c0+R2*math.cos(a1))} {f(c0+R2*math.sin(a1))}"/>')
for b in BILIE:
    a = math.radians(b)
    linee.append(f'<circle cx="{f(c0+R2*math.cos(a))}" cy="{f(c0+R2*math.sin(a))}" r="{f(RB)}"/>')

ext = R2 + RB + W
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(c0-ext)} {f(c0-ext)} {f(2*ext)} {f(2*ext)}">
<title>Artismi AR — {A.url} — QR nel cerchio di evocazione, {N}x{N} moduli, correzione {A.errore.upper()}</title>
<g fill="{INK}">
{chr(10).join(s)}
</g>
<g fill="none" stroke="{INK}" stroke-width="{f(W)}" stroke-linecap="round">
{chr(10).join(linee)}
</g>
</svg>
'''
open(A.out, 'w').write(svg)
print(A.out, f'{N}x{N} moduli, sigillo {2*ext:.1f} moduli')
