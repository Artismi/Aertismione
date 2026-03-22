import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useStore } from '../../stores/useStore'

// Configuration
const ANIMATION_DURATION = 800
const STAGGER_DELAY = 60
const MAX_BULLETS = 3
const BEAM_LENGTH = 4
const BEAM_WIDTH_BASE = 0.01

// Particle system
interface Particle {
    active: boolean
    position: THREE.Vector3
    velocity: THREE.Vector3
    life: number
    scale: number
}

interface Bullet {
    active: boolean
    startTime: number
    startPos: THREE.Vector3
    endPos: THREE.Vector3
    curve: THREE.CubicBezierCurve3
    completed: boolean
    particles: Particle[]
}

// ... (Rest stays same)

export function LaserBeam({ dronePosition }: { dronePosition: THREE.Vector3 }) {
    const { camera, mouse } = useThree()
    const navMode = useStore((state) => state.navMode)
    const isFiring = useStore((state) => state.isFiring)
    const addLaser = useStore((state) => state.addLaser)
    const storeLasers = useStore((state) => state.lasers)

    const bulletsRef = useRef<Bullet[]>([])
    const lastFireTime = useRef(0)
    const fireRate = 0.1

    const particleMeshesRef = useRef<THREE.InstancedMesh[]>([])
    const beamMeshesRef = useRef<THREE.Mesh[]>([])

    // Create particle instances
    useState(() => {
        for (let i = 0; i < MAX_BULLETS; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.02, 6, 6)
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00fff2, // Changed to match drone theme
                transparent: true,
                opacity: 0.8
            })
            const particleMesh = new THREE.InstancedMesh(particleGeometry, particleMaterial, 30)
            particleMesh.count = 0
            particleMeshesRef.current.push(particleMesh)
        }
    })

    useFrame((state) => {
        if (navMode !== 'drone') return

        const now = state.clock.elapsedTime * 1000

        // Sync with store to handle collision removals
        bulletsRef.current.forEach((bullet: Bullet) => {
            if (bullet.active && !bullet.completed) {
                const stillInStore = storeLasers.some(l => l.id === bullet.startTime)
                if (!stillInStore && (now - bullet.startTime) > 150) {
                    bullet.active = false
                    bullet.completed = true
                }
            }
        })

        // Fire new bullets
        if (isFiring && now - lastFireTime.current > fireRate * 1000) {
            const raycaster = new THREE.Raycaster()
            raycaster.setFromCamera(mouse, camera)

            const targetPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 40)
            const target = new THREE.Vector3()
            const intersect = raycaster.ray.intersectPlane(targetPlane, target)

            if (intersect) {
                for (let i = 0; i < MAX_BULLETS; i++) {
                    const bulletId = now + (i * STAGGER_DELAY)
                    const side = (i - 1) * 0.4
                    const startPos = dronePosition.clone().add(new THREE.Vector3(side, -0.5, 0))

                    const curve = new THREE.CubicBezierCurve3(
                        startPos,
                        startPos.clone().add(new THREE.Vector3(0, -5, 0)),
                        target.clone().add(new THREE.Vector3(0, 5, 0)),
                        target
                    )

                    bulletsRef.current[i] = {
                        active: true,
                        startTime: bulletId,
                        startPos,
                        endPos: target,
                        curve,
                        completed: false,
                        particles: []
                    }

                    addLaser({ id: bulletId, pos: [startPos.x, startPos.y, startPos.z], dir: [0, 0, -1] })
                }
                lastFireTime.current = now
            }
        }

        // Update bullets
        bulletsRef.current.forEach((bullet, index) => {
            if (!bullet || !bullet.active || bullet.completed) return

            if (now < bullet.startTime) return

            const elapsed = now - bullet.startTime
            const rawProgress = Math.min(elapsed / ANIMATION_DURATION, 1.0)
            const ease = 1 - Math.pow(1 - rawProgress, 3)

            const isVaporizing = rawProgress > 0.85

            // Get current position on curve
            const currentPos = bullet.curve.getPoint(ease)

            // Update position in global store
            const laserInStore = useStore.getState().lasers.find(l => l.id === bullet.startTime)
            if (laserInStore) {
                laserInStore.pos = [currentPos.x, currentPos.y, currentPos.z]
            }

            // Spawn particles
            if (rawProgress < 1.0) {
                const spawnCount = isVaporizing ? 3 : (Math.random() > 0.7 ? 1 : 0)

                for (let k = 0; k < spawnCount; k++) {
                    const particle: Particle = {
                        active: true,
                        position: currentPos.clone().add(new THREE.Vector3(
                            (Math.random() - 0.5) * (isVaporizing ? 0.3 : 0.1),
                            (Math.random() - 0.5) * (isVaporizing ? 0.3 : 0.1),
                            (Math.random() - 0.5) * (isVaporizing ? 0.3 : 0.1)
                        )),
                        velocity: new THREE.Vector3(
                            (Math.random() - 0.5) * (isVaporizing ? 1 : 0.2),
                            (Math.random() - 0.5) * (isVaporizing ? 1 : 0.2),
                            (Math.random() - 0.5) * (isVaporizing ? 1 : 0.2)
                        ),
                        life: isVaporizing ? 0.6 : 0.8,
                        scale: isVaporizing ? 0.8 + Math.random() * 0.4 : 0.4 + Math.random() * 0.2
                    }
                    bullet.particles.push(particle)
                }
            }

            // Update particles
            bullet.particles = bullet.particles.filter((p: Particle) => {
                p.position.add(p.velocity.clone().multiplyScalar(0.016))
                p.life -= 0.05
                return p.life > 0 && p.active
            })

            // Update particle mesh
            const particleMesh = particleMeshesRef.current[index]
            if (particleMesh) {
                particleMesh.count = bullet.particles.length
                bullet.particles.forEach((p: Particle, i: number) => {
                    const matrix = new THREE.Matrix4()
                    matrix.setPosition(p.position)
                    matrix.scale(new THREE.Vector3(p.scale * p.life, p.scale * p.life, p.scale * p.life))
                    particleMesh.setMatrixAt(i, matrix)
                })
                particleMesh.instanceMatrix.needsUpdate = true

                const material = particleMesh.material as THREE.MeshBasicMaterial
                if (material && bullet.particles.length > 0) {
                    const maxLife = Math.max(...bullet.particles.map((p: Particle) => p.life), 0)
                    material.opacity = maxLife
                }
            }

            // Update beam geometry
            const beamMesh = beamMeshesRef.current[index]
            if (beamMesh) {
                const fadeOutFactor = isVaporizing ? (1 - (rawProgress - 0.85) / 0.15) : 1

                // Get tangent for beam direction
                const tangent = bullet.curve.getTangent(ease)
                const beamStart = currentPos.clone().sub(tangent.clone().multiplyScalar(BEAM_LENGTH * 0.5))
                const beamEnd = currentPos.clone().add(tangent.clone().multiplyScalar(BEAM_LENGTH * 0.5))

                const beamDir = beamEnd.clone().sub(beamStart)
                const beamDist = beamDir.length()

                beamMesh.position.copy(beamStart.clone().add(beamDir.clone().multiplyScalar(0.5)))
                beamMesh.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    beamDir.normalize()
                )
                beamMesh.scale.set(
                    BEAM_WIDTH_BASE * (isVaporizing ? (1 + (rawProgress - 0.85) * 8) : 1),
                    beamDist,
                    BEAM_WIDTH_BASE * (isVaporizing ? (1 + (rawProgress - 0.85) * 8) : 1)
                )

                const material = beamMesh.material as THREE.MeshStandardMaterial
                if (material) {
                    material.opacity = fadeOutFactor
                }
                beamMesh.visible = fadeOutFactor > 0 && bullet.active
            }

            if (rawProgress >= 1.0) {
                bullet.completed = true
                bullet.particles = []
                if (beamMesh) beamMesh.visible = false
                if (particleMesh) particleMesh.count = 0
                // Clean up store
                useStore.getState().removeLaser(bullet.startTime)
            }
        })
    })

    return (
        <group visible={navMode === 'drone'}>
            {/* Beam meshes */}
            {Array.from({ length: MAX_BULLETS }).map((_, i) => (
                <mesh
                    key={`beam-${i}`}
                    ref={el => { if (el) beamMeshesRef.current[i] = el }}
                    visible={false}
                >
                    <cylinderGeometry args={[1, 1, 1, 8]} />
                    <meshStandardMaterial
                        color={0xFFFFFF}
                        transparent
                        opacity={1}
                        emissive={0xE0FFFF}
                        emissiveIntensity={2}
                        roughness={0.2}
                        metalness={0.8}
                    />
                </mesh>
            ))}

            {/* Particle instances */}
            {particleMeshesRef.current.map((mesh, i) => (
                <primitive key={`particles-${i}`} object={mesh} />
            ))}
        </group>
    )
}
