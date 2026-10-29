# Banco di prova dell'aggancio AR

Misura quanto l'ologramma resta saldo al biglietto: video sintetici del fronte del biglietto con
posa nota (in verticale e in orizzontale, allontanandosi, inclinando, girando, fermo), letti dal
MindAR vero fotogramma per fotogramma. Si confronta dove finisce sullo schermo la cima
dell'ologramma (12,5 cm sopra il biglietto) con dove dovrebbe essere. Camera dei video: 69,4° sul
lato lungo (26 mm equivalenti), come suppone `public/ar/app.js`.

```bash
F=/tmp/ar-prova                                   # fuori dal repo: sono centinaia di jpg
python3 scripts/ar-prova/gen.py public/ar/assets/card-front.png $F/frames
python3 scripts/ar-prova/gen.py public/ar/assets/card-front.png $F/frames tilt
node scripts/ar-prova/server.cjs public $F &      # serve public/ e, sotto /h/, il banco
cp scripts/ar-prova/index.html $F/
mkdir -p $F/raw
# le pose grezze di MindAR (m=old: com'era su main, m=new: focale corretta e filtro spento)
node scripts/ar-prova/run.cjs $F/raw "s=verticale-indietro&m=new" "s=verticale-inclina&m=new"   # ecc.
# lo stabilizzatore sulle pose registrate (veloce: si puo' ritarare senza rifare i video)
RAW=$F/raw node scripts/ar-prova/offline.mjs public/ar/stabile.js '{"minCut":0.8}'
```

`run.cjs` usa Playwright con Chromium (rendering software); `gen.py` Pillow e numpy.
Va rilanciato quando cambia il fronte del biglietto (e quindi `target.mind`).
