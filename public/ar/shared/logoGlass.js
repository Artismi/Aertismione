// COPIA GENERATA da src/shaders/ con scripts/sync-ar-shared.mjs: non modificarla qui.
/**
 * Il vetro del logo della home e l'acqua che ci si vede attraverso.
 *
 * Shader condivisi tra la home (CausticsPlane, WorldBackdrop, WaterCanvas,
 * LogoModel) e la pagina AR del biglietto (public/ar/site-look.js), che ne usa
 * una copia identica in public/ar/shared/logoGlass.js: la scrive
 * scripts/sync-ar-shared.mjs prima di `npm run dev` e `npm run build`.
 * Si modifica qui, mai nella copia: cosi' il logo AR e' sempre quello della home.
 *
 * JavaScript puro, dipende solo da three: lo deve poter caricare anche il
 * browser, senza passare dal bundler del sito.
 */
import * as THREE from 'three'

// ─── La piscina rosa (CausticsPlane) ──────────────────────────────────────────
// Tecnica: zero-crossing di un singolo campo liscio.
// field(p,t) = onda dominante + perturbazione a bassa ampiezza.
// Gli zero-crossing di un campo C-infinito sono SEMPRE curve C-infinito;
// si biforcano e si fondono nei punti sella — esattamente i filamenti
// di luce sul fondo di una piscina.
// Un solo campo → UN'unica famiglia di curve, senza caos da sovrapposizione.
export const causticsFragment = /* glsl */`
  uniform float u_time;
  uniform float u_fade;
  uniform float u_white; // 0 = rosa hero, 1 = bianco about
  uniform vec2  u_res;
  varying vec2  vUv;

  // Tre componenti in direzioni diverse → molti punti sella → rete ramificata.
  // La rete emerge dallo ZERO-CROSSING di (a+b+c): un'unica curva continua
  // che si biforca ai punti sella. Nessun abs(sin(f*k)) → niente spigoli.
  float field(vec2 p, float t) {
    // 3 onde a 120° con ampiezza uguale → isotropia perfetta.
    // Nessuna direzione privilegiata: la ragnatela si muove
    // uniformemente in tutte le direzioni.

    // Dir 0°
    float a = sin(p.x * 1.4 + sin(p.y * 1.1 + t * 0.34) * 1.0 + t * 0.26);

    // Dir 120°: rot(120°) = (-0.5, +0.866)
    vec2 p2 = vec2(-0.500 * p.x - 0.866 * p.y,
                    0.866 * p.x - 0.500 * p.y);
    float b = sin(p2.x * 1.4 + sin(p2.y * 1.1 + t * 0.29) * 1.0 + t * 0.21);

    // Dir 240°: rot(240°) = (-0.5, -0.866)
    vec2 p3 = vec2(-0.500 * p.x + 0.866 * p.y,
                   -0.866 * p.x - 0.500 * p.y);
    float c = sin(p3.x * 1.4 + sin(p3.y * 1.1 + t * 0.25) * 1.0 + t * 0.17);

    return (a + b + c) / 3.0;
  }

  void main() {
    float t  = u_time * 0.22;  // lento: i punti sella evolvono piano → legami duraturi
    vec2  uv = vUv;
    uv.x *= u_res.x / u_res.y;
    uv   *= 22.5;

    // ── Campo di flusso condiviso ─────────────────────────────────
    // Due campionature a bassa frequenza dello stesso field → vettore 2D
    // che rappresenta la "corrente d'acqua" sottostante.
    // Entrambi i layer vengono deformati da questo stesso flusso:
    // si muovono casualmente MA in modo coerente — network interdipendente.
    float flowX = field(uv * 0.18 + vec2(0.0, 0.0), t * 0.18);
    float flowY = field(uv * 0.18 + vec2(3.9, 2.2), t * 0.18);
    vec2  flow  = vec2(flowX, flowY) * 1.4;

    // ── Unico campo: l'intera superficie d'acqua ─────────────────
    float f = field(uv + flow, t);

    // ── Modulazione neuronale: dove le linee si attivano/silenziamo ──
    // Due campi lenti e larghi (scala 0.20) definiscono zone di
    // "attivazione". Il prodotto li rende discontinui: entrambi
    // devono essere positivi perché la linea sia visibile.
    // A e B usano offset spaziali diversi → rompono in zone indipendenti
    // ma la stessa lentezza li tiene coordinati nel tempo.
    // Scale più alte (0.32 / 0.22) → zone di attivazione più piccole → gap più frequenti
    float modA = (field(uv * 0.32 + vec2(0.0, 0.0), t * 0.10) * 0.5 + 0.5)
               * (field(uv * 0.22 + vec2(1.9, 2.6), t * 0.08) * 0.5 + 0.5);
    float breakA = smoothstep(0.14, 0.48, modA);

    float modB = (field(uv * 0.32 + vec2(3.2, 1.5), t * 0.10) * 0.5 + 0.5)
               * (field(uv * 0.22 + vec2(0.4, 3.8), t * 0.08) * 0.5 + 0.5);
    float breakB = smoothstep(0.14, 0.48, modB);

    // Layer A: livello f = 0 — filamenti principali
    float coreA = max(0.0, 1.0 - abs(f) / 0.10);
    coreA = coreA * coreA * coreA;
    float haloA = max(0.0, 1.0 - abs(f) / 0.21);
    haloA = haloA * haloA;
    float causticA = (coreA * 0.75 + haloA * 0.25) * breakA;

    // Layer B: livello |f| = 0.5 — eco coordinato
    float fB    = abs(f) - 0.50;
    float coreB = max(0.0, 1.0 - abs(fB) / 0.09);
    coreB = coreB * coreB * coreB;
    float haloB = max(0.0, 1.0 - abs(fB) / 0.21);
    haloB = haloB * haloB;
    float causticB = (coreB * 0.60 + haloB * 0.20) * breakB;

    // ── Ombre — inverse di max(A,B), sfumate a bassa frequenza ───
    vec2  uvS  = uv * 0.14 + vec2(2.3, 1.1);
    float sf   = field(uvS, t * 0.50);
    float both = max(causticA, causticB);
    float dark = (1.0 - both) * clamp(0.30 + 0.70 * sf, 0.0, 1.0) * 0.80;

    // ── Maschera locale — bianco solo al centro (dietro i modelli 3D)
    // I modelli sono centrati nel viewport; la maschera è un cerchio morbido
    // che sbiadisce verso i bordi dove il rosa rimane pieno.
    vec2 uvC = vUv - vec2(0.50, 0.50);
    uvC.x   *= u_res.x / u_res.y;           // corregge aspect ratio
    float modelDist = length(uvC);
    float modelMask = 1.0 - smoothstep(0.18, 0.52, modelDist);
    float localWhite = u_white * modelMask;  // bianco solo dove ci sono i modelli

    // ── Colore — rosa ovunque, bianco solo nella zona modelli ────
    vec3 base_pink  = vec3(0.960, 0.780, 0.840);
    vec3 base_white = vec3(0.990, 0.985, 0.988);
    vec3 base       = mix(base_pink, base_white, localWhite);

    vec3 lineA_pink  = vec3(1.000, 0.920, 0.950);
    vec3 lineA_white = vec3(1.000, 0.998, 0.999);
    vec3 lineA       = mix(lineA_pink, lineA_white, localWhite);

    vec3 lineB_pink  = vec3(0.980, 0.880, 0.920);
    vec3 lineB_white = vec3(0.998, 0.994, 0.996);
    vec3 lineB       = mix(lineB_pink, lineB_white, localWhite);

    vec3 shad_pink  = vec3(0.600, 0.400, 0.500);
    vec3 shad_white = vec3(0.860, 0.845, 0.852);
    vec3 shadow_col = mix(shad_pink, shad_white, localWhite);

    vec3 col = mix(base, shadow_col, dark * 0.7);
    col = mix(col, lineA, causticA * 0.70);
    col = mix(col, lineB, causticB * 0.50);

    gl_FragColor = vec4(col, u_fade);
  }
`

// ─── Il fondale del mondo (WorldBackdrop) ─────────────────────────────────────
// lo shader della piscina diventa una funzione; le uv riproducono la scala che
// aveva sul piano 16 × 10 a 7,5 di distanza (fov 35) nella scena del logo
// la scala segue lo schermo come faceva la scena del logo (ResponsiveCamera): sotto
// il 16:9 la camera allargava l'inquadratura e il disegno dell'acqua si faceva piu' fitto
export const worldCommon = causticsFragment
  .replace(/varying vec2\s+vUv;/, '')
  .replace('void main() {', 'vec4 causticsColor(vec2 vUv) {')
  .replace('gl_FragColor = vec4(col, u_fade);', 'return vec4(col, u_fade);') + /* glsl */`
  vec3 srgbToLinearBg(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
  }
  uniform float u_scroll;
  uniform vec2 u_scale;
  // 1 in cima alla pagina: la parete chiara e neutra dello studio; 0 piu' giu': la piscina rosa
  uniform float u_neutral;
  // il logo sullo schermo: centro (uv), larghezza (in altezze di schermo), quanta luce
  uniform vec4 u_logo;

  float hzHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float hzNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hzHash(i), hzHash(i + vec2(1.0, 0.0)), f.x),
               mix(hzHash(i + vec2(0.0, 1.0)), hzHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float hzFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * hzNoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return s;
  }
  // la luce che scende dall'alto sul logo e il vapore che la rende spessa:
  // x = quanta luce (fascio e aria accesa), y = quanta penombra intorno al fascio.
  // Coordinate in larghezze del logo, centro del logo in (0, 0), y in su.
  vec2 haze(vec2 uv) {
    if (u_logo.w <= 0.0) return vec2(0.0);
    vec2 p = (uv - u_logo.xy) * vec2(u_res.x / max(1.0, u_res.y), 1.0) / max(u_logo.z, 1e-3);
    // lontano dal logo (oltre 13 larghezze) luce e penombra sono sotto l'1%: non si
    // calcolano. Scendendo nella pagina il logo esce dallo schermo e qui si salta tutto
    float r2 = dot(p, p);
    if (r2 > 170.0) return vec2(0.0);
    float t = u_time;
    // il fascio: stretto in alto, si apre scendendo e si posa sul logo; dietro al
    // logo si spegne, cosi' attraverso il vetro si vede il rosa e il vetro si legge
    float w = 0.22 + 0.3 * clamp(1.8 - p.y, 0.0, 3.0);
    float beam = 1.0 - smoothstep(w * 0.35, w, abs(p.x + 0.05 * p.y));
    beam *= smoothstep(0.0, 0.7, p.y) * (1.0 - 0.5 * smoothstep(1.4, 3.0, p.y));
    // l'aria accesa intorno al logo
    float glow = exp(-dot(p * vec2(0.85, 1.3), p * vec2(0.85, 1.3)) * 1.5);
    // vapore: sale piano e si sfilaccia. Serve solo dove c'e' luce da far vibrare
    float v = 0.12;
    if (beam + glow > 0.002) {
      v = hzFbm(p * vec2(1.6, 1.0) + vec2(0.1 * t, -0.14 * t));
      v = 0.12 + 0.88 * smoothstep(0.28, 0.8, v);
    }
    float luce = (beam * (0.45 + 0.85 * v) + glow * 0.28 * (0.4 + 0.6 * v)) * u_logo.w;
    // fuori dal fascio la stanza e' in penombra: e' il buio che fa vedere la luce
    // (solo intorno al logo: lontano, sul banco, il fondale resta quello di sempre)
    float ombra = (1.0 - beam) * (1.0 - glow) * (1.0 - exp(-r2 * 0.05)) * exp(-r2 * 0.03) * 0.8 * u_logo.w;
    return vec2(luce, ombra);
  }
  float hazeLight(vec2 uv) { return haze(uv).x; }
  vec3 hazedBy(vec3 c, vec2 h) {
    c *= 1.0 - h.y;
    return 1.0 - (1.0 - c) * (1.0 - h.x * vec3(1.0, 0.95, 0.93));
  }
  vec3 water(vec2 uv) {
    return srgbToLinearBg(causticsColor(0.5 + (uv - 0.5) * u_scale + vec2(0.0, u_scroll)).rgb);
  }
  // Le onde di luce: lo stesso disegno e lo stesso moto dell'acqua (field), ma senza le
  // zone spente che la piscina ha di proposito. Servono al vetro del logo e alla luce
  // dietro: devono attraversare tutto il logo, non solo una parte. 0 = niente, 1 = filo pieno
  float lightWaves(vec2 uv) {
    float t = u_time * 0.22;
    vec2 q = uv * vec2(u_res.x / max(1.0, u_res.y), 1.0) * 14.0;
    vec2 flow = vec2(field(q * 0.18, t * 0.18), field(q * 0.18 + vec2(3.9, 2.2), t * 0.18)) * 1.4;
    float f = field(q + flow, t);
    float a = max(0.0, 1.0 - abs(f) / 0.12);
    float b = max(0.0, 1.0 - abs(abs(f) - 0.5) / 0.1);
    return clamp(a * a * a + 0.55 * b * b * b, 0.0, 1.0);
  }
  // La parete dello studio, in cima: chiara e neutra, appena piu' scura in basso
  // (valori di luce, non colori: la correzione del composer, ACES, li porta a un bianco
  // caldo). Sopra cade la luce passata nel vetro del logo, come quella di una lastra
  // colorata sul muro: una pozza corallo morbida, senza contorni, proprio dietro il
  // logo (appena in basso a destra), con dentro le increspature dell'acqua che si
  // muovono. Si vede intorno alle lettere e, piegata, attraverso il vetro
  // crisp (0..1): visto attraverso il vetro del logo i fili delle increspature sono piu'
  // netti e meno accesi; il fondale vero li tiene morbidi (crisp 0)
  vec3 studioWall(vec2 uv, float crisp) {
    vec3 wall = mix(vec3(1.05, 1.02, 1.0), vec3(1.4, 1.37, 1.33), smoothstep(0.0, 1.0, uv.y));
    if (u_logo.z <= 0.0) return wall;
    vec2 p = (uv - u_logo.xy) * vec2(u_res.x / max(1.0, u_res.y), 1.0) / max(u_logo.z, 1e-3);
    // coordinate in larghezze del logo, centro del logo in (0, 0), y in su
    vec2 e = (p - vec2(0.12, -0.08)) / vec2(0.95, 0.5);
    float pool = exp(-dot(e, e) * 1.2);
    if (pool < 0.003) return wall;
    float ripple = lightWaves(uv * 0.92 + 0.04);
    ripple = mix(ripple, smoothstep(0.3, 0.8, ripple), crisp);
    // la luce colorata tinge il muro; le increspature la raccolgono in fili piu' chiari
    // (colori pieni e profondi: sulle tinte chiare ACES desatura, e il corallo diventava pesca)
    vec3 light = mix(vec3(0.95, 0.36, 0.28), mix(vec3(1.35, 0.72, 0.55), vec3(1.15, 0.62, 0.49), crisp), ripple);
    // attraverso il vetro (crisp) la pozza resta solo un riflesso: il vetro e' cavo, deve
    // vedersi la parete che c'e' intorno, appena tinta; una pozza piena lo faceva sembrare pieno
    return mix(wall, light, pool * 0.72 * (1.0 - 0.85 * crisp));
  }
  vec3 studioWall(vec2 uv) { return studioWall(uv, 0.0); }
  vec3 backdrop(vec2 uv) {
    vec3 pink = hazedBy(water(uv), haze(uv));
    if (u_neutral <= 0.001) return pink;
    return mix(pink, studioWall(uv), u_neutral);
  }
`

/**
 * La correzione colore del composer, a mano: ACES (ToneMapping) e poi la vignettatura
 * (Vignette, offset 0.25 e darkness 0.55 come in Table3D). Vedi WorldBackdrop.
 */
export const pvPars = /* glsl */`
  const mat3 PV_IN = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 PV_OUT = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  const mat3 PV_IN_INV = mat3(vec3(1.764741, -0.147028, -0.036337), vec3(-0.675778, 1.160252, -0.162436), vec3(-0.088963, -0.013224, 1.198773));
  const mat3 PV_OUT_INV = mat3(vec3(0.643038, 0.059269, 0.005962), vec3(0.311187, 0.931436, 0.063929), vec3(0.045775, 0.009295, 0.930118));
  vec3 pvToSrgb(vec3 c) {
    c = clamp(c, 0.0, 1.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }
  vec3 pvAces(vec3 c) {
    c = PV_IN * (c / 0.6);
    c = (c * (c + 0.0245786) - 0.000090537) / (c * (0.983729 * c + 0.4329510) + 0.238081);
    return clamp(PV_OUT * c, 0.0, 1.0);
  }
  vec3 pvAcesInv(vec3 y) {
    vec3 v = clamp(PV_OUT_INV * clamp(y, 0.0, 0.985), 0.0, 0.99);
    vec3 A = 1.0 - 0.983729 * v, B = 0.0245786 - 0.4329510 * v, C = -0.000090537 - 0.238081 * v;
    vec3 x = (-B + sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
    return PV_IN_INV * x * 0.6;
  }
  float pvVignette(vec2 uv) {
    return smoothstep(0.8, 0.25 * 0.799, distance(uv, vec2(0.5)) * (0.55 + 0.25));
  }
`

/** I valori dell'acqua, gli stessi per il canvas dell'acqua e per il vetro del logo.
 *  Nella home il tempo, lo scroll e la scala li scrive WaterCanvas; il logo (u_logo) LogoModel */
export function createWaterUniforms() {
  return {
    u_time: new THREE.Uniform(0),
    u_fade: new THREE.Uniform(1),
    u_white: new THREE.Uniform(0),
    u_res: new THREE.Uniform(new THREE.Vector2(1, 1)),
    u_scroll: new THREE.Uniform(0),
    u_scale: new THREE.Uniform(new THREE.Vector2(1, 1)),
    u_logo: new THREE.Uniform(new THREE.Vector4(0.5, 0.5, 0.3, 0)),   // lo aggiorna LogoModel
    u_neutral: new THREE.Uniform(1),   // la parete neutra in cima: lo scrive WaterCanvas
  }
}

/** Quanto si vede la parete neutra dello studio: tutta in cima, sfuma nella piscina rosa scendendo verso il banco */
export function neutralAt(scrollY, h) {
  return 1 - THREE.MathUtils.smoothstep(scrollY / Math.max(1, h), 0.55, 1.25)
}


/** La scala della scena del logo di una volta: piano 16 × 10 a 7,5 di distanza, fov 35 (piu' largo sotto il 16:9) */
export function waterScale(w, h, out) {
  const a = w / Math.max(1, h)
  const ref = 16 / 9, base = THREE.MathUtils.degToRad(35)
  let fov = base
  if (a < ref) {
    const hFov = 2 * Math.atan(Math.tan(base / 2) * ref)
    fov = Math.min(2 * Math.atan(Math.tan(hFov / 2) / a), THREE.MathUtils.degToRad(65))
  }
  const visH = 2 * 7.5 * Math.tan(fov / 2)
  return out.set(visH * a / 16, visH / 10)
}


/** L'acqua da sola, per il suo canvas (WaterCanvas): lo stesso disegno che il vetro del logo vede attraverso */
export const waterFragment = 'precision highp float;\n' + worldCommon + pvPars + /* glsl */`
  uniform vec2 u_px;
  void main() {
    // come usciva dal composer: ACES, vignettatura, sRGB
    vec2 uv = gl_FragCoord.xy / u_px;
    gl_FragColor = vec4(pvToSrgb(pvAces(backdrop(uv)) * pvVignette(uv)), 1.0);
  }
` 

/**
 * Il vetro del logo, nel mondo: si fonde da solo con il rosa che c'e' in quel
 * punto dello schermo. Prima la correzione colore (ACES) sul vetro, poi la
 * fusione, e infine l'inversa della correzione, che il composer riapplica.
 */
export const glassPars = worldCommon + /* glsl */`
  uniform vec2 u_px;
  // il fondo visto attraverso il vetro in un punto: in cima soprattutto la parete
  vec3 glassSeen(vec2 uv, vec2 hz) {
    vec3 s = hazedBy(water(uv), hz);
    // la parete vera (con la luce corallo), come il fondale: dentro il vetro deve vedersi
    // quello che c'e' intorno, piegato. Se dentro e' diverso l'occhio lo legge come materiale pieno
    if (u_neutral > 0.001) s = mix(s, studioWall(uv, 1.0), u_neutral);
    return s;
  }
` + pvPars

/** Va in fondo al fragment del vetro (dopo dithering_fragment). Chi lo usa dichiara
 *  prima vec2 glassShift (di quanto si sposta il fondale visto attraverso: rifrazione)
 *  e vec3 glassTint (come il vetro colorato filtra il fondale), float glassGlint (riflessi nitidi)
 *  e vec3 glassSheen (i riflessi colorati del fronte lucidato) */
export const glassComposite = /* glsl */`
  {
    // come sulla tela di una volta: fusione sui colori gia' pronti per lo schermo (sRGB)
    // il vapore una volta sola, nel punto del vetro: serve al fondo visto attraverso
    // (spostato di poco dalla rifrazione) e al velo davanti
    vec2 hz = haze(gl_FragCoord.xy / u_px);
    // in cima, sulla parete neutra, attraverso il vetro si vede soprattutto la parete:
    // il vetro e' trasparente, tinto di rosa, e l'acqua resta un velo che si muove dentro.
    // Dove la rifrazione e' forte (i fianchi tondi) i tre colori si piegano di poco
    // diverso: la dispersione di un prisma, l'orlo iridato del vetro vero
    vec2 baseUv = gl_FragCoord.xy / u_px;
    // il retro e' satinato: quello che si vede attraverso arriva morbido, quattro letture
    // intorno al punto (in larghezze dello schermo, ~0.4%), con i colori appena separati
    // dalla rifrazione (la dispersione di un prisma) dove il vetro piega di piu'
    vec2 fr = vec2(0.004, 0.004 * u_px.x / max(u_px.y, 1.0));
    vec3 s0 = glassSeen(baseUv + glassShift * 1.12 + fr * vec2(-0.7, -0.3), hz);
    vec3 s1 = glassSeen(baseUv + glassShift * 1.04 + fr * vec2(0.3, -0.7), hz);
    vec3 s2 = glassSeen(baseUv + glassShift * 0.96 + fr * vec2(0.7, 0.3), hz);
    vec3 s3 = glassSeen(baseUv + glassShift * 0.88 + fr * vec2(-0.3, 0.7), hz);
    vec3 seen = vec3(s0.r * 0.6 + s1.r * 0.4, (s1.g + s2.g) * 0.5, s2.b * 0.4 + s3.b * 0.6);
    seen = mix((s0 + s1 + s2 + s3) * 0.25, seen, clamp(length(glassShift) * 60.0, 0.0, 1.0));
    vec3 bgc = pvToSrgb(seen) * glassTint;
    vec3 g = pvToSrgb(pvAces(gl_FragColor.rgb));
    // sulla tela di una volta si vedevano anche i fianchi delle lettere dietro al fronte:
    // due strati di vetro, piu' bianchi di uno
    float a2 = 1.0 - (1.0 - gl_FragColor.a) * (1.0 - gl_FragColor.a);
    vec3 c = mix(bgc, g, a2);
    // un velo del vapore passa anche davanti al vetro: l'aria e' spessa
    c = 1.0 - (1.0 - c) * (1.0 - hz.x * 0.28);
    // i riflessi nitidi sopra a tutto
    c = 1.0 - (1.0 - c) * (1.0 - clamp(glassGlint, 0.0, 1.0));
    // e la lucidatura del fronte (glassSheen): riflessi colorati, sopra al satinato di dietro
    c = 1.0 - (1.0 - c) * (1.0 - clamp(glassSheen, 0.0, 1.0));
    gl_FragColor = vec4(pvAcesInv(srgbToLinearBg(c)), 1.0);
  }
`

// ─── Il vetro del logo nel mondo (LogoModel, inWorld) ─────────────────────────

/** I parametri del materiale del logo nel mondo (MeshPhysicalMaterial) */
export const worldGlassParams = {
    color: '#eef5ff',
    emissive: '#c8e8ff',
    // nel mondo poco bagliore proprio: il vetro e' limpido, non latteo
    emissiveIntensity: 0.08,
    roughness: 0.0,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    envMapIntensity: 5.5,
    iridescence: 0,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [180, 520],
}

/** Vetro cavo: il fronte e' limpido (~0.03) e la densita' sale solo vicino al taglio */
export const worldGlassAlpha = 'diffuseColor.a *= mix(0.03, 0.5, pow(fresnel, 2.6));'

// vetro chiaro, quasi liquido: il fondale si piega appena nei fianchi tondi,
// come attraverso l'acqua
const liquid = /* glsl */`
                    vec2 glassShift = vec2(0.0);
                    vec3 glassTint = vec3(1.0);
                    float glassGlint = 0.0;
                    vec3 glassSheen = vec3(0.0);
                    {
                        vec3 n = normalize(vNormal);
                        float nv = abs(dot(n, normalize(vViewPosition)));
                        // Vetro cavo, soffiato: una pelle sottile intorno al vuoto. Attraverso il
                        // fronte il fondo passa quasi pulito; il vetro si vede solo dove la pelle
                        // e' presa di taglio: un orlo stretto e carico sul contorno e, piu' dentro
                        // e piu' tenue, la linea della parete di dietro. E' l'orlo sottile a dire
                        // "cavo": la fascia larga e colorata di prima lo faceva sembrare pieno
                        float side = smoothstep(0.42, 0.06, nv);
                        float back = exp(-pow((nv - 0.5) / 0.07, 2.0));
                        // rifrazione: forte solo dove la pelle e' di taglio (il fondo si piega
                        // lungo i contorni), appena accennata sul fronte
                        glassShift = -n.xy * (pow(1.0 - nv, 2.2) * 0.11 + 0.003);
                        // sul fronte il fondo passa com'e' intorno (la pagina lo vede un po' piu' scuro
                        // della parete calcolata qui), appena velato di rosa
                        glassTint = mix(vec3(0.93, 0.885, 0.875), vec3(1.05, 0.58, 0.49), side);
                        glassTint *= 1.0 - 0.1 * back;
                        // la profondita': una sfumatura rosa che sta DENTRO il vetro, sotto uno
                        // strato limpido. La sua forma e' la mappa di
                        // logo-ripieno.png (quanto il punto e' dentro il logo), letta piu' in
                        // profondita' lungo lo sguardo: girando il logo la sfumatura scorre sotto la
                        // superficie (parallasse) e tra i due si vede il trasparente
                        vec3 dp1 = dFdx(-vViewPosition), dp2 = dFdy(-vViewPosition);
                        vec2 du1 = dFdx(vRip), du2 = dFdy(vRip);
                        vec3 e1 = normalize(dp1 - n * dot(dp1, n) + 1e-6), e2 = cross(n, e1);
                        // dal piano della superficie (vista) alla mappa; asse y in larghezze del logo
                        vec2 asp = vec2(1.0, u_ripAspect);
                        mat2 J = mat2(du1 * asp, du2 * asp) * inverse(mat2(dot(dp1, e1), dot(dp1, e2), dot(dp2, e1), dot(dp2, e2)));
                        float perView = sqrt(abs(determinant(J)));   // larghezze del logo per unita' di vista
                        vec3 into = normalize(vViewPosition);         // verso la camera
                        vec3 o = -into / max(dot(into, n), 0.25);     // dentro il vetro, di 1 in profondita'
                        vec2 o2 = vec2(dot(o, e1), dot(o, e2));
                        // tre letture a profondita' crescenti, mediate: una sfumatura sola, morbida
                        float rip = 0.0;
                        for (int i = 0; i < 3; i++) {
                            float dz = 0.03 + 0.02 * float(i);        // profondita', in larghezze del logo
                            vec2 duv = J * o2 * (dz / max(perView, 1e-6)) / asp;
                            rip += texture2D(u_ripieno, vRip + duv).r;
                        }
                        // lieve, rosa magenta, piu' carica verso il centro: non si vede come
                        // colore, fa sentire quanto il vetro e' profondo
                        float core = smoothstep(0.0, 0.85, rip / 3.0) * (1.0 - 0.6 * side);
                        glassTint = mix(glassTint, vec3(0.96, 0.7, 0.86), 0.32 * core);
                        // le linee dell'acqua viste attraverso: fili netti e poco accesi
                        glassTint *= 1.0 + 0.1 * smoothstep(0.3, 0.8, lightWaves(gl_FragCoord.xy / u_px + glassShift));
                        // riflessi piccoli e nitidi, come in un render: due luci da studio che si
                        // specchiano nella superficie tonda. Sono loro a dire "vetro", non i bordi bianchi
                        vec3 vdir = normalize(-vViewPosition);
                        vec3 rf = reflect(-vdir, n);
                        glassGlint = pow(max(dot(rf, normalize(vec3(-0.45, 0.8, 0.4))), 0.0), 160.0) * 0.9
                                   + pow(max(dot(rf, normalize(vec3(0.7, 0.35, 0.6))), 0.0), 420.0) * 0.55;
                        // il fronte e' plexiglass tagliato a laser e lucidato: riflessi netti e
                        // colorati che stanno sopra (glassSheen), mentre quello che si vede
                        // attraverso (l'interno, il retro) e' satinato, morbido (glassComposite).
                        // Chiazze appena piu' vive, perche' la lucidatura non e' mai uniforme
                        float wet = smoothstep(0.02, 0.4, field(vObjPos.xy / 55.0, 0.0)
                                  + 0.35 * field(vObjPos.xy / 17.0 + 3.1, 0.0));
                        float front = smoothstep(0.55, 0.92, nv);
                        glassGlint *= mix(0.75, 1.15, wet);
                        // il softbox dello studio specchiato nel fronte: una lama netta, fredda,
                        // con l'orlo appena iridato, e un alone caldo intorno
                        float win = dot(rf, normalize(vec3(-0.25, 0.35, 0.9)));
                        float lama = smoothstep(0.9, 0.93, win) * (1.0 - smoothstep(0.975, 0.99, win));
                        glassSheen = (vec3(0.82, 0.9, 1.0) * lama * 0.34
                                   + vec3(1.0, 0.8, 0.85) * pow(max(win, 0.0), 30.0) * 0.12) * front;
                        // l'orlo tagliato e lucidato: dove la superficie gira, un filo di luce che
                        // cambia colore come il taglio del plexi (dispersione)
                        float taglio = smoothstep(0.42, 0.24, nv) * smoothstep(0.06, 0.2, nv);
                        vec3 iride = 0.5 + 0.5 * cos(6.2832 * (n.x * 0.6 + n.y * 0.4 + vec3(0.0, 0.33, 0.67)));
                        glassSheen += mix(vec3(1.0), iride, 0.55) * taglio * 0.16;
                        // le bilie (uv -1, fuori dalla mappa) sono vetro come il resto, ma una sfera
                        // non ha i fianchi del logo che di sbieco fanno il contorno scuro: glielo da'
                        // un orlo corallo piu' largo, cosi' staccano come le lettere
                        if (vRip.x < -0.5) {
                            // piu' pieno in basso, dove nelle lettere si vede il fianco
                            float giu = 0.55 + 0.45 * smoothstep(-0.3, 0.7, -n.y);
                            glassTint = mix(glassTint, vec3(0.74, 0.42, 0.38), smoothstep(0.8, 0.3, nv) * giu);
                        }
                        // i riflessi dello studio sui fianchi bruciavano in bianco: si smorzano
                        gl_FragColor.rgb /= 1.0 + gl_FragColor.rgb * side * 4.0;
                    }
                `

// il vetro qui e' opaco (si fonde da se' con il fondo): per farlo sparire mentre
// arriva il logo del biglietto AR sfuma nel fondo che ha dietro, non piegato
const arFade = /* glsl */`
                    if (u_arHold < 0.999) {
                        vec2 suv = gl_FragCoord.xy / u_px;
                        vec3 fondo = pvAcesInv(srgbToLinearBg(pvToSrgb(glassSeen(suv, haze(suv)))));
                        gl_FragColor.rgb = mix(fondo, gl_FragColor.rgb, u_arHold);
                    }
                `

/**
 * Il vetro del logo nel mondo, dentro onBeforeCompile di un MeshPhysicalMaterial.
 * uniforms: quelli dell'acqua piu' u_px (glassUniforms nella home);
 * ripieno: la mappa logo-ripieno.png (quanto ogni punto e' dentro il logo),
 * letta con il primo uv della mesh (le bilie hanno uv -1: fuori dalla mappa);
 * arHold: { value } 1 a riposo, 0 mentre il logo del biglietto AR vola sopra.
 * Il Fresnel sull'alpha (worldGlassAlpha) lo aggiunge chi chiama.
 */
export function applyWorldGlass(shader, { uniforms, ripieno, arHold }) {
    Object.assign(shader.uniforms, uniforms)
    // la posizione sul logo: le chiazze bagnate restano ferme sul vetro
    // e il punto nell'ingombro del logo (primo uv di logo.glb), per la mappa del ripieno
    shader.vertexShader = 'varying vec3 vObjPos;\nvarying vec2 vRip;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvObjPos = position;\nvRip = uv;',
    )
    shader.uniforms.u_ripieno = { value: ripieno }
    const im = ripieno.image
    shader.uniforms.u_ripAspect = { value: im ? im.height / im.width : 0.6 }
    shader.uniforms.u_arHold = arHold
    shader.fragmentShader = 'varying vec3 vObjPos;\nvarying vec2 vRip;\nuniform sampler2D u_ripieno;\nuniform float u_ripAspect;\nuniform float u_arHold;\n' + glassPars + shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\n' + liquid + glassComposite + arFade,
    )
}
