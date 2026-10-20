'use client'

/**
 * L'avatar di Andrea, sotto il tavolo accanto a «Chi sono»: la scansione 3D
 * (public/models/avatar.glb) in vetro azzurro Artismi, in piedi sul pavimento,
 * con una luce morbida che lo stacca dall'ombra del tavolo.
 */

import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FLOOR_Y } from './Bench'

export function Avatar3D({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF('/models/avatar.glb')
  const invalidate = useThree((s) => s.invalidate)

  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#c9ecfa',
    roughness: 0.22,
    transmission: 0.65,
    thickness: 1.2,
    ior: 1.5,
    attenuationColor: new THREE.Color('#6cc0dc'),
    attenuationDistance: 4,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    // un filo di luce propria: nell'ombra del tavolo il vetro altrimenti si spegne
    emissive: new THREE.Color('#4aa8c8'),
    emissiveIntensity: 0.18,
  }), [])

  // la scansione e' una sola mesh: la si clona con il vetro al posto del materiale grigio
  const model = useMemo(() => {
    const c = scene.clone()
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) { m.material = glass; m.castShadow = true }
    })
    return c
  }, [scene, glass])

  useEffect(() => { invalidate() }, [model, invalidate])
  useEffect(() => () => glass.dispose(), [glass])

  return (
    <group position={[position[0], FLOOR_Y + position[1], position[2]]}>
      {/* la scansione e' alta circa 4,6 unita' con i piedi a terra: cosi' sta sotto il piano */}
      <primitive object={model} scale={0.95} rotation={[0, -0.35, 0]} />
      <spotLight position={[-2, 6.5, 7]} angle={0.55} penumbra={1} intensity={140} color="#ffe2ec" distance={22} />
      <pointLight position={[-1.5, 3, 2.5]} intensity={6} color="#9DD4EE" distance={8} />
    </group>
  )
}
