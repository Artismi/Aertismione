import { useGLTF, useEnvironment, useTexture, Center, Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../../stores/useStore'
import { glassUniforms, glassPars, glassComposite } from './table/WorldBackdrop'
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
                Object.assign(shader.uniforms, glassUniforms)
                // vetro chiaro, quasi liquido: il fondale si piega appena nei fianchi tondi,
                // come attraverso l'acqua
                const liquid = /* glsl */`
                    vec2 glassShift = vec2(0.0);
                    vec3 glassTint = vec3(1.0);
                    float glassGlint = 0.0;
                    vec3 glassSheen = vec3(0.0);
                    {
                        vec3 n = normalize(vNormal);
                        float nv = abs(dot(n, normalize(vViewPosition)));
                        // Vetro cavo, soffiato: una pelle sottile intorno al vuoto. Attraverso il
                        // fronte il fondo passa quasi pulito; il vetro si vede solo dove la pelle
                        // e' presa di taglio: un orlo stretto e carico sul contorno e, piu' dentro
                        // e piu' tenue, la linea della parete di dietro. E' l'orlo sottile a dire
                        // "cavo": la fascia larga e colorata di prima lo faceva sembrare pieno
                        float side = smoothstep(0.42, 0.06, nv);
                        float back = exp(-pow((nv - 0.5) / 0.07, 2.0));
                        // rifrazione: forte solo dove la pelle e' di taglio (il fondo si piega
                        // lungo i contorni), appena accennata sul fronte
                        glassShift = -n.xy * (pow(1.0 - nv, 2.2) * 0.11 + 0.003);
                        // sul fronte il fondo passa com'e' intorno (la pagina lo vede un po' piu' scuro
                        // della parete calcolata qui), appena velato di rosa
                        glassTint = mix(vec3(0.93, 0.885, 0.875), vec3(1.05, 0.58, 0.49), side);
                        glassTint *= 1.0 - 0.1 * back;
                        // la profondita': una sfumatura rosa che sta DENTRO il vetro, sotto uno
                        // strato limpido. La sua forma e' la mappa di
                        // logo-ripieno.png (quanto il punto e' dentro il logo), letta piu' in
                        // profondita' lungo lo sguardo: girando il logo la sfumatura scorre sotto la
                        // superficie (parallasse) e tra i due si vede il trasparente
                        vec3 dp1 = dFdx(-vViewPosition), dp2 = dFdy(-vViewPosition);
                        vec2 du1 = dFdx(vRip), du2 = dFdy(vRip);
                        vec3 e1 = normalize(dp1 - n * dot(dp1, n) + 1e-6), e2 = cross(n, e1);
                        // dal piano della superficie (vista) alla mappa; asse y in larghezze del logo
                        vec2 asp = vec2(1.0, u_ripAspect);
                        mat2 J = mat2(du1 * asp, du2 * asp) * inverse(mat2(dot(dp1, e1), dot(dp1, e2), dot(dp2, e1), dot(dp2, e2)));
                        float perView = sqrt(abs(determinant(J)));   // larghezze del logo per unita' di vista
                        vec3 into = normalize(vViewPosition);         // verso la camera
                        vec3 o = -into / max(dot(into, n), 0.25);     // dentro il vetro, di 1 in profondita'
                        vec2 o2 = vec2(dot(o, e1), dot(o, e2));
                        // tre letture a profondita' crescenti, mediate: una sfumatura sola, morbida
                        float rip = 0.0;
                        for (int i = 0; i < 3; i++) {
                            float dz = 0.03 + 0.02 * float(i);        // profondita', in larghezze del logo
                            vec2 duv = J * o2 * (dz / max(perView, 1e-6)) / asp;
                            rip += texture2D(u_ripieno, vRip + duv).r;
                        }
                        // lieve, rosa magenta, piu' carica verso il centro: non si vede come
                        // colore, fa sentire quanto il vetro e' profondo
                        float core = smoothstep(0.0, 0.85, rip / 3.0) * (1.0 - 0.6 * side);
                        glassTint = mix(glassTint, vec3(0.96, 0.7, 0.86), 0.32 * core);
                        // le linee dell'acqua viste attraverso: fili netti e poco accesi
                        glassTint *= 1.0 + 0.1 * smoothstep(0.3, 0.8, lightWaves(gl_FragCoord.xy / u_px + glassShift));
                        // riflessi piccoli e nitidi, come in un render: due luci da studio che si
                        // specchiano nella superficie tonda. Sono loro a dire "vetro", non i bordi bianchi
                        vec3 vdir = normalize(-vViewPosition);
                        vec3 rf = reflect(-vdir, n);
                        glassGlint = pow(max(dot(rf, normalize(vec3(-0.45, 0.8, 0.4))), 0.0), 160.0) * 0.9
                                   + pow(max(dot(rf, normalize(vec3(0.7, 0.35, 0.6))), 0.0), 420.0) * 0.55;
                        // il fronte e' plexiglass tagliato a laser e lucidato: riflessi netti e
                        // colorati che stanno sopra (glassSheen), mentre quello che si vede
                        // attraverso (l'interno, il retro) e' satinato, morbido (glassComposite).
                        // Chiazze appena piu' vive, perche' la lucidatura non e' mai uniforme
                        float wet = smoothstep(0.02, 0.4, field(vObjPos.xy / 55.0, 0.0)
                                  + 0.35 * field(vObjPos.xy / 17.0 + 3.1, 0.0));
                        float front = smoothstep(0.55, 0.92, nv);
                        glassGlint *= mix(0.75, 1.15, wet);
                        // il softbox dello studio specchiato nel fronte: una lama netta, fredda,
                        // con l'orlo appena iridato, e un alone caldo intorno
                        float win = dot(rf, normalize(vec3(-0.25, 0.35, 0.9)));
                        float lama = smoothstep(0.9, 0.93, win) * (1.0 - smoothstep(0.975, 0.99, win));
                        glassSheen = (vec3(0.82, 0.9, 1.0) * lama * 0.34
                                   + vec3(1.0, 0.8, 0.85) * pow(max(win, 0.0), 30.0) * 0.12) * front;
                        // l'orlo tagliato e lucidato: dove la superficie gira, un filo di luce che
                        // cambia colore come il taglio del plexi (dispersione)
                        float taglio = smoothstep(0.42, 0.24, nv) * smoothstep(0.06, 0.2, nv);
                        vec3 iride = 0.5 + 0.5 * cos(6.2832 * (n.x * 0.6 + n.y * 0.4 + vec3(0.0, 0.33, 0.67)));
                        glassSheen += mix(vec3(1.0), iride, 0.55) * taglio * 0.16;
                        // i riflessi dello studio sui fianchi bruciavano in bianco: si smorzano
                        gl_FragColor.rgb /= 1.0 + gl_FragColor.rgb * side * 4.0;
                    }
                `
                // la posizione sul logo: le chiazze bagnate restano ferme sul vetro
                // e il punto nell'ingombro del logo (primo uv di logo.glb), per la mappa del ripieno
                shader.vertexShader = 'varying vec3 vObjPos;\nvarying vec2 vRip;\n' + shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    '#include <begin_vertex>\nvObjPos = position;\nvRip = uv;',
                )
                shader.uniforms.u_ripieno = { value: ripieno }
                const im = ripieno.image as HTMLImageElement | undefined
                shader.uniforms.u_ripAspect = { value: im ? im.height / im.width : 0.6 }
                shader.fragmentShader = 'varying vec3 vObjPos;\nvarying vec2 vRip;\nuniform sampler2D u_ripieno;\nuniform float u_ripAspect;\n' + glassPars + shader.fragmentShader.replace(
                    '#include <dithering_fragment>',
                    '#include <dithering_fragment>\n' + liquid + glassComposite,
                )
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
                    ? 'diffuseColor.a *= mix(0.03, 0.5, pow(fresnel, 2.6));'
                    // fronte: ~0.92 opaco + riflettente | bordi: ~0.18 sottili
                    : 'diffuseColor.a *= 0.18 + NdotV * NdotV * NdotV * 0.74;'}`
            )
        }

        return mat
    }, [inWorld, ripieno])

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
        const glassFade = Math.max(0, Math.min(1, 1 - (scrollY - 150) / 600))
        const edgeFade = glassFade

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
