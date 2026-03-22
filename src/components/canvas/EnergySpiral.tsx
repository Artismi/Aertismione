import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

// Define the custom shader material
const SpiralMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color('#ffffff'),
        uSpeed: 0.5,
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vPos;
    void main() {
      vUv = uv;
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment Shader
    `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;
    varying vec3 vPos;

    void main() {
      // Create a spiral pattern
      float angle = atan(vPos.x, vPos.z);
      float y = vPos.y;
      
      // Dynamic noise-like effect
      float wave = sin(y * 20.0 + angle * 5.0 - uTime * 2.0);
      float alpha = smoothstep(0.4, 0.6, wave);
      
      // Fade out at ends
      float fade = 1.0 - abs(vUv.y - 0.5) * 2.0;
      
      gl_FragColor = vec4(uColor, alpha * fade * 0.5);
    }
  `
)

extend({ SpiralMaterial })

// Add type definition for the custom material
declare global {
    namespace JSX {
        interface IntrinsicElements {
            spiralMaterial: any
        }
    }
}

export function EnergySpiral(props: any) {
    const materialRef = useRef<any>(null)

    useFrame((_state, delta) => {
        if (materialRef.current) {
            materialRef.current.uTime += delta
        }
    })

    return (
        <mesh {...props}>
            <cylinderGeometry args={[2, 2, 20, 32, 1, true]} />
            {/* @ts-ignore */}
            <spiralMaterial
                ref={materialRef}
                transparent
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    )
}
