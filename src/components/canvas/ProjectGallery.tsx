import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float } from '@react-three/drei'
import * as THREE from 'three'
import { HitParticles } from './HitParticles'

const PROJECTS = [
    { id: 1, title: 'Neon FLux', type: 'Design', pos: [-12, 0, -10], url: '/projects/project1.pdf' },
    { id: 2, title: 'Void Scent', type: '3D Art', pos: [0, 0, -12], url: '/projects/project2.pdf' },
    { id: 3, title: 'Cyber UI', type: 'Frontend', pos: [12, 0, -10], url: '/projects/project3.pdf' },
    { id: 4, title: 'Ethereal', type: 'Motion', pos: [-8, 0, 8], url: '/projects/project4.pdf' },
    { id: 5, title: 'Nexus', type: 'Fullstack', pos: [8, 0, 12], url: '/projects/project5.pdf' },
]

import { useStore } from '../../stores/useStore'

function ProjectCard({ data }: { data: any }) {
    const meshRef = useRef<THREE.Group>(null)
    const [hit, setHit] = useState(false)
    const [hitPos, setHitPos] = useState<[number, number, number] | null>(null)
    const [hovered, setHover] = useState(false)

    const setSelectedProject = useStore((state) => state.setSelectedProject)
    const addScore = useStore((state) => state.addScore)
    const removeLaser = useStore((state) => state.removeLaser)
    const lasers = useStore((state) => state.lasers)

    useFrame((_state) => {
        if (!meshRef.current) return

        // Collision detection with lasers
        // In this horizontal mode, laser flies down (negative Y relative to drone)
        // But the cards are on the group ground Y=-40.
        // The laser position is in world space.

        lasers.forEach(laser => {
            const laserPos = new THREE.Vector3(...laser.pos)
            // Check if laser is near the card's horizontal boundaries
            // Card is roughly 4x3 units flat on the floor.
            const worldCardX = data.pos[0]
            const worldCardZ = data.pos[2]

            if (Math.abs(laserPos.x - worldCardX) < 2 && Math.abs(laserPos.z - worldCardZ) < 1.5) {
                if (laserPos.y < -38 && laserPos.y > -42) {
                    // HIT!
                    setHit(true)
                    setHitPos(laser.pos)
                    addScore(100)
                    removeLaser(laser.id)
                    setSelectedProject(data.id)

                    // Open PDF
                    window.open(data.url, '_blank')

                    // Reset hit visual after delay
                    setTimeout(() => {
                        setHit(false)
                        setHitPos(null)
                    }, 500)
                }
            }
        })
    })

    return (
        <group position={new THREE.Vector3(data.pos[0], 0, data.pos[2])} ref={meshRef}>
            {hitPos && <HitParticles position={[0, 0, 0]} />}
            <Float speed={1} rotationIntensity={0.05} floatIntensity={0.1}>
                {/* Elevated Shadow/Glow under the card */}
                <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[4.2, 3.2]} />
                    <meshBasicMaterial color="#00fff2" transparent opacity={0.1} />
                </mesh>

                {/* Frame / Sheet */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    userData={{ isProject: true, id: data.id }}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                >
                    <planeGeometry args={[4, 3]} />
                    <meshStandardMaterial
                        color={hit ? "#00fff2" : (hovered ? "#1a1a1a" : "#0a0a0a")}
                        emissive={hit ? "#00fff2" : (hovered ? "#005555" : "#000")}
                        emissiveIntensity={hit ? 20 : 1}
                        side={THREE.DoubleSide}
                        roughness={0.1}
                        metalness={0.8}
                    />
                </mesh>

                {/* Content Image Placeholder */}
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[3.8, 2.8]} />
                    <meshStandardMaterial
                        color={hovered ? "#00fff2" : "#111"}
                        transparent
                        opacity={hovered ? 0.4 : 0.2}
                        emissive={hovered ? "#00fff2" : "#000"}
                        emissiveIntensity={0.5}
                    />
                </mesh>

                <Text
                    position={[-1.8, 0.05, -1.2]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={0.25}
                    color="white"
                    anchorX="left"
                    anchorY="top"
                >
                    {data.title}
                </Text>

                <Text
                    position={[-1.8, 0.05, 1.2]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={0.12}
                    color="#00fff2"
                    anchorX="left"
                    anchorY="bottom"
                >
                    {data.type.toUpperCase()}
                </Text>
            </Float>
        </group>
    )
}

export function ProjectGallery() {
    return (
        <group position={[0, 0, -20]}>
            {/* Simple dark floor at bottom of view */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, -20]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#0a0a12" />
            </mesh>

            {/* Grid overlay */}
            <gridHelper
                args={[200, 50, '#00ffff', '#0a1020']}
                position={[0, -10, -20]}
            />

            {/* Project cards arranged in front of player */}
            {PROJECTS.map((proj) => (
                <ProjectCard key={proj.id} data={proj} />
            ))}

            {/* Scene lighting */}
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 10, 0]} intensity={3} color="#00fff2" distance={50} />
            <pointLight position={[-20, 5, -30]} intensity={2} color="#ff00aa" distance={40} />
            <pointLight position={[20, 5, -30]} intensity={2} color="#00aaff" distance={40} />
            <directionalLight position={[0, 20, 10]} intensity={0.8} color="#ffffff" />
        </group>
    )
}
