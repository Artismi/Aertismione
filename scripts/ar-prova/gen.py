"""Video sintetici del biglietto con posa nota. Camera OpenCV: x destra, y giu', z avanti.
Biglietto: x destra, y giu' (come l'immagine), z dentro il biglietto; centro nell'origine, mm."""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageFilter

CARD = Image.open(sys.argv[1]).convert('RGB')
OUT = sys.argv[2]
CW, CH = 85.0, 55.0
LONG_FOV = 69.4
rng = np.random.default_rng(7)

def rot(ax, deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    if ax == 'x': return np.array([[1,0,0],[0,c,-s],[0,s,c]])
    if ax == 'y': return np.array([[c,0,s],[0,1,0],[-s,0,c]])
    return np.array([[c,-s,0],[s,c,0],[0,0,1]])

def background(W, H):
    base = rng.normal(150, 18, (H // 8 + 1, W // 8 + 1, 1)).repeat(3, 2)
    base[..., 0] += 10; base[..., 2] -= 8   # legno chiaro
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    return img.filter(ImageFilter.GaussianBlur(2))

def homography(src, dst):
    A = []
    for (x, y), (u, v) in zip(src, dst):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y, -u]); A.append([0, 0, 0, x, y, 1, -v * x, -v * y, -v])
    _, _, Vt = np.linalg.svd(np.array(A)); h = Vt[-1].reshape(3, 3); return h / h[2, 2]

def render(W, H, K, R, t, bg):
    corners = np.array([[-CW/2, -CH/2, 0], [CW/2, -CH/2, 0], [CW/2, CH/2, 0], [-CW/2, CH/2, 0]])
    pc = (R @ corners.T).T + t
    px = (K @ pc.T).T; px = px[:, :2] / px[:, 2:3]
    src = [(0, 0), (CARD.width, 0), (CARD.width, CARD.height), (0, CARD.height)]
    Hm = homography(px, src)  # dall'uscita al biglietto
    card = CARD.transform((W, H), Image.PERSPECTIVE, tuple(Hm.flatten()[:8]), Image.BICUBIC)
    mask = Image.new('L', CARD.size, 255).transform((W, H), Image.PERSPECTIVE, tuple(Hm.flatten()[:8]), Image.BICUBIC)
    img = bg.copy(); img.paste(card, (0, 0), mask)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    a = np.asarray(img).astype(np.float32) + rng.normal(0, 3, (H, W, 3))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def scenario(name, W, H, poses):
    os.makedirs(f'{OUT}/{name}', exist_ok=True)
    f = max(W, H) / 2 / math.tan(math.radians(LONG_FOV) / 2)
    K = np.array([[f, 0, W / 2], [0, f, H / 2], [0, 0, 1]])
    bg = background(W, H)
    truth = []
    for i, (R, t) in enumerate(poses):
        render(W, H, K, R, np.array(t, float), bg).save(f'{OUT}/{name}/{i:03d}.jpg', quality=92)
        truth.append({'R': R.tolist(), 't': list(map(float, t))})
    json.dump({'W': W, 'H': H, 'K': K.tolist(), 'frames': truth}, open(f'{OUT}/{name}/truth.json', 'w'))
    print(name, len(poses))

N = 75
ease = lambda k: 0.5 - 0.5 * math.cos(math.pi * k)
# il biglietto sul tavolo, il telefono lo guarda dall'alto inclinato: rotazione intorno a x
tilt = lambda d: rot('x', d)
if len(sys.argv) > 3 and sys.argv[3] == 'tilt':
    P = []
    for i in range(N):  # in verticale: da sopra il biglietto fino a 60 gradi di taglio, a 30 cm
        k = ease(i / (N - 1)); P.append((tilt(-5 - 55 * k), [0, 0, 300]))
    scenario('verticale-inclina', 720, 1280, P)
    P = []
    for i in range(N):  # in orizzontale, la stessa inclinazione
        k = ease(i / (N - 1)); P.append((tilt(-5 - 55 * k), [0, 0, 300]))
    scenario('orizzontale-inclina', 1280, 720, P)
    sys.exit(0)
P = []
for i in range(N):  # in verticale, ci si allontana da 22 a 60 cm
    k = ease(i / (N - 1)); P.append((tilt(-28), [0, 0, 220 + 380 * k]))
scenario('verticale-indietro', 720, 1280, P)
P = []
for i in range(N):  # in orizzontale, stesso movimento
    k = ease(i / (N - 1)); P.append((tilt(-28), [0, 0, 220 + 380 * k]))
scenario('orizzontale-indietro', 1280, 720, P)
P = []
for i in range(N):  # in verticale, fermo a 35 cm: il tremolio
    P.append((tilt(-35), [0, 0, 350]))
scenario('verticale-fermo', 720, 1280, P)
P = []
for i in range(N):  # in verticale: il biglietto ruota nel piano, si sposta di lato e si inclina
    k = ease(i / (N - 1))
    P.append((rot('z', 70 * k) @ rot('y', 20 * k) @ tilt(-25), [-60 + 120 * k, 40 * k, 320 + 80 * k]))
scenario('verticale-giro', 720, 1280, P)
