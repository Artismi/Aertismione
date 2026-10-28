#!/usr/bin/env python3
"""L'inchiostro del biglietto, preso da un foglio vero di Stamperia.

Dal foglio 13 si prende la fascia dove il rullo scarico ha lasciato le strisciate delle setole in modo
uniforme. Si tengono solo i segni sottili (le grandi zone bianche si richiudono), si allunga la fascia in
verticale, nel verso delle setole, e si fa netto il bordo: nero pieno e carta, niente grigi impastati
ne' granelli isolati. L'inchiostro non copre mai del tutto: dove il rullo ha scaricato piu' colore e'
piu' carico, altrove la carta traspare. Esce ar-print/inchiostro-stamperia.png: nero con trasparenza.

    python3 scripts/inchiostro-stamperia.py [--foglio 13] [--x 200 --y 620] [--soglia .42] [--carico .62,.86]
    (--soglia piu' bassa = piu' strisciate; --carico = quanto copre l'inchiostro, da .. a ..)
"""
import argparse
import cv2, numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--foglio', default='13')
ap.add_argument('--x', type=int, default=200); ap.add_argument('--y', type=int, default=620)
ap.add_argument('--w', type=int, default=1280); ap.add_argument('--h', type=int, default=468)
ap.add_argument('--soglia', type=float, default=.42)
ap.add_argument('--carico', default='.62,.86', help='trasparenza dell\'inchiostro: dove il rullo ha scaricato meno, dove di piu\'')
ap.add_argument('--apertura', type=int, default=11, help="le zone bianche piu' larghe di cosi' (px) si richiudono")
A = ap.parse_args()

im = cv2.imread(f'public/portfolio/sperimentazione/foglio-{A.foglio}.jpg')
mx = im[A.y:A.y + A.h, A.x:A.x + A.w].max(axis=2).astype(np.float32)   # il massimo dei canali: i colori restano chiari, conta il nero
bianco = 1 - np.clip((185 - mx) / 130, 0, 1)
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (A.apertura, A.apertura))
segni = np.clip(bianco - cv2.morphologyEx(bianco, cv2.MORPH_OPEN, k), 0, 1)
segni = cv2.resize(segni, (1280, 768), interpolation=cv2.INTER_CUBIC)     # le setole sono quasi verticali: si allungano e basta
t = np.clip((cv2.GaussianBlur(segni, (0, 0), .7) - A.soglia) / .08, 0, 1)  # bordo netto, come una stampa
n, lab, st, _ = cv2.connectedComponentsWithStats((t > .5).astype(np.uint8), 8)
tieni = np.zeros(n, bool); tieni[1:] = st[1:, cv2.CC_STAT_AREA] >= 6       # via i granelli isolati
segno = 1 - t * tieni[lab]
# il carico del rullo: il nero del foglio, sfumato, decide quanto l'inchiostro copre (mai del tutto)
nero = cv2.resize(1 - bianco, (1280, 768), interpolation=cv2.INTER_AREA)
nero = cv2.GaussianBlur(nero, (0, 0), 6)
nero = (nero - nero.min()) / max(1e-6, nero.max() - nero.min())
c0, c1 = (float(v) for v in A.carico.split(','))
alpha = segno * (c0 + (c1 - c0) * nero)
a = (alpha * 255).astype(np.uint8)
cv2.imwrite('ar-print/inchiostro-stamperia.png', np.dstack([np.full_like(a, 26)] * 3 + [a]), [cv2.IMWRITE_PNG_COMPRESSION, 9])
print('ar-print/inchiostro-stamperia.png', f'segno {segno.mean():.0%}, copertura media {alpha.mean():.0%}')
