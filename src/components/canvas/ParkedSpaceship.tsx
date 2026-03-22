import { useGLTF, shaderMaterial } from '@react-three/drei'
import { useFrame, extend } from '@react-three/fiber'
import { useRef } from 'react'
import React from 'react'
import * as THREE from 'three'
import { useStore } from '../../stores/useStore'

// We no longer need the custom HologramMaterial, using standard MeshPhysicalMaterial for glass


export function ParkedSpaceship(props: React.ComponentProps<'group'> & Record<string, unknown>) {
    const { scene } = useGLTF('/models/Nave.glb')
    const groupRef = useRef<THREE.Group>(null)
    const materialRef = useRef<any>(null)
    const navMode = useStore((state) => state.navMode)
    const isDroneViewOpen = useStore((state) => state.isDroneViewOpen)

    // Show when in scroll mode AND drone view is not open
    const isVisible = navMode === 'scroll' && !isDroneViewOpen

    useFrame((state) => {
        if (groupRef.current && isVisible) {
            const t = state.clock.getElapsedTime()

            // Rotate on Z-axis like a glass display
            groupRef.current.rotation.z = t * 0.5
        }
    })

    // Create glass material for spaceship
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 0.5,
        ior: 1.5,
        clearcoat: 1.0,
        transparent: true
    })

    // Apply material to model
    scene.traverse((child: any) => {
        if (child.isMesh) {
            child.material = glassMaterial
        }
    })

    return (
        <group
            ref={groupRef}
            {...props}
            visible={isVisible}
        >
            <primitive
                object={scene}
                scale={1.5}
            />

            {/* Holographic glow lights */}
            <pointLight position={[0, 0, 0]} intensity={3} color="#00ccff" distance={8} />
            <pointLight position={[0, 2, 0]} intensity={2} color="#00ffff" distance={6} />
        </group>
    )
}
