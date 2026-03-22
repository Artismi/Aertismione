import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Trail } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../stores/useStore'

export function DroneController() {
    const { camera } = useThree()
    const navMode = useStore((state) => state.navMode)
    const setAimPosition = useStore((state) => state.setAimPosition)
    const setShipPosition = useStore((state) => state.setShipPosition)
    const isFiring = useStore((state) => state.isFiring)
    const addLaser = useStore((state) => state.addLaser)

    const { scene } = useGLTF('/models/Nave.glb')

    const takeoff = useStore((state) => state.takeoff)
    const setTakeoff = useStore((state) => state.setTakeoff)
    const takeoffProgress = useStore((state) => state.takeoffProgress)
    const setTakeoffProgress = useStore((state) => state.setTakeoffProgress)
    const setIsFiring = useStore((state) => state.setIsFiring)

    // Parked position world coordinates
    const PARKED_POS = new THREE.Vector3(7, -8, -10)
    const FLIGHT_START_POS = new THREE.Vector3(0, 0, 0)

    // Refs
    const shipRef = useRef<THREE.Group>(null)
    const camPos = useRef(takeoff ? new THREE.Vector3(15, -5, 15) : new THREE.Vector3(0, 8, 30))
    const shipPos = useRef(takeoff ? PARKED_POS.clone() : new THREE.Vector3(0, 0, 0))
    const shipVelocity = useRef(new THREE.Vector3(0, 0, 0))
    const aimPos = useRef(new THREE.Vector3(0, 0, -50))
    const lastFireTime = useRef(0)
    const projectileId = useRef(0)

    // Input state
    const mouseNorm = useRef({ x: 0, y: 0 })
    const keys = useRef({ w: false, a: false, s: false, d: false, shift: false })

    // Target rotation (direct from mouse)
    const targetRotation = useRef({ pitch: 0, yaw: 0 })

    // Reusable objects
    const tempVec = useRef(new THREE.Vector3())
    const forwardVector = useRef(new THREE.Vector3(0, 0, -1))
    const rightVector = useRef(new THREE.Vector3(1, 0, 0))

    useEffect(() => {
        if (navMode === 'drone') {
            if (takeoff) {
                shipPos.current.copy(PARKED_POS)
                shipVelocity.current.set(0, 0, 0)
                setTakeoffProgress(0)
                camPos.current.set(15, -5, 15)
            } else {
                shipPos.current.set(0, 0, 0)
                shipVelocity.current.set(0, 0, 0)
                camPos.current.set(0, 8, 30)
                targetRotation.current = { pitch: 0, yaw: 0 }
            }
        }
    }, [navMode, takeoff])

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1
            const y = -(e.clientY / window.innerHeight) * 2 + 1
            mouseNorm.current = { x, y }
        }

        const handleMouseDown = () => !takeoff && setIsFiring(true)
        const handleMouseUp = () => setIsFiring(false)

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyW') keys.current.w = true
            if (e.code === 'KeyA') keys.current.a = true
            if (e.code === 'KeyS') keys.current.s = true
            if (e.code === 'KeyD') keys.current.d = true
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.current.shift = true
            if (e.code === 'Space' && !takeoff) setIsFiring(true)
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'KeyW') keys.current.w = false
            if (e.code === 'KeyA') keys.current.a = false
            if (e.code === 'KeyS') keys.current.s = false
            if (e.code === 'KeyD') keys.current.d = false
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.current.shift = false
            if (e.code === 'Space') setIsFiring(false)
        }

        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [setIsFiring, takeoff])

    useFrame((state, _delta) => {
        if (navMode !== 'drone') return

        const delta = Math.min(_delta, 0.1)

        // --- TAKEOFF SEQUENCE ---
        if (takeoff) {
            const speed = 0.4
            const newProgress = Math.min(1, takeoffProgress + delta * speed)
            setTakeoffProgress(newProgress)

            const t = newProgress < 0.5 ? 4 * newProgress * newProgress * newProgress : 1 - Math.pow(-2 * newProgress + 2, 3) / 2

            const currentX = THREE.MathUtils.lerp(PARKED_POS.x, FLIGHT_START_POS.x, t)
            const currentZ = THREE.MathUtils.lerp(PARKED_POS.z, FLIGHT_START_POS.z, t)
            const currentY = THREE.MathUtils.lerp(PARKED_POS.y, FLIGHT_START_POS.y, t)

            shipPos.current.set(currentX, currentY, currentZ)

            const startQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0))
            const endQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))

            if (shipRef.current) {
                shipRef.current.position.copy(shipPos.current)
                shipRef.current.quaternion.slerpQuaternions(startQuat, endQuat, t)
            }

            const camX = currentX - 10
            const camY = currentY + 8
            const camZ = currentZ + 25

            camera.position.set(camX, camY, camZ)
            camera.lookAt(currentX, currentY, currentZ)

            setShipPosition([shipPos.current.x, shipPos.current.y, shipPos.current.z])
            setAimPosition([shipPos.current.x, shipPos.current.y, shipPos.current.z - 20])

            if (newProgress >= 1) {
                setTakeoff(false)
                shipVelocity.current.set(0, 0, -30)
            }

            return
        }

        // --- SIMPLIFIED ARCADE FLIGHT PHYSICS ---

        // Constants
        const BASE_SPEED = 40
        const BOOST_SPEED = 80
        const TURN_SPEED = 2.5
        const STRAFE_SPEED = 25
        const DAMPING = 0.92
        const ROTATION_LERP = 0.15
        const AIM_DISTANCE = 30
        const MAX_PITCH = Math.PI / 3
        const MAX_YAW = Math.PI * 2

        // 1. DIRECT MOUSE TO ROTATION
        let mx = mouseNorm.current.x
        let my = mouseNorm.current.y

        // Deadzone (5%)
        if (Math.abs(mx) < 0.05) mx = 0
        else mx = Math.sign(mx) * (Math.abs(mx) - 0.05) / 0.95

        if (Math.abs(my) < 0.05) my = 0
        else my = Math.sign(my) * (Math.abs(my) - 0.05) / 0.95

        // Map mouse to target rotation
        targetRotation.current.yaw = -mx * Math.PI * 0.5 * TURN_SPEED
        targetRotation.current.pitch = my * Math.PI * 0.3 * TURN_SPEED

        // Clamp pitch
        targetRotation.current.pitch = THREE.MathUtils.clamp(targetRotation.current.pitch, -MAX_PITCH, MAX_PITCH)

        // 2. SMOOTH ROTATION INTERPOLATION
        if (shipRef.current) {
            const currentEuler = new THREE.Euler().setFromQuaternion(shipRef.current.quaternion, 'YXZ')

            // Lerp to target rotation
            currentEuler.y = THREE.MathUtils.lerp(currentEuler.y, targetRotation.current.yaw, ROTATION_LERP)
            currentEuler.x = THREE.MathUtils.lerp(currentEuler.x, targetRotation.current.pitch, ROTATION_LERP)

            shipRef.current.quaternion.setFromEuler(currentEuler)

            // Get forward and right vectors
            forwardVector.current.set(0, 0, -1).applyQuaternion(shipRef.current.quaternion)
            rightVector.current.set(1, 0, 0).applyQuaternion(shipRef.current.quaternion)
        }

        // 3. KEYBOARD MOVEMENT
        tempVec.current.set(0, 0, 0)

        // Forward/backward
        if (keys.current.w) {
            const speed = keys.current.shift ? BOOST_SPEED : BASE_SPEED
            tempVec.current.add(forwardVector.current.clone().multiplyScalar(speed * delta))
        }
        if (keys.current.s) {
            tempVec.current.add(forwardVector.current.clone().multiplyScalar(-BASE_SPEED * 0.5 * delta))
        }

        // Strafe
        if (keys.current.a) {
            tempVec.current.add(rightVector.current.clone().multiplyScalar(-STRAFE_SPEED * delta))
        }
        if (keys.current.d) {
            tempVec.current.add(rightVector.current.clone().multiplyScalar(STRAFE_SPEED * delta))
        }

        // Add to velocity
        shipVelocity.current.add(tempVec.current)

        // Auto-forward (always moving)
        if (!keys.current.w && !keys.current.s) {
            shipVelocity.current.add(forwardVector.current.clone().multiplyScalar(BASE_SPEED * 0.5 * delta))
        }

        // 4. APPLY DAMPING
        shipVelocity.current.multiplyScalar(DAMPING)

        // 5. UPDATE POSITION
        shipPos.current.add(shipVelocity.current.clone().multiplyScalar(delta))

        // 6. BOUNDARIES
        const boundX = 5000, boundY = 100, boundZ = 5000
        if (Math.abs(shipPos.current.x) > boundX) {
            shipPos.current.x = Math.sign(shipPos.current.x) * boundX
            shipVelocity.current.x *= -0.5
        }
        if (Math.abs(shipPos.current.y) > boundY) {
            shipPos.current.y = Math.sign(shipPos.current.y) * boundY
            shipVelocity.current.y *= -0.5
        }
        if (Math.abs(shipPos.current.z) > boundZ) {
            shipPos.current.z = Math.sign(shipPos.current.z) * boundZ
            shipVelocity.current.z *= -0.5
        }

        // 7. VISUAL SYNC
        if (shipRef.current) {
            shipRef.current.position.copy(shipPos.current)
            // Subtle hover bobbing
            shipRef.current.position.y += Math.sin(state.clock.elapsedTime * 2.5) * 0.15
        }

        // 8. CAMERA CHASE
        const cameraDistance = 30
        const cameraHeight = 10

        const targetCamX = shipPos.current.x - forwardVector.current.x * cameraDistance
        const targetCamY = shipPos.current.y + cameraHeight
        const targetCamZ = shipPos.current.z - forwardVector.current.z * cameraDistance

        camPos.current.x = THREE.MathUtils.lerp(camPos.current.x, targetCamX, 6.0 * delta)
        camPos.current.y = THREE.MathUtils.lerp(camPos.current.y, targetCamY, 6.0 * delta)
        camPos.current.z = THREE.MathUtils.lerp(camPos.current.z, targetCamZ, 6.0 * delta)

        camera.position.copy(camPos.current)
        camera.lookAt(shipPos.current.x, shipPos.current.y, shipPos.current.z)

        // 9. UPDATE AIM POSITION
        aimPos.current.copy(shipPos.current).add(forwardVector.current.clone().multiplyScalar(AIM_DISTANCE))

        setShipPosition([shipPos.current.x, shipPos.current.y, shipPos.current.z])
        setAimPosition([aimPos.current.x, aimPos.current.y, aimPos.current.z])

        // 10. SHOOTING
        const now = state.clock.elapsedTime * 1000
        const fireRate = 120
        if (isFiring && now - lastFireTime.current > fireRate) {
            lastFireTime.current = now

            const spawnDistance = 3
            const spawnPos = forwardVector.current.clone().multiplyScalar(spawnDistance)

            addLaser({
                id: projectileId.current++,
                pos: [
                    shipPos.current.x + spawnPos.x,
                    shipPos.current.y + spawnPos.y,
                    shipPos.current.z + spawnPos.z
                ],
                dir: [forwardVector.current.x, forwardVector.current.y, forwardVector.current.z]
            })
        }
    })

    return (
        <group>
            <group ref={shipRef} visible={navMode === 'drone'}>
                <primitive
                    object={scene.clone()}
                    scale={4.5}
                    rotation={[0, -Math.PI / 2, 0]}
                />

                {/* Brighter lights for better visibility */}
                <spotLight position={[0, 4, 2]} intensity={8} color="#fff" />
                <pointLight position={[0, 0, -3]} intensity={6} color="#00ffaa" distance={15} />
            </group>
        </group>
    )
}
useGLTF.preload('/models/Nave.glb')
