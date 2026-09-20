"""Legge le misure vere di tutte le immagini del portfolio e le scrive in
src/config/imageSizes.json. Serve alle pagine progetto per impaginare ogni
immagine nelle sue proporzioni (senza tagliarla) e per non ingrandirla oltre
la sua risoluzione. Da rilanciare quando si aggiungono immagini:
    python scripts/image-sizes.py
"""
import json, os
from PIL import Image
root = 'public'
out = {}
for d, _, files in os.walk(os.path.join(root, 'portfolio')):
    for f in files:
        if f.lower().rsplit('.', 1)[-1] not in ('jpg', 'jpeg', 'png', 'webp', 'gif'):
            continue
        p = os.path.join(d, f)
        try:
            w, h = Image.open(p).size
        except Exception:
            continue
        out['/' + os.path.relpath(p, root).replace(os.sep, '/')] = [w, h]
with open('src/config/imageSizes.json', 'w') as fh:
    json.dump(dict(sorted(out.items())), fh, separators=(',', ':'))
print(len(out), 'immagini')
