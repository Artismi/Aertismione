import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function HitParticles({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const particleCount = 20
    const particles = useMemo(() => {
        const temp = []
        for (let i = 0; i < particleCount; i++) {
            const speed = 2 + Math.random() * 5
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * speed,
                Math.random() * speed,
                (Math.random() - 0.5) * speed
            )
            temp.push({ velocity, pos: new THREE.Vector3(0, 0, 0), life: 1.0 })
        }
        return temp
    }, [])

    const dummy = new THREE.Object3D()

    useFrame((_state, delta) => {
        if (!meshRef.current) return

        particles.forEach((p, i) => {
            p.life -= delta * 1.5
            if (p.life > 0) {
                p.pos.add(p.velocity.clone().multiplyScalar(delta))
                p.velocity.y -= 9.8 * delta * 0.5 // gravity

                dummy.position.copy(p.pos)
                dummy.scale.setScalar(p.life * 0.2)
                dummy.updateMatrix()
                meshRef.current!.setMatrixAt(i, dummy.matrix)
            }
        })
        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]} position={position}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial color="#00fff2" />
        </instancedMesh>
    )
}
