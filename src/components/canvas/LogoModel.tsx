import { useGLTF, useEnvironment, useTexture, Center, Float } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../../stores/useStore'
import { glassUniforms } from './table/WorldBackdrop'
import { applyWorldGlass, worldGlassAlpha } from '@/shaders/logoGlass'
import { marble } from './table/marble'
import { logoSeen } from './table/shared'

/** Larghezza del logo nel mondo, a scala 1 (logo.glb: 343 × 0,139 × 0,06) */
const LOGO_W = 2.86
const _c = new THREE.Vector3(), _u = new THREE.Vector3(), _s = new THREE.Vector3()

// Invisible occluder material — blocks depth without painting pixels
const occluderMat = new THREE.MeshBasicMaterial({
    colorWrite: false,
    side: THREE.FrontSide,
})

// Ponte per /ar (biglietto in realtà aumentata): quella pagina carica la home in un
// iframe e, al tocco sull'ologramma, fa volare il suo logo esattamente sopra questo.
// Le servono la posa della scena glTF rispetto alla camera e il campo visivo,
// aggiornati a ogni fotogramma. Con `hold` la pagina AR nasconde questo logo
// finché il suo non è arrivato in posizione, così non se ne vedono due.
// Il logo della pagina AR si ricava da questo: scripts/build-logo-ar.mjs
// Il mondo della home si ridisegna solo su richiesta: `loaded` si legge al momento e
// cambiare `hold` chiede un fotogramma (onHold), se no il logo non sparirebbe né tornerebbe.
const _logoInCamera = new THREE.Matrix4()
type LogoBridge = {
    cameraSpace: number[]; fov: number; aspect: number; visible: boolean; frame: number
    readonly loaded: boolean
    hold: boolean
    onHold: (() => void) | null
}
function logoBridge(): LogoBridge {
    const w = window as unknown as { __artismiLogo?: LogoBridge }
    if (!w.__artismiLogo) {
        let hold = false
        const bridge = { cameraSpace: [], fov: 35, aspect: 1, visible: false, frame: 0, onHold: null } as unknown as LogoBridge
        Object.defineProperties(bridge, {
            loaded: { enumerable: true, get: () => useStore.getState().isLoaded },
            hold: { enumerable: true, get: () => hold, set: (v: boolean) => { hold = v; bridge.onHold?.() } },
        })
        w.__artismiLogo = bridge
    }
    return w.__artismiLogo
}
function publishLogoPose(scene: THREE.Object3D, camera: THREE.Camera, visible: boolean) {
    const bridge = logoBridge()
    _logoInCamera.multiplyMatrices(camera.matrixWorldInverse, scene.matrixWorld)
    _logoInCamera.toArray(bridge.cameraSpace)
    const persp = camera as THREE.PerspectiveCamera
    bridge.fov = persp.fov
    bridge.aspect = persp.aspect
    bridge.visible = visible
    bridge.frame++
}

/**
 * inWorld: il logo e' un oggetto del mondo della home (Table3D), sospeso in aria
 * sopra il banco. Li' non svanisce con lo scroll e non serve proteggere i testi:
 * e' la camera che si muove.
 */
export function LogoModel({ inWorld = false, ...props }: any) {
    const { scene } = useGLTF('/models/logo.glb')
    // la sua luce di studio, quella di sempre (il preset "studio" di drei, servito dal sito):
    // nel mondo del banco la luce e' piu' calda e il vetro diventava grigio
    const studio = useEnvironment({ files: '/models/studio_logo.hdr' })
    // il ripieno del vetro: quanto ogni punto e' dentro il logo (scripts/logo-3d.py)
    const ripieno = useTexture('/models/logo-ripieno.png', (t) => {
        const tx = t as THREE.Texture
        tx.flipY = false
        tx.colorSpace = THREE.NoColorSpace
        tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping
    }) as THREE.Texture
    const rotatingRef = useRef<THREE.Group>(null)
    const groupRef = useRef<THREE.Group>(null)
    const timeRef = useRef(0)
    const edgeMatRef = useRef<THREE.ShaderMaterial | null>(null)
    // 0 mentre il logo del biglietto AR vola qui sopra, 1 a riposo (vedi logoBridge)
    const arHold = useMemo(() => ({ value: 1 }), [])
    const invalidate = useThree((s) => s.invalidate)
    useEffect(() => {
        const bridge = logoBridge()
        bridge.onHold = invalidate
        invalidate()   // la prima posa, appena il logo c'e'
        return () => { if (bridge.onHold === invalidate) bridge.onHold = null }
    }, [invalidate])

    const glassMaterial = useMemo(() => {
        const mat = new THREE.MeshPhysicalMaterial({
            // vetro chiaro, fuso con il rosa che ha dietro: quello di prima del vetro ambra
            // (piu' bello, e il logo si legge meglio)
            // vetro chiaro, fuso con il rosa che ha dietro
            color: new THREE.Color('#eef5ff'),
            emissive: new THREE.Color('#c8e8ff'),
            // nel mondo poco bagliore proprio: il vetro e' limpido, non latteo
            emissiveIntensity: inWorld ? 0.08 : 0.32,
            roughness: 0.0,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            envMapIntensity: 5.5,
            // fuori dal mondo, un velo di arcobaleno dove la luce lo prende di sbieco
            iridescence: inWorld ? 0 : 0.45,
            iridescenceIOR: 1.35,
            iridescenceThicknessRange: [180, 520],
            transparent: true,
            opacity: 1.0,   // controllata dal Fresnel nel shader
            depthWrite: true,
            side: THREE.FrontSide,
        })

        // Fresnel sull'alpha: fronte quasi trasparente, bordi opachi come cristallo.
        // NdotV ≈ 1 (fronte) → alpha bassa; NdotV ≈ 0 (bordi) → alpha alta.
        mat.onBeforeCompile = (shader) => {
            // Il logo e' liscio: senza spigoli serve un contorno. Dove il bordo tondo gira
            // via dalla vista il vetro si fa piu' denso e saturo, arancio-ambra, come lo
            // spessore del vetro colato visto di taglio; il bordo che guarda in su prende
            // la luce dall'alto, lucido. glassShift: quanto il fondale si piega attraverso
            // i bordi tondi (rifrazione), nulla sul fronte.
            const rim = /* glsl */`
                vec2 glassShift = vec2(0.0);
                vec3 glassTint = vec3(1.0);
                {
                    vec3 n = normalize(vNormal);
                    float nv = abs(dot(n, normalize(vViewPosition)));
                    float edge = smoothstep(0.8, 0.25, nv);
                    float up = clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
                    gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.62, 0.17, 0.05), edge * 0.6);
                    gl_FragColor.rgb += vec3(1.0, 0.96, 0.92) * pow(edge, 1.3) * smoothstep(0.55, 0.95, up) * 1.1;
                    gl_FragColor.a = mix(gl_FragColor.a, 1.0, edge * 0.8);
                    glassShift = -n.xy * (1.0 - nv) * 0.055;
                    // il vetro ambra filtra il fondo: piu' spesso (di taglio), piu' carico
                    glassTint = mix(vec3(1.0, 0.8, 0.62), vec3(0.95, 0.52, 0.28), edge);
                }
            `
            if (inWorld) {
                // nel mondo del banco: il vetro si fonde da solo con il rosa che ha dietro (vedi WorldBackdrop)
                applyWorldGlass(shader, { uniforms: glassUniforms, ripieno, arHold })
            } else {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <dithering_fragment>',
                    '#include <dithering_fragment>\n' + rim,
                )
            }
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <alphamap_fragment>',
                `#include <alphamap_fragment>
                float NdotV = abs(dot(normalize(vNormal), normalize(vViewPosition)));
                float fresnel = 1.0 - NdotV;
                ${inWorld
                    // nel mondo: vetro cavo, il fronte e' limpido (~0.03) e la densita' sale solo
                    // vicino al taglio, in fretta: un orlo sottile, non una fascia
                    ? worldGlassAlpha
                    // fronte: ~0.92 opaco + riflettente | bordi: ~0.18 sottili
                    : 'diffuseColor.a *= 0.18 + NdotV * NdotV * NdotV * 0.74;'}`
            )
        }

        return mat
    }, [inWorld, ripieno, arHold])

    useEffect(() => {
        glassMaterial.envMap = studio
        glassMaterial.needsUpdate = true
    }, [glassMaterial, studio])

    useEffect(() => {
        if (!scene) return

        // Outline vetro satinato: noise lungo la linea simula la micro-tessitura
        // del bordo molato. L'ombra interna del vetro non è mai uniforme.
        const edgeMat = new THREE.ShaderMaterial({
            uniforms: { u_opacity: { value: 0.14 } },
            vertexShader: /* glsl */`
                varying vec3 vPos;
                void main() {
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */`
                uniform float u_opacity;
                varying vec3 vPos;

                // Hash pseudo-casuale per noise
                float hash(vec3 p) {
                    p = fract(p * 0.3183099 + 0.1);
                    p *= 17.0;
                    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
                }

                void main() {
                    // Noise ad alta frequenza sulla posizione 3D del bordo
                    float n = hash(vPos * 18.0);
                    // Modulazione: alcuni punti più scuri, altri quasi invisibili
                    float alpha = u_opacity * (0.55 + 0.45 * n);
                    // Colore: indaco scuro con variazione fredda/calda dal noise
                    vec3 col = mix(vec3(0.08, 0.07, 0.18), vec3(0.18, 0.16, 0.30), n);
                    gl_FragColor = vec4(col, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: true,
        })
        edgeMatRef.current = edgeMat

        const added: THREE.Object3D[] = []

        // Le bilie al posto dei pallini delle i: i pallini del disegno (nodi "pallino"
        // e "pallino-i" di logo.glb) si nascondono e al loro centro c'e' una sfera di
        // vetro, grande quanto il pallino
        const sfera = (dot: THREE.Mesh | undefined) => {
            if (!dot?.parent) return null
            dot.updateMatrix()
            dot.geometry.computeBoundingBox()
            const b = dot.geometry.boundingBox!.clone().applyMatrix4(dot.matrix)
            const size = b.getSize(new THREE.Vector3())
            const g = new THREE.SphereGeometry(Math.sqrt(size.x * size.y) / 2 * 1.1, 48, 32)
            // fuori dalla mappa del ripieno: la bilia e' vetro limpido
            g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.uv.count * 2).fill(-1), 2))
            const s = new THREE.Mesh(g, glassMaterial)
            b.getCenter(s.position)
            dot.parent.add(s)
            dot.visible = false
            return s
        }
        const dot = scene.getObjectByName('pallino') as THREE.Mesh | undefined
        const dotI = scene.getObjectByName('pallino-i') as THREE.Mesh | undefined
        const ball = sfera(dot)
        const ballI = sfera(dotI)
        if (ball) {
            ball.name = 'bilia'
            // appena la pagina sale la bilia lascia la i e cade sul piano di gioco (MarblePage)
            if (inWorld) marble.logoBall = ball
        }
        if (ballI) ballI.name = 'bilia-i'

        // prima si raccolgono le mesh: le linee aggiunte sono a loro volta mesh e il
        // traverse le visiterebbe
        const meshes: THREE.Mesh[] = []
        scene.traverse((child: any) => {
            if ((child as THREE.Mesh).isMesh && child !== dot && child !== dotI) meshes.push(child)
        })
        meshes.forEach((mesh) => {
            mesh.material = glassMaterial
            mesh.renderOrder = 1

            // nel mondo niente linee sulle punte: un pixel di linea scura sul vetro chiaro
            // faceva dei micro-bordini neri seghettati
            if (inWorld) return
            // Il logo e' liscio: solo le pieghe vere (le punte) fanno linea,
            // non gli anelli che costruiscono i bordi tondi.
            const edges = new THREE.EdgesGeometry(mesh.geometry, 50)
            const lines = new THREE.LineSegments(edges, edgeMat)
            lines.renderOrder = 2
            mesh.add(lines)
            added.push(lines)

        })

        return () => {
            for (const b of [ball, ballI]) if (b) { b.removeFromParent(); b.geometry.dispose() }
            if (marble.logoBall === ball) marble.logoBall = null
            if (dot) dot.visible = true
            if (dotI) dotI.visible = true
            added.forEach(l => l.parent?.remove(l))
            edgeMatRef.current = null
        }
    }, [scene, glassMaterial, inWorld])

    useFrame(({ camera }, delta) => {
        if (rotatingRef.current) {
            // ondeggia appena (±10°): girando di piu' le lettere di taglio non si leggevano
            timeRef.current += delta * 0.3
            rotatingRef.current.rotation.y = Math.sin(timeRef.current) * (Math.PI / 18)
        }

        // Durante il volo dalla pagina AR il logo resta nascosto, poi ricompare in dissolvenza.
        // Finche' la dissolvenza non e' finita si chiede un altro fotogramma.
        const holdTo = logoBridge().hold ? 0 : 1
        arHold.value += (holdTo - arHold.value) * Math.min(1, delta * 8)
        if (Math.abs(holdTo - arHold.value) > 0.002) invalidate()
        else arHold.value = holdTo

        // dove sta il logo sullo schermo e quanto e' grande: la luce dall'alto e il
        // vapore del fondale (WorldBackdrop) gli si mettono intorno
        if (inWorld && groupRef.current) {
            const g = groupRef.current
            g.getWorldPosition(_c)
            g.getWorldScale(_s)
            _u.set(0, 1, 0).applyQuaternion(camera.quaternion).add(_c).project(camera)
            _c.project(camera)
            const perUnit = Math.abs(_u.y - _c.y) / 2   // altezze di schermo per unita' di mondo
            // l'ultimo numero e' la luce dall'alto e il vapore intorno al logo: spenti, come prima
            glassUniforms.u_logo.value.set((_c.x + 1) / 2, (_c.y + 1) / 2, LOGO_W * _s.x * perUnit, 0)
            logoSeen.scroll = window.scrollY
            // nascosto del tutto finche' quello del biglietto non e' quasi arrivato
            glassMaterial.visible = arHold.value > 0.01
            // per la pagina AR il logo si vede se il suo centro e' nello schermo
            publishLogoPose(scene, camera, Math.abs(_c.x) < 1 && Math.abs(_c.y) < 1 && _c.z < 1)
        }

        // Il logo resta staticamente ben inquadrato al centro dello schermo.
        // Essendo il Canvas fisso, l'interfaccia HTML scrollando gli passerà naturalmente sopra.
        if (inWorld) return

        if (groupRef.current) {
            const targetY = -0.2 // Altezza perfetta al centro
            const lerpFactor = Math.min(1, delta * 6.5)
            groupRef.current.position.y += (targetY - groupRef.current.position.y) * lerpFactor
        }

        // Il logo svanisce gradualmente solo dopo aver iniziato a scorrere in alto,
        // così rimane ben visibile e inquadrato più a lungo senza essere schiacciato dal pannello.
        const scrollY = useStore.getState().scrollY
        const scrollFade = Math.max(0, Math.min(1, 1 - (scrollY - 150) / 600))
        const glassFade = scrollFade * arHold.value
        const edgeFade = glassFade
        publishLogoPose(scene, camera, scrollFade > 0.5)

        glassMaterial.opacity = glassFade
        glassMaterial.emissiveIntensity = 0.32 * glassFade
        glassMaterial.visible = glassFade > 0.003
        glassMaterial.depthWrite = glassFade > 0.05

        if (edgeMatRef.current) {
            edgeMatRef.current.uniforms.u_opacity.value = 0.32 * edgeFade
            edgeMatRef.current.visible = edgeFade > 0.003
        }
    })

    return (
        <group ref={groupRef} {...props} rotation-y={Math.PI}>
            {/* Occluder planes — proteggono le sezioni testo */}
            {!inWorld && (
                <>
                    <mesh position={[0, -6, -0.5]} renderOrder={0} material={occluderMat}>
                        <planeGeometry args={[18, 6]} />
                    </mesh>
                    <mesh position={[0, -12, -0.5]} renderOrder={0} material={occluderMat}>
                        <planeGeometry args={[18, 7]} />
                    </mesh>
                </>
            )}

            <Center>
                <Float speed={3} rotationIntensity={0} floatIntensity={0.3}>
                    <group ref={rotatingRef}>
                        <primitive object={scene} scale={0.06} />
                    </group>
                </Float>
            </Center>

            {/* La luce dall'alto, quella del fascio nel vapore: riflessi bagnati sopra le lettere */}
            {inWorld && <pointLight position={[0, 1.7, -0.6]} intensity={14} color="#fff0e0" />}

            {/* Luce chiave: dall'alto-fronte, definisce i piani superiori */}
            <pointLight position={[0, 4, 3]} intensity={18} color="#ffffff" />
            {/* Rim light: da dietro, illumina i bordi — leggibilità del contorno */}
            <pointLight position={[0, 0, -4]} intensity={12} color="#e8f4ff" />
            {/* Fill: lato sinistro, blush caldo per contrasto cromatico */}
            <pointLight position={[-3, 1, 2]} intensity={8} color="#fce4f0" />
            {/* Accent: basso-destra, ombre morbide sotto */}
            <pointLight position={[3, -2, 1]} intensity={5} color="#f0e8ff" />
        </group>
    )
}

useGLTF.preload('/models/logo.glb')
