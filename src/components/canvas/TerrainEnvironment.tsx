import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export function TerrainEnvironment() {
    const terrainRef = useRef<THREE.Mesh>(null)

    // Procedural terrain shader with topographic colors
    const terrainMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorLowland: { value: new THREE.Color('#4a7c4e') },   // Dark green
                colorMidland: { value: new THREE.Color('#8bc34a') },   // Light green
                colorHighland: { value: new THREE.Color('#c9a961') },  // Yellow/tan
                colorMountain: { value: new THREE.Color('#6b5b4f') },  // Brown/gray
                colorPeak: { value: new THREE.Color('#888888') },      // Gray peaks
                fogColor: { value: new THREE.Color('#1a1a2e') },
                fogNear: { value: 20 },
                fogFar: { value: 80 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPos;
                varying float vElevation;
                
                // Simplex noise functions
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                
                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                    
                    vec3 i = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
                    
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);
                    
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    
                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    
                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;
                    
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                    
                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);
                    
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                    
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }
                
                void main() {
                    vUv = uv;
                    
                    // Create terrain elevation
                    float elevation = 0.0;
                    vec3 pos = position;
                    
                    // Multiple octaves of noise for terrain
                    elevation += snoise(vec3(pos.x * 0.05, pos.z * 0.05, 0.0)) * 4.0;
                    elevation += snoise(vec3(pos.x * 0.1, pos.z * 0.1, 10.0)) * 2.0;
                    elevation += snoise(vec3(pos.x * 0.2, pos.z * 0.2, 20.0)) * 1.0;
                    
                    pos.y += elevation;
                    vElevation = elevation;
                    
                    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
                    vWorldPos = worldPosition.xyz;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 colorLowland;
                uniform vec3 colorMidland;
                uniform vec3 colorHighland;
                uniform vec3 colorMountain;
                uniform vec3 colorPeak;
                uniform vec3 fogColor;
                uniform float fogNear;
                uniform float fogFar;
                
                varying vec2 vUv;
                varying vec3 vWorldPos;
                varying float vElevation;
                
                void main() {
                    // Color based on elevation
                    vec3 terrainColor;
                    float e = vElevation;
                    
                    if (e < -2.0) {
                        terrainColor = colorLowland;
                    } else if (e < 0.0) {
                        float t = (e + 2.0) / 2.0;
                        terrainColor = mix(colorLowland, colorMidland, t);
                    } else if (e < 2.0) {
                        float t = e / 2.0;
                        terrainColor = mix(colorMidland, colorHighland, t);
                    } else if (e < 4.0) {
                        float t = (e - 2.0) / 2.0;
                        terrainColor = mix(colorHighland, colorMountain, t);
                    } else {
                        float t = clamp((e - 4.0) / 3.0, 0.0, 1.0);
                        terrainColor = mix(colorMountain, colorPeak, t);
                    }
                    
                    // Add some variation with simple noise pattern
                    float pattern = fract(sin(dot(vWorldPos.xz, vec2(12.9898, 78.233))) * 43758.5453);
                    terrainColor *= 0.9 + pattern * 0.2;
                    
                    // Distance fog
                    float depth = length(vWorldPos.xz);
                    float fogFactor = smoothstep(fogNear, fogFar, depth);
                    terrainColor = mix(terrainColor, fogColor, fogFactor * 0.7);
                    
                    gl_FragColor = vec4(terrainColor, 1.0);
                }
            `,
            side: THREE.DoubleSide
        })
    }, [])

    // Animate time uniform
    useFrame((state) => {
        if (terrainMaterial.uniforms) {
            terrainMaterial.uniforms.time.value = state.clock.getElapsedTime()
        }
    })

    return (
        <group position={[0, -45, 0]}>
            {/* Terrain mesh */}
            <mesh
                ref={terrainRef}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
            >
                <planeGeometry args={[200, 200, 128, 128]} />
                <primitive object={terrainMaterial} attach="material" />
            </mesh>

            {/* Grid overlay for game feel */}
            <gridHelper
                args={[200, 100, '#00ffff', '#002233']}
                position={[0, 1, 0]}
            />

            {/* Atmospheric lighting */}
            {/* Main sun light - warm directional */}
            <directionalLight
                position={[30, 50, 20]}
                intensity={2}
                color="#fff5e6"
                castShadow
            />

            {/* Ambient fill */}
            <ambientLight intensity={0.4} color="#8899aa" />

            {/* Colored accent lights */}
            <pointLight position={[-40, 15, -40]} intensity={3} color="#ff6b35" distance={60} />
            <pointLight position={[40, 15, 40]} intensity={3} color="#00b4d8" distance={60} />
            <pointLight position={[0, 20, 0]} intensity={2} color="#90e0ef" distance={50} />

            {/* Rim lights for depth */}
            <pointLight position={[-50, 5, 0]} intensity={2} color="#ff0088" distance={40} />
            <pointLight position={[50, 5, 0]} intensity={2} color="#00ff88" distance={40} />

            {/* Fog effect via background gradient planes at edges */}
            {/* Top atmospheric glow */}
            <mesh position={[0, 30, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial
                    color="#1a1a2e"
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    )
}
