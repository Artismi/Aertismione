"""Ricostruisce public/models/logo.glb (il logo 3D della home) dal logo
ridisegnato scripts/logo-forma.svg: solo archi di cerchio e rette, ricalcato
sul disegno originale (public/artismi-logo.png), con i pallini delle due i.

Il pieno si gonfia come una membrana tesa sul bordo: sezione tonda, nessuno
spigolo, il bordo va a filo come una goccia di metallo; lo spessore massimo
e' quello del modello di prima.
Scala, posizione e materiale restano quelli del vecchio file: il sito lo
carica senza toccare il codice.
    pip install numpy pillow scipy shapely triangle
    python scripts/logo-3d.py
    npx @gltf-transform/cli@4.1.1 meshopt public/models/logo.glb public/models/logo.glb \
        --quantize-position 16 --quantize-normal 12 --quantize-texcoord 12
Il secondo comando comprime il file (da 5 MB a meno di 1) per la home; la
precisione alta serve: gli anelli del bordo distano centesimi e su un vetro
lucido le normali a 8 bit fanno bande.
"""
import json, os, re, struct
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd, sparse
from scipy.ndimage import map_coordinates
from scipy.sparse.linalg import spsolve
from shapely import affinity
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union
import shapely
import triangle

SRC = 'scripts/logo-forma.svg'
OUT = 'public/models/logo.glb'
# il vecchio modello: larghezza, angolo in alto a sinistra e spessore (unita' del file)
X0, Y0, LARGO = -455.91943, 2.7719905, 342.87055
Z0, Z1 = -62.32643, -17.774971
SPESSORE = Z1 - Z0
PASSO = 1.0          # distanza tra i punti del bordo, unita' del file
GRIGLIA = 0.3        # lato delle celle della membrana
BANDA, ANELLI = 8.0, 24   # fascia vicino al bordo e quanti anelli la riempiono
SATURA = 3.0         # quanto presto il bordo tondo arriva allo spessore pieno
LETTURA = 1.5        # sotto questa distanza dal bordo la membrana si legge piu' dentro
NODO = {'name': 'aRTISMI 3D', 'rotation': [0.00022664666175842285, 0, 0, 1],
        'scale': [-0.1392299383878708] * 3,
        'translation': [-37.87819290161133, 17.077905654907227, -5.590789318084717]}


def arco(p0, r, grande, verso, p1, passo=0.25):
    """Un arco di cerchio del path SVG (rx = ry, senza rotazione) in punti."""
    m = (p0 + p1) / 2
    corda = np.linalg.norm(p1 - p0)
    r = max(r, corda / 2)
    h = np.sqrt(max(r * r - corda * corda / 4, 0))
    n = np.array([-(p1 - p0)[1], (p1 - p0)[0]]) / corda
    c = m + n * h * (1 if grande != verso else -1)
    a0 = np.arctan2(*(p0 - c)[::-1])
    da = (np.arctan2(*(p1 - c)[::-1]) - a0) % (2 * np.pi)
    if not verso:
        da -= 2 * np.pi
    t = a0 + da * np.linspace(0, 1, max(2, int(abs(da) * r / passo)))[1:]
    return c + r * np.column_stack([np.cos(t), np.sin(t)])


def forma_del_logo():
    """Il path del logo -> poligoni con i buchi (in pixel del disegno)."""
    d = re.search(r' d="([^"]+)"', open(SRC).read()).group(1)
    anelli, pt = [], None
    for cmd, arg in re.findall(r'([MLAZ])([^MLAZ]*)', d):
        v = [float(x) for x in re.findall(r'-?[\d.]+', arg)]
        if cmd == 'M':
            pt = np.array(v[:2]); anelli.append([pt])
        elif cmd == 'L':
            pt = np.array(v[:2]); anelli[-1].append(pt)
        elif cmd == 'A':
            q = np.array(v[5:7]); anelli[-1] += list(arco(pt, v[0], v[3], v[4], q)); pt = q
    # dove due archi si incontrano su una punta il bordo puo' fare un ricciolino
    # che si incrocia: resta solo il pezzo grande
    anelli = [max(getattr(g, 'geoms', [g]), key=lambda p: p.area)
              for g in (shapely.make_valid(Polygon(np.array(a))) for a in anelli)]
    anelli = [Polygon(a.exterior.coords) for a in anelli]
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


def in_file(forma):
    """Dai pixel del disegno alle unita' del vecchio modello (stessa larghezza e angolo)."""
    x0, y0, x1, _ = forma.bounds
    k = LARGO / (x1 - x0)
    return affinity.affine_transform(forma, [k, 0, 0, k, X0 - x0 * k, Y0 - y0 * k])


def membrana(forma):
    """Una membrana tesa sul contorno (lap u = -1, u = 0 sul bordo): liscia
    ovunque, senza creste lungo il centro dei tratti. Torna la griglia e il
    passaggio dalle coordinate del file alle celle."""
    x0, y0, x1, y1 = forma.bounds
    g = GRIGLIA
    w, h = int((x1 - x0) / g) + 3, int((y1 - y0) / g) + 3
    im = Image.new('1', (w, h), 0)
    disegna = ImageDraw.Draw(im)
    for p in getattr(forma, 'geoms', [forma]):
        cella = lambda c: [((x - x0) / g + 1, (y - y0) / g + 1) for x, y in c]
        disegna.polygon(cella(p.exterior.coords), fill=1)
        for buco in p.interiors:
            disegna.polygon(cella(buco.coords), fill=0)
    dentro = np.array(im)
    num = -np.ones(dentro.shape, int)
    num[dentro] = np.arange(dentro.sum())
    ii, jj = np.nonzero(dentro)
    righe, colonne = [np.arange(len(ii))], [np.arange(len(ii))]
    valori = [np.full(len(ii), 4.0)]
    for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        v = num[ii + di, jj + dj]
        ok = v >= 0
        righe.append(np.nonzero(ok)[0]); colonne.append(v[ok]); valori.append(-np.ones(ok.sum()))
    A = sparse.csr_matrix((np.concatenate(valori), (np.concatenate(righe), np.concatenate(colonne))),
                          shape=(len(ii), len(ii)))
    u = np.zeros(dentro.shape)
    u[dentro] = spsolve(A, np.full(len(ii), g * g))
    return u, lambda xy: np.column_stack([(xy[:, 1] - y0) / g + 1, (xy[:, 0] - x0) / g + 1]).T


def anelli_di(forma):
    for p in getattr(forma, 'geoms', [forma]):
        if not p.is_empty:
            yield p.exterior
            yield from p.interiors


def a_passo(anello, passo):
    """Punti lungo l'anello a distanza costante."""
    n = max(4, int(anello.length / passo))
    return np.array([anello.interpolate(t).coords[0] for t in np.linspace(0, anello.length, n, endpoint=False)])


def gonfia(forma):
    # la forma diventa esattamente il bordo campionato: anelli e scelta dei
    # triangoli si fanno su questa, altrimenti nelle curve concave le corde
    # escono dalla forma e i triangoli sottili lungo il bordo spariscono (fori)
    forma = unary_union([Polygon(a_passo(p.exterior, PASSO), [a_passo(h, PASSO) for h in p.interiors])
                         for p in getattr(forma, 'geoms', [forma])])
    u, cella = membrana(forma)
    # i punti: il bordo (vincolato), anelli fitti vicino al bordo dove la
    # superficie e' ripida, poi una griglia rada dentro
    pts, seg = [], []
    for a in anelli_di(forma):
        q = np.asarray(a.coords)[:-1]
        seg += [(len(pts) + i, len(pts) + (i + 1) % len(q)) for i in range(len(q))]
        pts += q.tolist()
    nbordo = len(pts)
    # anelli a passi uguali in altezza (d = k^2): fitti dove la superficie e' quasi verticale
    for k in range(1, ANELLI + 1):
        d = BANDA * (k / ANELLI) ** 2
        for a in anelli_di(forma.buffer(-d)):
            q = a_passo(a, PASSO * (1 + d / 4))
            seg += [(len(pts) + i, len(pts) + (i + 1) % len(q)) for i in range(len(q))]
            pts += q.tolist()
    nucleo = forma.buffer(-BANDA - 1.5)
    if not nucleo.is_empty:
        x0, y0, x1, y1 = nucleo.bounds
        gx, gy = np.meshgrid(np.arange(x0, x1, 2.5), np.arange(y0, y1, 2.5))
        pts += [c for c in zip(gx.ravel(), gy.ravel()) if nucleo.contains(Point(c))]
    t = triangle.triangulate({'vertices': np.array(pts), 'segments': np.array(seg)}, 'p')
    v, tri = t['vertices'], t['triangles']
    tri = tri[shapely.contains_xy(forma, *v[tri].mean(1).T)]
    # altezza: radice della membrana (al bordo sale in verticale, come una goccia),
    # poi tanh che satura presto: bordi tondi e piano pieno al centro, cosi' le
    # parti larghe non diventano cupole che impastano le lettere. Vicino al bordo la
    # griglia e' troppo grossa: la membrana si legge un po' piu' dentro, e
    # verso il bordo va come la radice della distanza esatta
    bordo = forma.boundary
    d = shapely.distance(shapely.points(v), bordo)
    vicino = shapely.get_coordinates(shapely.shortest_line(shapely.points(v), bordo))[1::2]
    dentro = (v - vicino) / np.maximum(d, 1e-9)[:, None]
    lontano = np.maximum(d, LETTURA)
    p_letto = np.where((d < LETTURA)[:, None], vicino + dentro * LETTURA, v)
    u_letto = np.maximum(map_coordinates(u, cella(p_letto), order=1), 0)
    r = np.sqrt(u_letto * d / lontano)
    a = np.percentile(r[r > 0], 90) / SATURA
    alto = SPESSORE / 2 * np.tanh(r / a)
    alto[:nbordo] = 0
    zm = (Z0 + Z1) / 2
    n = len(v)
    pos = np.vstack([np.column_stack([v, zm + alto]), np.column_stack([v, zm - alto])])
    # i vertici del bordo li condividono davanti e dietro: niente spigolo
    unico = np.arange(2 * n)
    unico[n:n + nbordo] = np.arange(nbordo)
    idx = np.vstack([tri, unico[tri[:, ::-1] + n]])
    usati, idx = np.unique(idx, return_inverse=True)
    pos = pos[usati]
    idx = idx.reshape(-1, 3)
    # normali dei vertici dalle facce, pesate per area
    f = pos[idx]
    nf = np.cross(f[:, 1] - f[:, 0], f[:, 2] - f[:, 0])
    nor = np.zeros_like(pos)
    for k in range(3):
        np.add.at(nor, idx[:, k], nf)
    nor /= np.linalg.norm(nor, axis=1, keepdims=True) + 1e-12
    return pos.astype(np.float32), nor.astype(np.float32), idx.astype(np.uint32)


def scrivi(parti):
    """parti: (nome, pos, nor, idx) per pezzo; tutti con il nodo del vecchio modello."""
    blob = b''
    viste, acc, meshes, nodi = [], [], [], []
    for nome, pos, nor, idx in parti:
        uv = ((pos[:, :2] - pos[:, :2].min(0)) / (pos[:, :2].max(0) - pos[:, :2].min(0)).max()).astype(np.float32)
        prima = len(acc)
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
        meshes.append({'name': nome, 'primitives': [{'attributes': {'POSITION': prima, 'NORMAL': prima + 1,
                       'TEXCOORD_0': prima + 2}, 'indices': prima + 3, 'material': 0}]})
        nodi.append(dict(NODO, name=nome, mesh=len(meshes) - 1))
    js = {'asset': {'version': '2.0', 'generator': 'scripts/logo-3d.py'}, 'scene': 0,
          'scenes': [{'name': 'Scene', 'nodes': list(range(len(nodi)))}], 'nodes': nodi,
          'materials': [{'doubleSided': True, 'name': 'Bidirectional Reflect Distribution Func'}],
          'meshes': meshes, 'accessors': acc, 'bufferViews': viste, 'buffers': [{'byteLength': len(blob)}]}
    j = json.dumps(js, separators=(',', ':')).encode()
    j += b' ' * (-len(j) % 4)
    tot = 12 + 8 + len(j) + 8 + len(blob)
    with open(OUT, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, tot))
        f.write(struct.pack('<II', len(j), 0x4E4F534A) + j)
        f.write(struct.pack('<II', len(blob), 0x004E4942) + blob)
    print(f'{OUT}: {sum(len(p[1]) for p in parti)} vertici, {os.path.getsize(OUT) // 1024} KB')


if __name__ == '__main__':
    forma = in_file(forma_del_logo())
    # il pallino della i finale e' un pezzo a parte ("pallino"): nel sito al suo posto
    # c'e' la bilia, il cursore (LogoModel). E' il piu' a destra dei pezzi piccoli
    pezzi = sorted(getattr(forma, 'geoms', [forma]), key=lambda g: g.area)
    pallino = max(pezzi[:-1], key=lambda g: g.centroid.x)
    corpo = unary_union([g for g in pezzi if g is not pallino])
    scrivi([('aRTISMI 3D', *gonfia(corpo)), ('pallino', *gonfia(pallino))])
