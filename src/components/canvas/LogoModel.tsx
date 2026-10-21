import { useGLTF, useEnvironment, Center, Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../../stores/useStore'
import { glassUniforms, glassPars, glassComposite } from './table/WorldBackdrop'

/** Larghezza del logo nel mondo, a scala 1 (logo.glb: 343 × 0,139 × 0,06) */
const LOGO_W = 2.86
const _c = new THREE.Vector3(), _u = new THREE.Vector3(), _s = new THREE.Vector3()

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
            color: new THREE.Color(inWorld ? '#9fb0c4' : '#eef5ff'),
            emissive: new THREE.Color('#c8e8ff'),
            emissiveIntensity: inWorld ? 0.1 : 0.32,
            roughness: 0.0,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            envMapIntensity: inWorld ? 3.2 : 5.5,
            // plexiglass: un velo di arcobaleno dove la luce lo prende di sbieco
            iridescence: 0.45,
            iridescenceIOR: 1.35,
            iridescenceThicknessRange: [180, 520],
            transparent: true,
            opacity: 1.0,   // controllata dal Fresnel nel shader
            depthWrite: true,
            side: THREE.FrontSide,
        })

        // Fresnel sull'alpha: fronte quasi trasparente, bordi opachi come cristallo.
        // NdotV ≈ 1 (fronte) → alpha bassa; NdotV ≈ 0 (bordi) → alpha alta.
        mat.onBeforeCompile = (shader) => {
            // Il logo e' liscio: senza spigoli serve un contorno. Dove il bordo tondo gira
            // via dalla vista il vetro diventa denso e scuro, come lo spessore del plexiglass
            // visto di taglio.
            const rim = /* glsl */`
                {
                    float nv = abs(dot(normalize(vNormal), normalize(vViewPosition)));
                    float edge = smoothstep(0.8, 0.25, nv);
                    gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.035, 0.015, 0.06), edge * 0.88);
                    gl_FragColor.a = mix(gl_FragColor.a, 1.0, edge);
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
                diffuseColor.a *= ${inWorld ? '0.3' : '0.18 + NdotV * NdotV * NdotV * 0.74'};`
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
        // filo scuro tutto intorno (fuso con il fondale come il vetro).
        const outlineMat = inWorld ? new THREE.ShaderMaterial({
            uniforms: { ...glassUniforms, u_opacity: { value: 0.62 }, u_width: { value: 1.7 } },
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
                    gl_FragColor = vec4(0.03, 0.012, 0.05, u_opacity);
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

        // dove sta il logo sullo schermo e quanto e' grande: la luce dall'alto e il
        // vapore del fondale (WorldBackdrop) gli si mettono intorno
        if (inWorld && groupRef.current) {
            const g = groupRef.current
            g.getWorldPosition(_c)
            g.getWorldScale(_s)
            _u.set(0, 1, 0).applyQuaternion(camera.quaternion).add(_c).project(camera)
            _c.project(camera)
            const perUnit = Math.abs(_u.y - _c.y) / 2   // altezze di schermo per unita' di mondo
            glassUniforms.u_logo.value.set((_c.x + 1) / 2, (_c.y + 1) / 2, LOGO_W * _s.x * perUnit, 1)
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
            {inWorld && <pointLight position={[0, 1.7, -0.6]} intensity={14} color="#fff4ec" />}

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
