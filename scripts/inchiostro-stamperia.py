#!/usr/bin/env python3
"""L'inchiostro del biglietto, preso da un foglio vero di Stamperia.

Dal foglio 13 (la fascia nera rullata in alto) si ritaglia una zona e si tengono solo le strisciate
sottili lasciate dalle setole e i puntini: le grandi zone bianche si richiudono, cosi' il nero resta pieno
ma attraversato da graffi veri. Esce ar-print/inchiostro-stamperia.png: nero con trasparenza.

    python3 scripts/inchiostro-stamperia.py [--foglio 13] [--x 976 --y 400 --w 1280 --h 768]
"""
import argparse
import cv2, numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--foglio', default='13')
ap.add_argument('--x', type=int, default=976); ap.add_argument('--y', type=int, default=400)
ap.add_argument('--w', type=int, default=1280); ap.add_argument('--h', type=int, default=768)
ap.add_argument('--apertura', type=int, default=11, help='le zone bianche piu\' larghe di cosi\' (px) si richiudono')
A = ap.parse_args()

im = cv2.imread(f'public/portfolio/sperimentazione/foglio-{A.foglio}.jpg')
mx = im[A.y:A.y + A.h, A.x:A.x + A.w].max(axis=2).astype(np.float32)   # il massimo dei canali: i colori restano chiari, conta il nero
nero = np.clip((185 - mx) / 130, 0, 1)
bianco = 1 - nero
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (A.apertura, A.apertura))
sottile = np.clip(bianco - cv2.morphologyEx(bianco, cv2.MORPH_OPEN, k), 0, 1)
alpha = 1 - np.clip((sottile - .12) / .6, 0, 1)
a = (alpha * 255).astype(np.uint8)
cv2.imwrite('ar-print/inchiostro-stamperia.png', np.dstack([np.full_like(a, 26)] * 3 + [a]), [cv2.IMWRITE_PNG_COMPRESSION, 9])
print('ar-print/inchiostro-stamperia.png', f'nero {alpha.mean():.0%}')
