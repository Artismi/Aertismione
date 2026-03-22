import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'

export interface AvatarTarget {
    id: string
    x: number
    y: number
}

interface AvatarParticlesProps {
    onTrackedPoints?: (points: AvatarTarget[]) => void
    [key: string]: any
}

export function AvatarParticles({ onTrackedPoints, ...props }: AvatarParticlesProps) {
    // Load the model using useGLTF for better stability
    const { scene } = useGLTF('/models/avatar.glb')
    const groupRef = useRef<THREE.Group>(null)
    const anchorRef = useRef<THREE.Object3D | null>(null)
    const { camera, size } = useThree()

    // Clone and modify the model
    const clone = useMemo(() => {
        const c = scene.clone()
        c.traverse((child: any) => {
            if (child.isMesh) {
                child.material = new THREE.MeshPhysicalMaterial({
                    color: '#44eeff',      // Azzurrino acquamarina brillante
                    metalness: 0.1,
                    roughness: 0.1,
                    transmission: 1.0,     // Massima trasparenza (rifrange il body HTML)
                    thickness: 2.5,        // Maggiore spessore = colore d'attenuazione più intenso
                    ior: 1.8,              // Grande rifrazione per un look vetroso Premium
                    attenuationColor: '#00aacd', // Tonalità acqua profonda nelle zone spesse
                    attenuationDistance: 10,     
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.05,
                    transparent: true,
                    depthWrite: true       // FONDAMENTALE: occulta i piani resi successivamente
                })
            }
        })
        return c
    }, [scene])

    // Create an anchor point at the center of the avatar
    useEffect(() => {
        if (groupRef.current && !anchorRef.current) {
            const anchor = new THREE.Object3D()
            anchor.userData.id = 'center'
            anchor.position.set(0, 0, 0)
            groupRef.current.add(anchor)
            anchorRef.current = anchor
        }
    }, [])

    // Track and project 3D points to 2D screen space
    useFrame(() => {
        if (!anchorRef.current || !onTrackedPoints) return

        const points: AvatarTarget[] = []
        const widthHalf = size.width / 2
        const heightHalf = size.height / 2

        const pos = new THREE.Vector3()
        anchorRef.current.getWorldPosition(pos)
        pos.project(camera)

        points.push({
            id: anchorRef.current.userData.id,
            x: (pos.x * widthHalf) + widthHalf,
            y: -(pos.y * heightHalf) + heightHalf
        })

        onTrackedPoints(points)
    })

    return (
        <group ref={groupRef} {...props}>
            <primitive object={clone} scale={0.3} />
        </group>
    )
}

// Preload the model
useGLTF.preload('/models/avatar.glb')

