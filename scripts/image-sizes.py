"""Legge le misure vere di tutte le immagini del portfolio e le scrive in
src/config/imageSizes.json. Serve alle pagine progetto per impaginare ogni
immagine nelle sue proporzioni (senza tagliarla) e per non ingrandirla oltre
la sua risoluzione. Da rilanciare quando si aggiungono immagini:
    python scripts/image-sizes.py
"""
import json, os, subprocess
from PIL import Image


def misura_video(percorso):
    """Larghezza e altezza di un video, lette con ffprobe."""
    try:
        out = subprocess.run(
            ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
             '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', percorso],
            capture_output=True, text=True, timeout=30).stdout.strip()
        w, h = out.split('x')[:2]
        return int(w), int(h)
    except Exception:
        return None
root = 'public'
out = {}
for d, _, files in os.walk(os.path.join(root, 'portfolio')):
    for f in files:
        est = f.lower().rsplit('.', 1)[-1]
        p = os.path.join(d, f)
        if est in ('mp4', 'webm', 'mov'):
            m = misura_video(p)
            if not m:
                continue
            w, h = m
        elif est in ('jpg', 'jpeg', 'png', 'webp', 'gif'):
            try:
                w, h = Image.open(p).size
            except Exception:
                continue
        else:
            continue
        out['/' + os.path.relpath(p, root).replace(os.sep, '/')] = [w, h]
with open('src/config/imageSizes.json', 'w') as fh:
    json.dump(dict(sorted(out.items())), fh, separators=(',', ':'))
print(len(out), 'immagini')
