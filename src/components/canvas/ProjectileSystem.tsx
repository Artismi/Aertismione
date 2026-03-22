import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../stores/useStore'

interface Projectile {
    id: number
    position: THREE.Vector3
    velocity: THREE.Vector3
    life: number
}

export function ProjectileSystem() {
    const navMode = useStore((state) => state.navMode)
    const lasers = useStore((state) => state.lasers)
    const removeLaser = useStore((state) => state.removeLaser)

    // Active projectiles with physics
    const [projectiles, setProjectiles] = useState<Projectile[]>([])
    const processedIds = useRef<Set<number>>(new Set())

    useFrame((_state, delta) => {
        if (navMode !== 'drone') return

        // Convert new lasers to projectiles
        lasers.forEach(laser => {
            if (!processedIds.current.has(laser.id)) {
                processedIds.current.add(laser.id)

                // Use the direction vector from the laser
                const direction = new THREE.Vector3(laser.dir[0], laser.dir[1], laser.dir[2])
                const speed = 80

                const newProjectile: Projectile = {
                    id: laser.id,
                    position: new THREE.Vector3(laser.pos[0], laser.pos[1], laser.pos[2]),
                    velocity: direction.multiplyScalar(speed),
                    life: 3.0
                }

                setProjectiles(prev => [...prev, newProjectile])
                removeLaser(laser.id)
            }
        })

        // Update projectile physics
        setProjectiles(prev => {
            return prev
                .map(p => {
                    // Move in the direction of velocity
                    p.position.add(p.velocity.clone().multiplyScalar(delta))
                    p.life -= delta
                    return p
                })
                .filter(p => p.life > 0 && p.position.length() < 200) // Remove if too far
        })
    })

    if (navMode !== 'drone') return null

    return (
        <group>
            {/* Render projectiles as glowing elongated shapes */}
            {projectiles.map((p) => (
                <group key={p.id} position={[p.position.x, p.position.y, p.position.z]}>
                    {/* Projectile body - elongated for speed feel */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 1.5, 6]} />
                        <meshBasicMaterial color="#00ffff" />
                    </mesh>

                    {/* Glowing tip */}
                    <mesh position={[0, 0, -0.8]}>
                        <sphereGeometry args={[0.12, 8, 8]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>

                    {/* Light glow */}
                    <pointLight intensity={2} color="#00ffff" distance={3} />
                </group>
            ))}
        </group>
    )
}
