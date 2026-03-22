// --- VERTEX SHADER ---
export const industrialVertexShader = `
  uniform float uTime;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPos;

  #include <common>
  #ifdef USE_SKINNING
    #include <skinning_pars_vertex>
  #endif

  void main() {
    vUv = uv;
    vec3 objectNormal = vec3( normal );
    vec3 transformed = vec3( position );

    // Respiro leggerissimo
    float breath = sin(uTime * 0.5) * 0.002;
    transformed += objectNormal * breath;

    #ifdef USE_SKINNING
      #include <skinning_vertex>
    #endif

    vNormal = normalize(normalMatrix * objectNormal);
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    vViewPosition = -mvPosition.xyz;
    vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// --- FRAGMENT SHADER ---
export const industrialFragmentShader = `
  uniform float uTime;
  uniform float uPulse; 

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPos;

  float hash(vec3 p) {
    p  = fract( p*0.3183099 + .1 );
    p *= 17.0;
    return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
  }

  vec3 rotateCoords(vec3 p) {
      float angle = 0.5; 
      float s = sin(angle);
      float c = cos(angle);
      mat3 rot = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
      return rot * p;
  }

  // Calcola luce sfera
  float getSphereLight(vec3 localPos, vec3 baseNormal, vec3 lightDir, float radius) {
      float dist = length(localPos);
      float z = sqrt(max(0.0, radius*radius - dist*dist));
      vec3 sphereNormal = normalize(vec3(localPos.xy, z));
      vec3 finalNormal = normalize(baseNormal * 0.6 + sphereNormal * 0.4);
      return max(0.0, dot(finalNormal, lightDir));
  }

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 baseNormal = normalize(vNormal); 
    vec3 lightDir = normalize(vec3(-0.5, 0.6, 1.0)); // Luce ottimizzata per i dettagli

    // --- SETUP SPAZIO ---
    vec3 rotatedPos = rotateCoords(vWorldPos);
    float gridScale = 2500.0; // Alta densità
    vec3 pos = rotatedPos * gridScale;

    // --- GRIGLIA A (Principale) ---
    vec3 cellA = floor(pos);
    vec3 localA = fract(pos) - 0.5;
    float rndA = hash(cellA);
    localA -= (vec3(rndA, fract(rndA * 10.0), fract(rndA * 55.0)) - 0.5) * 0.5;
    float radiusA = 0.40;
    float distA = length(localA);

    // --- GRIGLIA B (Riempimento) ---
    vec3 posB = pos + vec3(0.5); 
    vec3 cellB = floor(posB);
    vec3 localB = fract(posB) - 0.5;
    float rndB = hash(cellB + vec3(100.0)); 
    localB -= (vec3(rndB, fract(rndB * 23.0), fract(rndB * 11.0)) - 0.5) * 0.6;
    float radiusB = 0.35;
    float distB = length(localB);

    // --- 3° LIVELLO: ATMOSFERA / SFOCATURA ---
    // Invece di scartare subito i pixel vuoti, calcoliamo quanto siamo vicini a un punto.
    // Questo crea un "campo di energia" continuo che lega tutto insieme.
    float glowA = exp(-distA * 3.5); // Alone morbido attorno ai punti A
    float glowB = exp(-distB * 3.5); // Alone morbido attorno ai punti B
    float atmosphere = max(glowA, glowB); // Uniamo i campi

    // Taglio morbido (non netto):
    // Se l'atmosfera è troppo debole, scartiamo per mantenere la trasparenza di fondo.
    // Ma la soglia è bassa (0.1), quindi rimane un alone visibile.
    if (atmosphere < 0.1) discard;


    // --- CALCOLO MASCHERE PUNTI SOLIDI ---
    float solidA = 1.0 - smoothstep(radiusA - 0.05, radiusA + 0.05, distA);
    float solidB = 1.0 - smoothstep(radiusB - 0.05, radiusB + 0.05, distB);


    // --- COLORI ---
    vec3 colDeep    = vec3(0.18, 0.02, 0.28); // Viola Profondo
    vec3 colStruct  = vec3(0.55, 0.15, 0.75); // Viola Struttura
    vec3 colFill    = vec3(1.00, 0.75, 0.90); // Rosa Chiaro (Glow/Filler)
    vec3 colHigh    = vec3(1.00, 0.95, 1.00); // Bianco Dettagli

    vec3 finalColor = vec3(0.0);
    float finalAlpha = 0.0;

    // --- ILLUMINAZIONE MACRO (Per i dettagli del vestito) ---
    // Calcoliamo la luce sulla geometria originale.
    // Questo serve a disegnare le pieghe anche nella "nebbia".
    float macroLight = max(0.0, dot(baseNormal, lightDir));
    float rimLight = pow(1.0 - max(0.0, dot(baseNormal, viewDir)), 3.0); // Silhouette
    
    // --- DISEGNO ATMOSFERA (Il livello sfocato di fondo) ---
    // Colore base dell'alone: Viola scuro nelle ombre, Rosa chiaro nella luce/bordi
    vec3 fogColor = mix(colDeep, colFill, macroLight * 0.5 + rimLight * 0.5);
    
    // Intensità atmosfera: Più forte vicino ai punti, più debole lontano
    finalColor = fogColor;
    finalAlpha = 0.3 * atmosphere; // Semitrasparenza diffusa


    // --- SOVRAPPOSIZIONE PUNTI SOLIDI ---
    
    // LAYER B (Dietro)
    if (solidB > 0.01) {
        float lightB = getSphereLight(localB, baseNormal, lightDir, radiusB);
        vec3 pointColB = mix(colDeep, colFill, lightB);
        // Mixiamo con l'atmosfera esistente
        finalColor = mix(finalColor, pointColB, solidB); 
        finalAlpha = max(finalAlpha, 0.7); // Più solido
    }

    // LAYER A (Davanti - Struttura Principale)
    if (solidA > 0.01) {
        float lightA = getSphereLight(localA, baseNormal, lightDir, radiusA);
        vec3 pointColA = mix(colDeep, colStruct, lightA);
        
        // Aggiungiamo dettagli speculari nitidi su A per definire le forme
        vec3 halfVec = normalize(lightDir + viewDir);
        float spec = pow(max(0.0, dot(normalize(baseNormal + vec3(localA.xy, 1.0)*0.5), halfVec)), 32.0);
        pointColA += colHigh * spec * 0.9;

        // Mix finale
        finalColor = mix(finalColor, pointColA, solidA);
        finalAlpha = 1.0; // Solido
    }

    // --- DETTAGLI FINALI (Definizione Linee) ---
    // Usiamo il 'macroLight' per accentuare il contrasto sulla nebbia
    // Questo "scolpisce" la giacca anche dove non ci sono punti.
    finalColor *= (0.6 + 0.4 * macroLight); 

    // Scanline Morbida
    float scanY = sin(uTime * 0.3) * 2.5;
    float scanBeam = smoothstep(0.2, 0.0, abs(vWorldPos.y - scanY));
    finalColor += colFill * scanBeam * 0.4;

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;
