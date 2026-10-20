'use client'

/**
 * Il banco da lavoro: piano in legno vissuto (texture fotografica CC0 di
 * Poly Haven, «wood_table_worn»), macchie di colore, tappetino da taglio, una
 * matita e un righello. Sotto non c'e' niente: oltre il bordo c'e' lo sfondo
 * e il resto del sito.
 */

import { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { stainsTexture, matTexture, rulerTexture } from './textures'

const TEX = '/progetti/tex'

const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0]

/**
 * il piano: largo, e profondo appena quanto serve (z = centro del piano). Il
 * mondo scorre con la pagina: piu' profondo, il bordo davanti sporgerebbe sotto
 * la sezione Progetti, in mezzo ai Servizi.
 */
// profondo abbastanza da riempire l'inquadratura: la sfumatura nel rosa resta fuori
// quadro e si vede solo mentre il banco entra ed esce
export const BENCH = { w: 18, d: 9.0, h: 0.4, z: 0 }

export function Bench({ mobile, metal, metalRough }: { mobile: boolean; metal: HTMLImageElement | null; metalRough: THREE.Texture }) {
  // da telefono le versioni da 1K: pesano un quarto
  const k = mobile ? '_1k' : ''
  const [woodMap, woodNormal, woodRough] = useLoader(THREE.TextureLoader, [
    `${TEX}/wood_color${k}.webp`, `${TEX}/wood_normal${k}.webp`, `${TEX}/wood_rough.webp`,
  ])

  const tex = useMemo(() => {
    woodMap.colorSpace = THREE.SRGBColorSpace
    // il piano e' grande (circa 1,6 m): la texture copre circa un metro
    for (const t of [woodMap, woodNormal, woodRough]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 0.6); t.anisotropy = 8
    }
    return { stains: stainsTexture(), mat: matTexture(), ruler: rulerTexture(metal) }
  }, [woodMap, woodNormal, woodRough, metal])

  const mats = useMemo(() => ({
    wood: new THREE.MeshStandardMaterial({
      map: woodMap, normalMap: woodNormal, roughnessMap: woodRough, roughness: 1, metalness: 0,
      normalScale: new THREE.Vector2(1.2, 1.2),
    }),
    stains: new THREE.MeshStandardMaterial({ map: tex.stains, transparent: true, roughness: 0.55, depthWrite: false }),
    woodSide: new THREE.MeshStandardMaterial({ color: '#4a2f1c', roughness: 0.85 }),
    mat: new THREE.MeshStandardMaterial({ map: tex.mat, roughness: 0.82 }),
    matSide: new THREE.MeshStandardMaterial({ color: '#141216', roughness: 0.9 }),
    ruler: new THREE.MeshStandardMaterial({ map: tex.ruler, roughnessMap: metalRough, roughness: 0.7, metalness: 0.6 }),
    pencil: new THREE.MeshPhysicalMaterial({ color: '#E8A8BF', roughness: 0.3, clearcoat: 0.8 }),
    pencilStripe: new THREE.MeshStandardMaterial({ color: '#1A1A1A', roughness: 0.4 }),
    woodTip: new THREE.MeshStandardMaterial({ color: '#d9b48a', roughness: 0.8 }),
    lead: new THREE.MeshStandardMaterial({ color: '#2b2b2e', roughness: 0.35, metalness: 0.4 }),
    ferrule: new THREE.MeshStandardMaterial({ color: '#cfc6b4', roughnessMap: metalRough, roughness: 0.5, metalness: 1 }),
    eraser: new THREE.MeshStandardMaterial({ color: '#9DD4EE', roughness: 0.9 }),
  }), [tex])

  useEffect(() => () => {
    ;[tex.stains, tex.mat, tex.ruler].forEach((t) => t.dispose())
    Object.values(mats).forEach((m) => m.dispose())
  }, [tex, mats])

  const pencil = mobile ? { p: [1.25, 0, 0.75], r: 0.9 } : { p: [0.55, 0, 1.15], r: 0.35 }
  const ruler = mobile ? { p: [-0.9, 0, 2.05], r: 0.2 } : { p: [0.3, 0, -1.05], r: -1.38 }
  const mat = mobile ? { p: [0, 0, -1.0], r: 0 } : { p: [-1.5, 0, 0.1], r: 0.03 }

  return (
    <group>
      <group position={[0, 0, BENCH.z]}>
      {/* piano: facce laterali scure, quella di sopra con il legno */}
      <mesh position={[0, -BENCH.h / 2, 0]} castShadow receiveShadow
        material={[mats.woodSide, mats.woodSide, mats.wood, mats.woodSide, mats.woodSide, mats.woodSide]}>
        <boxGeometry args={[BENCH.w, BENCH.h, BENCH.d]} />
      </mesh>
      <mesh position={[0, 0.0008, 0]} rotation={FLAT} material={mats.stains} receiveShadow>
        <planeGeometry args={[10, BENCH.d - 0.1]} />
      </mesh>
      </group>

      {/* tappetino da taglio */}
      <group position={mat.p as [number, number, number]} rotation={[0, mat.r, 0]}>
        <RoundedBox args={[3.3, 0.016, 3.9]} radius={0.006} smoothness={2} position={[0, 0.008, 0]} material={mats.matSide} receiveShadow />
        <mesh position={[0, 0.0165, 0]} rotation={FLAT} material={mats.mat} receiveShadow>
          <planeGeometry args={[3.29, 3.89]} />
        </mesh>
      </group>

      {/* righello in acciaio */}
      <mesh position={[ruler.p[0], 0.005, ruler.p[2]]} rotation={[0, ruler.r, 0]} castShadow receiveShadow
        material={[mats.ferrule, mats.ferrule, mats.ruler, mats.ferrule, mats.ferrule, mats.ferrule]}>
        <boxGeometry args={[2.6, 0.01, 0.26]} />
      </mesh>

      {/* matita rosa, a sei facce, con punta, ghiera e gomma azzurra */}
      <group position={[pencil.p[0], 0.036, pencil.p[2]]} rotation={[0, pencil.r, 0]}>
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh material={mats.pencil} castShadow receiveShadow>
            <cylinderGeometry args={[0.036, 0.036, 1.1, 6]} />
          </mesh>
          <mesh position={[0, 0.2, 0]} material={mats.pencilStripe}>
            <cylinderGeometry args={[0.0365, 0.0365, 0.03, 6]} />
          </mesh>
          <mesh position={[0, -0.63, 0]} rotation={[Math.PI, 0, 0]} material={mats.woodTip} castShadow>
            <cylinderGeometry args={[0.012, 0.036, 0.16, 6]} />
          </mesh>
          <mesh position={[0, -0.735, 0]} rotation={[Math.PI, 0, 0]} material={mats.lead}>
            <coneGeometry args={[0.012, 0.05, 12]} />
          </mesh>
          <mesh position={[0, 0.6, 0]} material={mats.ferrule} castShadow>
            <cylinderGeometry args={[0.038, 0.038, 0.1, 24]} />
          </mesh>
          <mesh position={[0, 0.69, 0]} material={mats.eraser} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.08, 24]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
