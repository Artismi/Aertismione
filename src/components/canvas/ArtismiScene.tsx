'use client'

/**
 * ArtismiScene — scena 3D hub Artismi.
 *
 * - Carica artismi_scene.glb (Draco-compressed)
 * - Nasconde il paesaggio Namaqualand (sfondo = shader procedurale)
 * - Gestisce hotspot interattivi (hover glow + click → cinematic)
 * - Labels 3D via <Html> drei (usa Bebas Neue CSS var del sito)
 */

import { useGLTF, Html } from '@react-three/drei'
import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '@/stores/useStore'
import { SCENE_HOTSPOTS } from '@/config/content'
import { SECTION_TO_ENTER } from '@/lib/cinematicTransitions'
import * as THREE from 'three'

/* ─── Pattern nomi paesaggio da nascondere ────────────────────────────────── */
const LANDSCAPE_RE = /^(namaqualand_|quiver_tree_|didelta_|flower_|fine_leaf_|othonna_|searsia_|drone_rock_|boulder_|mesh_boulder_|realCap_Model_|tree_small_|Cube\.\d|Plane\.|Icosphere\.|AvatarRig)/i

/* ─── Mappa meshName → config hotspot ───────────────────────────────────── */
const HOTSPOT_MAP = Object.fromEntries(SCENE_HOTSPOTS.map(h => [h.meshName, h]))

/* Alias GLB → meshName logico (nomi effettivi dall'export Blender) */
const MESH_ALIAS: Record<string, string> = {
  'Avatar_Work':  'Avatar',
  'Mesh_0':       'BilliardTable',
  'aRTISMI 3D':   'LogoText',
  'LogoText.001': 'LogoText',
  'tripo_mesh_a915e352-07c1-4575-b113-f59eb75c6c58': 'Sofa',
}

function resolveHotspot(obj: THREE.Object3D): string | null {
  let cur: THREE.Object3D | null = obj
  while (cur) {
    const name = MESH_ALIAS[cur.name] ?? cur.name
    if (HOTSPOT_MAP[name]) return name
    cur = cur.parent
  }
  return null
}

/* ─── Componente principale ──────────────────────────────────────────────── */
export function ArtismiScene() {
  const { scene } = useGLTF('/models/artismi_scene.glb')
  const cloned = useMemo(() => scene.clone(true), [scene])

  const hoveredObject     = useStore(s => s.hoveredObject)
  const setHoveredObject  = useStore(s => s.setHoveredObject)
  const cinematicPlaying  = useStore(s => s.cinematicPlaying)
  const setCinematicPlaying = useStore(s => s.setCinematicPlaying)
  const activeOverlay     = useStore(s => s.activeOverlay)

  /* Nasconde paesaggio al primo mount */
  useEffect(() => {
    cloned.traverse(obj => {
      if (LANDSCAPE_RE.test(obj.name)) {
        obj.visible = false
      }
    })
  }, [cloned])

  /* Emissive glow su mesh hoverata */
  useEffect(() => {
    cloned.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const hotspotName = resolveHotspot(mesh)
      if (!hotspotName) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach(m => {
        if (m && 'emissive' in m) {
          const mat = m as THREE.MeshStandardMaterial
          if (hoveredObject === hotspotName) {
            mat.emissive.set('#4A2060')
            mat.emissiveIntensity = 0.35
          } else {
            mat.emissive.set('#000000')
            mat.emissiveIntensity = 0
          }
        }
      })
    })
  }, [hoveredObject, cloned])

  return (
    <group>
      <primitive
        object={cloned}
        onPointerOver={(e: any) => {
          e.stopPropagation()
          const name = resolveHotspot(e.object)
          if (name) {
            setHoveredObject(name)
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          setHoveredObject(null)
          document.body.style.cursor = 'default'
        }}
        onClick={(e: any) => {
          e.stopPropagation()
          if (cinematicPlaying || activeOverlay) return
          const name = resolveHotspot(e.object)
          if (!name) return
          const seqId = SECTION_TO_ENTER[HOTSPOT_MAP[name]?.section ?? '']
          if (seqId) setCinematicPlaying(seqId)
        }}
      />

      {/* Label 3D per ogni hotspot */}
      {SCENE_HOTSPOTS.map(h => (
        <HotspotLabel
          key={h.meshName}
          label={h.label}
          position={h.labelPos as [number, number, number]}
          isHovered={hoveredObject === h.meshName}
        />
      ))}

      {/* Point lights sugli hotspot — si accendono all'hover */}
      {SCENE_HOTSPOTS.map(h => (
        <HotspotLight
          key={h.meshName + '_light'}
          position={h.labelPos as [number, number, number]}
          isHovered={hoveredObject === h.meshName}
        />
      ))}
    </group>
  )
}

/* ─── Label HTML billboard ───────────────────────────────────────────────── */
function HotspotLabel({
  label,
  position,
  isHovered,
}: {
  label: string
  position: [number, number, number]
  isHovered: boolean
}) {
  return (
    <Html
      position={position}
      center
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        opacity: isHovered ? 1 : 0,
        transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.92)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: '2.8rem',
        fontWeight: 400,
        letterSpacing: '0.12em',
        color: '#F2EDE4',
        textShadow: `
          0 0 12px rgba(232,168,191,0.9),
          0 0 30px rgba(232,168,191,0.6),
          0 0 60px rgba(157,212,238,0.4)
        `,
      }}>
        {label}
      </span>
    </Html>
  )
}

/* ─── Luce puntiforme animata on-hover ───────────────────────────────────── */
function HotspotLight({
  position,
  isHovered,
}: {
  position: [number, number, number]
  isHovered: boolean
}) {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame((_, delta) => {
    if (!lightRef.current) return
    const target = isHovered ? 2.5 : 0
    lightRef.current.intensity += (target - lightRef.current.intensity) * Math.min(1, delta * 8)
  })

  return (
    <pointLight
      ref={lightRef}
      position={[position[0], position[1] + 0.5, position[2] + 1]}
      color="#E8A8BF"
      intensity={0}
      distance={4}
      decay={2}
    />
  )
}

useGLTF.preload('/models/artismi_scene.glb')
