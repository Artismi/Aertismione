"""Ricostruisce public/models/logo.glb (il logo 3D della home) dal disegno
originale public/artismi-logo.png, cosi' la forma e' quella della mano:
pallino della i compreso, punte della M e della i lunghe come nel tag.

Il disegno e' un contorno chiuso: le zone bianche a un tratto dal fondo sono
le lettere (e il pallino), quelle piu' dentro sono i buchi. Il contorno
passa a meta' del tratto, poi si estrude con lo spessore del modello di prima.
Scala, posizione e materiale restano quelli del vecchio file: il sito lo
carica senza toccare il codice.
    pip install numpy pillow scipy scikit-image shapely mapbox_earcut
    python scripts/logo-3d.py
"""
import json, os, struct
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from skimage import measure
from shapely.geometry import Polygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union
import mapbox_earcut as earcut

SRC = 'public/artismi-logo.png'
OUT = 'public/models/logo.glb'
S = 4                # sovracampionamento del disegno
TRATTO = 4.0 * S     # spessore della linea del disegno, in pixel sovracampionati
# il vecchio modello: larghezza, angolo in alto a sinistra e spessore (unita' del file)
X0, Y0, LARGO = -455.91943, 2.7719905, 342.87055
Z0, Z1 = -62.32643, -17.774971
NODO = {'name': 'aRTISMI 3D', 'rotation': [0.00022664666175842285, 0, 0, 1],
        'scale': [-0.1392299383878708] * 3,
        'translation': [-37.87819290161133, 17.077905654907227, -5.590789318084717]}


def sagoma():
    """Il pieno delle lettere, con il bordo a meta' del tratto."""
    im = Image.open(SRC).convert('RGBA')
    fondo = Image.new('RGBA', im.size, 'white')
    fondo.alpha_composite(im)
    w = 1000                                   # a destra c'e' DESIGN STUDIO
    g = fondo.convert('L').crop((0, 0, w, im.height)).resize((w * S, im.height * S), Image.LANCZOS)
    inchiostro = np.array(g) < 150
    lab, n = nd.label(~inchiostro)
    bordo = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fuori = np.isin(lab, list(bordo))
    vicino = nd.binary_dilation(fuori, iterations=int(TRATTO * 1.5))
    # a un tratto dal fondo: lettere e pallino; il resto sono buchi
    buchi = np.zeros_like(fuori)
    for i in range(1, n + 1):
        if i in bordo:
            continue
        r = lab == i
        if not (r & vicino).any():
            buchi |= r
    vuoto = fuori | buchi
    pieno = nd.distance_transform_edt(~vuoto) > TRATTO / 2
    return nd.gaussian_filter(pieno.astype(float), S * 0.8)


def liscia(c, passo=1.0 * S, sigma=1.6 * S):
    """Ricampiona l'anello a passo costante e lo ammorbidisce lungo il bordo:
    il tremolio del tratto sparisce (il sito lo disegnerebbe come spigoli),
    le punte del tag restano."""
    if np.allclose(c[0], c[-1]):
        c = c[:-1]
    seg = np.linalg.norm(np.diff(np.vstack([c, c[:1]]), axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    n = max(8, int(s[-1] / passo))
    t = np.linspace(0, s[-1], n, endpoint=False)
    chiuso = np.vstack([c, c[:1]])
    r = np.column_stack([np.interp(t, s, chiuso[:, k]) for k in (0, 1)])
    return nd.gaussian_filter1d(r, sigma / passo, axis=0, mode='wrap')


def poligoni(campo):
    """Contorni lisci -> poligoni con i buchi (in pixel sovracampionati)."""
    anelli = [Polygon(liscia(c[:, ::-1])) for c in measure.find_contours(campo, 0.5)]
    anelli = [a for a in anelli if a.is_valid and a.area > (3 * S) ** 2]
    # pari/dispari: un anello dentro un numero dispari di altri e' un buco,
    # e appartiene al piu' piccolo degli anelli pieni che lo contengono
    punti = [a.representative_point() for a in anelli]
    fondo = [sum(b.contains(punti[i]) for b in anelli if b is not a) for i, a in enumerate(anelli)]
    pezzi = []
    for i, a in enumerate(anelli):
        if fondo[i] % 2:
            continue
        buchi = [b.exterior.coords for j, b in enumerate(anelli)
                 if fondo[j] == fondo[i] + 1 and a.contains(punti[j])]
        pezzi.append(Polygon(a.exterior.coords, buchi))
    return unary_union(pezzi)


def estrudi(forma):
    pos, nor, idx = [], [], []

    def anello(c):
        return np.asarray(c)[:-1]

    geoms = getattr(forma, 'geoms', [forma])
    xs = np.concatenate([np.asarray(p.exterior.coords)[:, 0] for p in geoms])
    ys = np.concatenate([np.asarray(p.exterior.coords)[:, 1] for p in geoms])
    k = LARGO / (xs.max() - xs.min())
    mx, my = xs.min(), ys.min()

    def a_file(c):
        return np.column_stack([X0 + (c[:, 0] - mx) * k, Y0 + (c[:, 1] - my) * k])

    for p in geoms:
        p = orient(p.buffer(0), 1.0)   # fuori antiorario, buchi orari: (dy, -dx) guarda fuori
        anelli = [a_file(anello(p.exterior.coords))] + [a_file(anello(h.coords)) for h in p.interiors]
        # facce davanti e dietro
        tutti = np.concatenate(anelli)
        fine = np.cumsum([len(a) for a in anelli]).astype(np.uint32)
        tri = np.asarray(earcut.triangulate_float64(tutti, fine)).reshape(-1, 3)
        for z, nz, giro in ((Z1, 1.0, False), (Z0, -1.0, True)):
            base = len(pos)
            pos += [(x, y, z) for x, y in tutti]
            nor += [(0, 0, nz)] * len(tutti)
            t = tri[:, ::-1] if giro else tri
            idx += (t + base).tolist()
        # pareti: normali dei vertici mediate su qualche lato, cosi' la luce
        # scorre sulle curve senza striature
        for a in anelli:
            m = len(a)
            d = np.roll(a, -1, 0) - a
            nl = np.column_stack([d[:, 1], -d[:, 0]])
            nl /= np.linalg.norm(nl, axis=1, keepdims=True) + 1e-12
            nv = nd.gaussian_filter1d(nl + np.roll(nl, 1, 0), 2.0, axis=0, mode='wrap')
            nv /= np.linalg.norm(nv, axis=1, keepdims=True) + 1e-12
            base = len(pos)
            pos += [(x, y, Z0) for x, y in a] + [(x, y, Z1) for x, y in a]
            nor += [(nx, ny, 0) for nx, ny in nv] * 2
            for i in range(m):
                j = (i + 1) % m
                idx += [[base + i, base + j, base + m + j], [base + i, base + m + j, base + m + i]]
    return np.array(pos, np.float32), np.array(nor, np.float32), np.array(idx, np.uint32)


def scrivi(pos, nor, idx):
    # le facce devono guardare fuori: con la scala negativa del nodo si gira tutto
    v = pos[idx]
    nf = np.cross(v[:, 1] - v[:, 0], v[:, 2] - v[:, 0])
    nm = nor[idx].mean(1)
    storti = (nf * nm).sum(1) < 0
    idx[storti] = idx[storti][:, ::-1]
    uv = ((pos[:, :2] - pos[:, :2].min(0)) / (pos[:, :2].max(0) - pos[:, :2].min(0)).max()).astype(np.float32)
    blob = b''
    viste, acc = [], []
    for arr, tipo, ct, minmax in ((pos, 'VEC3', 5126, True), (nor, 'VEC3', 5126, False),
                                  (uv, 'VEC2', 5126, False), (idx.reshape(-1), 'SCALAR', 5125, False)):
        dati = arr.tobytes()
        vista = {'buffer': 0, 'byteOffset': len(blob), 'byteLength': len(dati)}
        vista['target'] = 34963 if tipo == 'SCALAR' else 34962
        viste.append(vista)
        a = {'bufferView': len(viste) - 1, 'componentType': ct, 'count': len(arr), 'type': tipo}
        if minmax:
            a['min'] = arr.min(0).tolist()
            a['max'] = arr.max(0).tolist()
        acc.append(a)
        blob += dati + b'\0' * (-len(dati) % 4)
    js = {'asset': {'version': '2.0', 'generator': 'scripts/logo-3d.py'}, 'scene': 0,
          'scenes': [{'name': 'Scene', 'nodes': [0]}], 'nodes': [dict(NODO, mesh=0)],
          'materials': [{'doubleSided': True, 'name': 'Bidirectional Reflect Distribution Func'}],
          'meshes': [{'name': 'aRTISMI 3D', 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2},
                                                             'indices': 3, 'material': 0}]}],
          'accessors': acc, 'bufferViews': viste, 'buffers': [{'byteLength': len(blob)}]}
    j = json.dumps(js, separators=(',', ':')).encode()
    j += b' ' * (-len(j) % 4)
    tot = 12 + 8 + len(j) + 8 + len(blob)
    with open(OUT, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, tot))
        f.write(struct.pack('<II', len(j), 0x4E4F534A) + j)
        f.write(struct.pack('<II', len(blob), 0x004E4942) + blob)
    print(f'{OUT}: {len(pos)} vertici, {len(idx)} triangoli, {os.path.getsize(OUT) // 1024} KB')


if __name__ == '__main__':
    scrivi(*estrudi(poligoni(sagoma())))
