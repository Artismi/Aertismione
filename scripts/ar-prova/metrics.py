import json, sys, glob, math, os
import numpy as np
def d(a, b): return math.hypot(a[0] - b[0], a[1] - b[1])
for f in sys.argv[1:]:
    r = json.load(open(f)); L = max(r['W'], r['H'])
    rows = r['rows']; seen = [x for x in rows if x['seen']]
    out = [os.path.basename(f)[:-5].ljust(60), f"visto {len(seen):2d}/{len(rows)}"]
    for k in ['raw', 'stab']:
        if not seen or k not in seen[0]: continue
        e = np.array([d(x[k]['top'], x['true']['top']) for x in seen if k in x]) / L * 100
        c = np.array([d(x[k]['ctr'], x['true']['ctr']) for x in seen if k in x]) / L * 100
        # tremolio: quanto la cima si muove da un fotogramma al successivo oltre al moto vero
        tops = [x for x in seen if k in x]
        j = [abs(d(a[k]['top'], b[k]['top']) - d(a['true']['top'], b['true']['top'])) for a, b in zip(tops, tops[1:]) if b['i'] == a['i'] + 1]
        out.append(f"{k}: cima med {np.median(e):5.1f}% p95 {np.percentile(e,95):5.1f}% | centro med {np.median(c):4.1f}% | scatto med {np.median(j)/L*100 if j else 0:4.2f}%")
    print('  '.join(out))
