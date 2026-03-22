import { useThree } from '@react-three/fiber'
import { useStore } from '../../stores/useStore'
import { LaserBeam } from './LaserBeam'
import * as THREE from 'three'
import { useMemo } from 'react'

export function DroneInteraction() {
    const { scene } = useThree()
    const navMode = useStore((state) => state.navMode)

    // Get drone position
    const dronePosition = useMemo(() => {
        if (navMode !== 'drone') return new THREE.Vector3(0, 0, 0)

        const drone = scene.getObjectByName('drone-group')
        if (drone) {
            return drone.position.clone()
        }
        return new THREE.Vector3(0, -38, 0)
    }, [scene, navMode])

    return (
        <>
            {navMode === 'drone' && (
                <LaserBeam dronePosition={dronePosition} />
            )}
        </>
    )
}
