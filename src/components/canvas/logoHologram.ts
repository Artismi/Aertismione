import * as THREE from 'three'

/**
 * Il materiale "ologramma" del logo: vetro ghiaccio con Fresnel sull'alpha e
 * contorno satinato. Lo usano il logo della home (LogoModel) e la pagina /ar,
 * cosi' il logo e' lo stesso dovunque compaia.
 */

/**
 * edgeAlpha: opacita' dello spessore (le pareti viste di taglio).
 * faceAlpha: opacita' del fronte.
 * In home 0.18 e 0.92: sul fondo rosa il vetro sottile e' quello che si vuole.
 * Sulla fotocamera, con un fondo scuro, lo spessore trasparente diventa grigio.
 */
export function createLogoGlass({ edgeAlpha = 0.18, faceAlpha = 0.92 } = {}) {
    const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#eef5ff'),
        emissive: new THREE.Color('#c8e8ff'),
        emissiveIntensity: 0.32,
        roughness: 0.0,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        envMapIntensity: 5.5,
        transparent: true,
        opacity: 1.0,   // controllata dal Fresnel nel shader
        depthWrite: true,
        side: THREE.FrontSide,
    })

    // Fresnel sull'alpha: fronte quasi trasparente, bordi opachi come cristallo.
    // NdotV ≈ 1 (fronte) → alpha bassa; NdotV ≈ 0 (bordi) → alpha alta.
    mat.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <alphamap_fragment>',
            `#include <alphamap_fragment>
            float NdotV = abs(dot(normalize(vNormal), normalize(vViewPosition)));
            float fresnel = 1.0 - NdotV;
            // fronte: faceAlpha opaco + riflettente | bordi: edgeAlpha
            diffuseColor.a *= ${edgeAlpha.toFixed(3)} + NdotV * NdotV * NdotV * ${(faceAlpha - edgeAlpha).toFixed(3)};`
        )
    }
    // Il testo di onBeforeCompile e' uguale per ogni opacita': senza chiave three
    // riuserebbe lo shader compilato con i valori di un altro vetro.
    mat.customProgramCacheKey = () => `logo-glass-${edgeAlpha}-${faceAlpha}`

    return mat
}

// Outline vetro satinato: noise lungo la linea simula la micro-tessitura
// del bordo molato. L'ombra interna del vetro non è mai uniforme.
export function createLogoEdges() {
    return new THREE.ShaderMaterial({
        uniforms: { u_opacity: { value: 0.14 } },
        vertexShader: /* glsl */`
            varying vec3 vPos;
            void main() {
                vPos = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform float u_opacity;
            varying vec3 vPos;

            // Hash pseudo-casuale per noise
            float hash(vec3 p) {
                p = fract(p * 0.3183099 + 0.1);
                p *= 17.0;
                return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }

            void main() {
                // Noise ad alta frequenza sulla posizione 3D del bordo
                float n = hash(vPos * 18.0);
                // Modulazione: alcuni punti più scuri, altri quasi invisibili
                float alpha = u_opacity * (0.55 + 0.45 * n);
                // Colore: indaco scuro con variazione fredda/calda dal noise
                vec3 col = mix(vec3(0.08, 0.07, 0.18), vec3(0.18, 0.16, 0.30), n);
                gl_FragColor = vec4(col, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: true,
    })
}

/** Veste ogni mesh della scena col vetro e le aggiunge il contorno. Restituisce la pulizia. */
export function applyLogoHologram(scene: THREE.Object3D, glass: THREE.Material, edges: THREE.Material) {
    const added: THREE.LineSegments[] = []

    scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.material = glass
            mesh.renderOrder = 1

            const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 15), edges)
            lines.renderOrder = 2
            mesh.add(lines)
            added.push(lines)
        }
    })

    return () => added.forEach((l) => l.parent?.remove(l))
}
