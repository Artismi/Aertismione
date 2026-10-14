import { useGLTF, Center, Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../../stores/useStore'
import { createLogoGlass, createLogoEdges, applyLogoHologram } from './logoHologram'

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


    const glassMaterial = useMemo(() => createLogoGlass(), [])

    useEffect(() => {
        if (!scene) return

        const edgeMat = createLogoEdges()
        edgeMatRef.current = edgeMat
        const cleanup = applyLogoHologram(scene, glassMaterial, edgeMat)

        return () => {
            cleanup()
            edgeMatRef.current = null
        }
    }, [scene, glassMaterial])

    useFrame((_, delta) => {
        if (rotatingRef.current) {
            timeRef.current += delta * 0.4
            rotatingRef.current.rotation.y = Math.sin(timeRef.current) * (Math.PI / 6)
        }

        // Il logo resta staticamente ben inquadrato al centro dello schermo.
        // Essendo il Canvas fisso, l'interfaccia HTML scrollando gli passerà naturalmente sopra.
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
