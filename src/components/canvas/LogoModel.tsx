import { useGLTF, Center, Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../../stores/useStore'

// Invisible occluder material — blocks depth without painting pixels
const occluderMat = new THREE.MeshBasicMaterial({
    colorWrite: false,
    side: THREE.FrontSide,
})

export function LogoModel(props: any) {
    const { scene } = useGLTF('/models/logo.glb')
    const rotatingRef = useRef<THREE.Group>(null)
    const groupRef = useRef<THREE.Group>(null)
    const timeRef = useRef(0)
    const edgeMatRef = useRef<THREE.ShaderMaterial | null>(null)

    const scrollY = useStore((s) => s.scrollY)

    const glassMaterial = useMemo(() => {
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
                // fronte: ~0.92 opaco + riflettente | bordi: ~0.18 sottili
                diffuseColor.a *= 0.18 + NdotV * NdotV * NdotV * 0.74;`
            )
        }

        return mat
    }, [])

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

        const added: THREE.LineSegments[] = []

        scene.traverse((child: any) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.material = glassMaterial
                mesh.renderOrder = 1

                const edges = new THREE.EdgesGeometry(mesh.geometry, 15)
                const lines = new THREE.LineSegments(edges, edgeMat)
                lines.renderOrder = 2
                mesh.add(lines)
                added.push(lines)
            }
        })

        return () => {
            added.forEach(l => l.parent?.remove(l))
            edgeMatRef.current = null
        }
    }, [scene, glassMaterial])

    useFrame((_, delta) => {
        if (rotatingRef.current) {
            timeRef.current += delta * 0.4
            rotatingRef.current.rotation.y = Math.sin(timeRef.current) * (Math.PI / 6)
        }

        // Fase 1: vetro → cristallo puro (scrollY 0–200): le linee spariscono più rapidamente
        // Fase 2: dissolvenza totale (scrollY 200–480): il corpo del logo svanisce
        const glassFade = Math.max(0, Math.min(1, 1 - scrollY / 480))
        // Le linee di bordo spariscono prima (×2 veloce) per l'effetto cristallo
        const edgeFade = Math.max(0, Math.min(1, 1 - scrollY / 220))

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
            <mesh position={[0, -6, -0.5]} renderOrder={0} material={occluderMat}>
                <planeGeometry args={[18, 6]} />
            </mesh>
            <mesh position={[0, -12, -0.5]} renderOrder={0} material={occluderMat}>
                <planeGeometry args={[18, 7]} />
            </mesh>

            <Center>
                <Float speed={3} rotationIntensity={0} floatIntensity={0.3}>
                    <group ref={rotatingRef}>
                        <primitive object={scene} scale={0.06} />
                    </group>
                </Float>
            </Center>

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
