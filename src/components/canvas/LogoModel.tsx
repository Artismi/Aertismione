import { useGLTF, useEnvironment, Center, Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../../stores/useStore'
import { glassUniforms, glassPars, glassComposite } from './table/WorldBackdrop'

/** Larghezza del logo nel mondo, a scala 1 (logo.glb: 343 × 0,139 × 0,06) */
const LOGO_W = 2.86
const _c = new THREE.Vector3(), _u = new THREE.Vector3()

// Invisible occluder material — blocks depth without painting pixels
const occluderMat = new THREE.MeshBasicMaterial({
    colorWrite: false,
    side: THREE.FrontSide,
})

/**
 * inWorld: il logo e' un oggetto del mondo della home (Table3D), sospeso in aria
 * sopra il banco. Li' non svanisce con lo scroll e non serve proteggere i testi:
 * e' la camera che si muove.
 */
export function LogoModel({ inWorld = false, ...props }: any) {
    const { scene } = useGLTF('/models/logo.glb')
    // la sua luce di studio, quella di sempre (il preset "studio" di drei, servito dal sito):
    // nel mondo del banco la luce e' piu' calda e il vetro diventava grigio
    const studio = useEnvironment({ files: '/models/studio_logo.hdr' })
    const rotatingRef = useRef<THREE.Group>(null)
    const groupRef = useRef<THREE.Group>(null)
    const timeRef = useRef(0)
    const edgeMatRef = useRef<THREE.ShaderMaterial | null>(null)


    const glassMaterial = useMemo(() => {
        const mat = new THREE.MeshPhysicalMaterial({
            // nel mondo poca luce diffusa: il plexiglass vive di riflessi, non e' bianco latte
            // nel mondo e' un plexiglass viola-magenta che vive di riflessi, non bianco latte
            color: new THREE.Color(inWorld ? '#8a2be2' : '#eef5ff'),
            emissive: new THREE.Color(inWorld ? '#c040ff' : '#c8e8ff'),
            emissiveIntensity: inWorld ? 0.28 : 0.32,
            roughness: 0.0,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            envMapIntensity: inWorld ? 3.2 : 5.5,
            // plexiglass: un velo di arcobaleno dove la luce lo prende di sbieco
            iridescence: inWorld ? 0.75 : 0.45,
            iridescenceIOR: 1.35,
            iridescenceThicknessRange: [250, 650],
            transparent: true,
            opacity: 1.0,   // controllata dal Fresnel nel shader
            depthWrite: true,
            side: THREE.FrontSide,
        })

        // Fresnel sull'alpha: fronte quasi trasparente, bordi opachi come cristallo.
        // NdotV ≈ 1 (fronte) → alpha bassa; NdotV ≈ 0 (bordi) → alpha alta.
        mat.onBeforeCompile = (shader) => {
            // Plexiglass bagnato sotto una luce dall'alto: il bordo tondo che guarda in su
            // prende la luce e si accende di bianco, quello che guarda in giu' resta in
            // ombra, scuro come lo spessore del plexiglass visto di taglio. E' questo
            // che da' volume al logo liscio. glassShift: quanto il fondale si piega
            // attraverso il vetro (rifrazione), forte sui bordi tondi, nulla sul fronte.
            const rim = /* glsl */`
                vec2 glassShift = vec2(0.0);
                {
                    vec3 n = normalize(vNormal);
                    float nv = abs(dot(n, normalize(vViewPosition)));
                    float edge = smoothstep(0.85, 0.15, nv);
                    float up = clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
                    // in ombra: viola vivo che scende quasi al nero verso il taglio
                    float ombra = edge * smoothstep(0.65, 0.1, up);
                    gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(vec3(0.42, 0.03, 0.75), vec3(0.05, 0.0, 0.1), edge), ombra * 0.9);
                    gl_FragColor.rgb += vec3(1.0, 0.82, 1.0) * pow(edge, 1.4) * smoothstep(0.5, 0.95, up) * 2.2;
                    gl_FragColor.a = mix(gl_FragColor.a, 1.0, edge * 0.85);
                    glassShift = -n.xy * (1.0 - nv) * 0.045;
                }
            `
            if (inWorld) {
                // nel mondo del banco: il vetro si fonde da solo con il rosa che ha dietro (vedi WorldBackdrop)
                Object.assign(shader.uniforms, glassUniforms)
                shader.fragmentShader = glassPars + shader.fragmentShader.replace(
                    '#include <dithering_fragment>',
                    '#include <dithering_fragment>\n' + rim + glassComposite,
                )
            } else {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <dithering_fragment>',
                    '#include <dithering_fragment>\n' + rim,
                )
            }
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <alphamap_fragment>',
                `#include <alphamap_fragment>
                float NdotV = abs(dot(normalize(vNormal), normalize(vViewPosition)));
                float fresnel = 1.0 - NdotV;
                // fronte: ~0.92 opaco + riflettente | bordi: ~0.18 sottili.
                // Nel mondo il fronte lascia vedere la luce e il vapore dietro; il bordo lo fa il contorno
                diffuseColor.a *= ${inWorld ? '0.42' : '0.18 + NdotV * NdotV * NdotV * 0.74'};`
            )
        }

        return mat
    }, [inWorld])

    useEffect(() => {
        glassMaterial.envMap = studio
        glassMaterial.needsUpdate = true
    }, [glassMaterial, studio])

    useEffect(() => {
        if (!scene) return

        // Outline vetro satinato: noise lungo la linea simula la micro-tessitura
        // del bordo molato. L'ombra interna del vetro non è mai uniforme.
        const edgeMat = new THREE.ShaderMaterial({
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
        edgeMatRef.current = edgeMat

        // Il contorno: il logo e' liscio e il bordo tondo diventa verticale solo
        // nell'ultimo pixel, quindi non basta scurire il vetro di taglio. Una copia
        // del logo vista da dietro, allargata di qualche pixel sullo schermo, fa da
        // filo sottile e leggero tutto intorno, come le linee degli spigoli di prima
        // (fuso con il fondale come il vetro).
        const outlineMat = inWorld ? new THREE.ShaderMaterial({
            uniforms: { ...glassUniforms, u_opacity: { value: 0.3 }, u_width: { value: 1.0 } },
            vertexShader: /* glsl */`
                uniform vec2 u_px;
                uniform float u_width;
                void main() {
                    vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    vec4 n = projectionMatrix * modelViewMatrix * vec4(position + normal * 0.01, 1.0);
                    vec2 d = n.xy / n.w - c.xy / c.w;
                    float l = length(d);
                    if (l > 1e-6) c.xy += d / l * u_width * 2.0 / u_px * c.w;
                    gl_Position = c;
                }
            `,
            fragmentShader: glassPars + /* glsl */`
                uniform float u_opacity;
                void main() {
                    vec2 glassShift = vec2(0.0);
                    gl_FragColor = vec4(0.16, 0.03, 0.24, u_opacity);
                    ${glassComposite}
                }
            `,
            side: THREE.BackSide,
        }) : null

        const added: THREE.Object3D[] = []

        // prima si raccolgono le mesh: il contorno e' a sua volta una mesh e il
        // traverse lo visiterebbe all'infinito
        const meshes: THREE.Mesh[] = []
        scene.traverse((child: any) => {
            if ((child as THREE.Mesh).isMesh && child.material !== outlineMat) meshes.push(child)
        })
        meshes.forEach((mesh) => {
            mesh.material = glassMaterial
            mesh.renderOrder = 1

            // Il logo e' liscio: solo le pieghe vere (le punte) fanno linea,
            // non gli anelli che costruiscono i bordi tondi.
            const edges = new THREE.EdgesGeometry(mesh.geometry, 50)
            const lines = new THREE.LineSegments(edges, edgeMat)
            lines.renderOrder = 2
            mesh.add(lines)
            added.push(lines)

            if (outlineMat) {
                const hull = new THREE.Mesh(mesh.geometry, outlineMat)
                hull.renderOrder = 0
                mesh.add(hull)
                added.push(hull)
            }
        })

        return () => {
            added.forEach(l => l.parent?.remove(l))
            outlineMat?.dispose()
            edgeMatRef.current = null
        }
    }, [scene, glassMaterial, inWorld])

    useFrame(({ camera }, delta) => {
        if (rotatingRef.current) {
            timeRef.current += delta * 0.4
            rotatingRef.current.rotation.y = Math.sin(timeRef.current) * (Math.PI / 6)
        }

        // Nel mondo il logo e' grande quanto una parte fissa dello schermo (il 40% della
        // larghezza dal computer, l'80% dal telefono), qualunque sia la distanza della
        // camera. Poi si dice al fondale (WorldBackdrop) dove sta e quanto e' grande:
        // la luce dall'alto e il vapore gli si mettono intorno.
        if (inWorld && groupRef.current) {
            const g = groupRef.current
            const aspect = (camera as THREE.PerspectiveCamera).aspect || 1
            g.getWorldPosition(_c)
            _u.set(0, 1, 0).applyQuaternion(camera.quaternion).add(_c).project(camera)
            _c.project(camera)
            const perUnit = Math.abs(_u.y - _c.y) / 2   // altezze di schermo per unita' di mondo
            const width = aspect * (aspect < 1 ? 0.8 : 0.4)   // in altezze di schermo
            if (perUnit > 1e-6) g.scale.setScalar(width / (LOGO_W * perUnit))
            glassUniforms.u_logo.value.set((_c.x + 1) / 2, (_c.y + 1) / 2, width, 1)
        }

        // Il logo resta staticamente ben inquadrato al centro dello schermo.
        // Essendo il Canvas fisso, l'interfaccia HTML scrollando gli passerà naturalmente sopra.
        if (inWorld) return

        if (groupRef.current) {
            const targetY = -0.2 // Altezza perfetta al centro
            const lerpFactor = Math.min(1, delta * 6.5)
            groupRef.current.position.y += (targetY - groupRef.current.position.y) * lerpFactor
        }

        // Il logo svanisce gradualmente solo dopo aver iniziato a scorrere in alto,
        // così rimane ben visibile e inquadrato più a lungo senza essere schiacciato dal pannello.
        const scrollY = useStore.getState().scrollY
        const glassFade = Math.max(0, Math.min(1, 1 - (scrollY - 150) / 600))
        const edgeFade = glassFade

        glassMaterial.opacity = glassFade
        glassMaterial.emissiveIntensity = 0.32 * glassFade
        glassMaterial.visible = glassFade > 0.003
        glassMaterial.depthWrite = glassFade > 0.05

        if (edgeMatRef.current) {
            edgeMatRef.current.uniforms.u_opacity.value = 0.32 * edgeFade
            edgeMatRef.current.visible = edgeFade > 0.003
        }
    })

    return (
        <group ref={groupRef} {...props} rotation-y={Math.PI}>
            {/* Occluder planes — proteggono le sezioni testo */}
            {!inWorld && (
                <>
                    <mesh position={[0, -6, -0.5]} renderOrder={0} material={occluderMat}>
                        <planeGeometry args={[18, 6]} />
                    </mesh>
                    <mesh position={[0, -12, -0.5]} renderOrder={0} material={occluderMat}>
                        <planeGeometry args={[18, 7]} />
                    </mesh>
                </>
            )}

            <Center>
                <Float speed={3} rotationIntensity={0} floatIntensity={0.3}>
                    <group ref={rotatingRef}>
                        <primitive object={scene} scale={0.06} />
                    </group>
                </Float>
            </Center>

            {/* La luce dall'alto, quella del fascio nel vapore: riflessi bagnati sopra le lettere */}
            {inWorld && <pointLight position={[0, 1.7, -0.6]} intensity={14} color="#ffd2fa" />}

            {/* Luce chiave: dall'alto-fronte, definisce i piani superiori */}
            <pointLight position={[0, 4, 3]} intensity={18} color="#ffffff" />
            {/* Rim light: da dietro, illumina i bordi — leggibilità del contorno */}
            <pointLight position={[0, 0, -4]} intensity={12} color="#e8f4ff" />
            {/* Fill: lato sinistro, blush caldo per contrasto cromatico */}
            <pointLight position={[-3, 1, 2]} intensity={8} color="#fce4f0" />
            {/* Accent: basso-destra, ombre morbide sotto */}
            <pointLight position={[3, -2, 1]} intensity={5} color="#f0e8ff" />
        </group>
    )
}

useGLTF.preload('/models/logo.glb')
