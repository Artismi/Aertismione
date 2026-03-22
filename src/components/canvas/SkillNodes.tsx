import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float } from '@react-three/drei'
import * as THREE from 'three'

const SKILLS = [
    { name: 'React', position: [-2, 1, 0] },
    { name: 'Three.js', position: [2, 0.5, 1] },
    { name: 'WebGL', position: [-1.5, -1, 0.5] },
    { name: 'Typescript', position: [1.5, -1.5, -0.5] },
    { name: 'Shaders', position: [0, 2, 0] },
]

function SkillNode({ name, position }: { name: string, position: number[] }) {
    const meshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHover] = useState(false)

    useFrame((state) => {
        if (!meshRef.current) return
        const t = state.clock.getElapsedTime()
        const scale = hovered ? 1.2 : 1.0 + Math.sin(t * 2) * 0.05
        meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.1))

        // Color pulse
        if (meshRef.current.material) {
            (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
                THREE.MathUtils.lerp((meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity, hovered ? 2 : 0.5, 0.1)
        }
    })

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1} position={new THREE.Vector3(...position)}>
            <mesh
                ref={meshRef}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true) }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false) }}
            >
                <octahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial
                    color={hovered ? "#ff0088" : "#ffffff"}
                    emissive={hovered ? "#ff0088" : "#ffffff"}
                    emissiveIntensity={0.5}
                    wireframe
                />
                <Text
                    position={[0.5, 0, 0]}
                    fontSize={0.2}
                    color="white"
                    anchorX="left"
                    anchorY="middle"
                    fillOpacity={hovered ? 1 : 0.5}
                >
                    {name}
                </Text>
            </mesh>
        </Float>
    )
}

export function SkillNodes(props: any) {
    return (
        <group {...props}>
            {SKILLS.map((skill, i) => (
                <SkillNode key={i} {...skill} />
            ))}
        </group>
    )
}
