import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export function BackgroundModel(props: any) {
    const { scene } = useGLTF('/models/Background_v2.glb')

    // Noise Texture procedurale per l'effetto "Crisp / Grain" (imperfezioni vetrose)
    const noiseTexture = useMemo(() => {
        if (typeof document === 'undefined') return null
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext('2d')
        if (ctx) {
            const imgData = ctx.createImageData(128, 128)
            for (let i = 0; i < imgData.data.length; i += 4) {
                const v = 180 + Math.random() * 75 // Grana luminosa
                imgData.data[i] = v
                imgData.data[i + 1] = v
                imgData.data[i + 2] = v
                imgData.data[i + 3] = 255
            }
            ctx.putImageData(imgData, 0, 0)
        }
        const tex = new THREE.CanvasTexture(canvas)
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(2, 2)
        return tex
    }, [])

    // Frosted / Textured Glass Material — "Crisp & Pink"
    const glassMaterial = useMemo(() => {
        return new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            transmission: 0.95,   
            opacity: 1,
            metalness: 0,
            roughness: 0.45,      // Più ruvido per esaltare il noise (il "crisp")
            roughnessMap: noiseTexture,
            normalMap: noiseTexture,
            normalScale: new THREE.Vector2(0.08, 0.08), // Micro-imperfezioni superficiali
            ior: 1.45,             
            thickness: 8,         
            attenuationColor: '#ffb5d8', // Rosa cipria leggerissimo (attenuato dalla distance)
            attenuationDistance: 12,     // Colore molto soffuso e trasparente
            clearcoat: 0.5,
            clearcoatRoughness: 0.3,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: true,     
        })
    }, [noiseTexture])

    // Apply materials
    useMemo(() => {
        scene.traverse((child: any) => {
            if (child.isMesh) {
                child.material = glassMaterial
            }
        })
    }, [scene, glassMaterial])

    return (
        <group {...props}>
            <primitive object={scene} />
        </group>
    )
}

useGLTF.preload('/models/Background_v2.glb')
