'use client'

/**
 * useCameraPath — esegue una CinematicSequence dal registro TRANSITIONS.
 *
 * Uso:
 *   const { play } = useCameraPath()
 *   play('toolbox_enter')   // avvia la sequenza
 *
 * Il hook legge la sequenza frame-by-frame in useFrame, interpola
 * posizione / lookAt / FOV della camera e triggera i side-effect
 * (overlay, flash, ecc.) nei keyframe attraversati.
 */

import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '@/stores/useStore'
import { TRANSITIONS, applyEasing } from '@/lib/cinematicTransitions'
import type { CinematicSequence, CinematicKeyframe } from '@/lib/cinematicTransitions'
import * as THREE from 'three'

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export function useCameraPath() {
  const seqRef      = useRef<CinematicSequence | null>(null)
  const startRef    = useRef(0)
  const activeRef   = useRef(false)
  const prevTRef    = useRef(0)
  const lookAt      = useRef(new THREE.Vector3())

  const play = useCallback((seqId: string) => {
    const seq = TRANSITIONS[seqId]
    if (!seq) { console.warn('[useCameraPath] sequenza non trovata:', seqId); return }
    seqRef.current  = seq
    startRef.current  = performance.now()
    activeRef.current = true
    prevTRef.current  = 0
    useStore.getState().setCinematicPlaying(seqId)
  }, [])

  useFrame(({ camera }) => {
    if (!activeRef.current || !seqRef.current) return

    const seq     = seqRef.current
    const elapsed = (performance.now() - startRef.current) / 1000
    const t       = Math.min(1, elapsed / seq.duration)
    const kfs     = seq.keyframes

    /* ── Trova camPrev / camNext con dati camera ── */
    let camPrev: CinematicKeyframe | undefined
    let camNext: CinematicKeyframe | undefined

    for (let i = 0; i < kfs.length; i++) {
      if (kfs[i].camera && kfs[i].t <= t) camPrev = kfs[i]
    }
    for (let i = kfs.length - 1; i >= 0; i--) {
      if (kfs[i].camera && kfs[i].t >= t) { camNext = kfs[i]; break }
    }

    /* ── Interpola camera ── */
    if (camPrev?.camera && camNext?.camera) {
      const span   = Math.max(camNext.t - camPrev.t, 0.001)
      const localT = Math.max(0, Math.min(1, (t - camPrev.t) / span))
      const eased  = applyEasing(localT, camNext.easing ?? 'expo')

      camera.position.lerpVectors(camPrev.camera.pos, camNext.camera.pos, eased)
      lookAt.current.lerpVectors(camPrev.camera.target, camNext.camera.target, eased)
      camera.lookAt(lookAt.current)
      ;(camera as THREE.PerspectiveCamera).fov = lerp(
        camPrev.camera.fov ?? 35,
        camNext.camera.fov ?? 35,
        eased,
      )
      ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    }

    /* ── Side-effect: keyframe attraversati in questo frame ── */
    const prevT = prevTRef.current
    for (const kf of kfs) {
      if (kf.t > prevT && kf.t <= t) {
        if (kf.overlay?.state === 'visible') {
          useStore.getState().setActiveOverlay(kf.overlay.target as any)
        }
        if (kf.overlay?.state === 'exit') {
          useStore.getState().setActiveOverlay(null)
        }
      }
    }
    prevTRef.current = t

    /* ── Fine sequenza ── */
    if (t >= 1) {
      activeRef.current = false
      const store = useStore.getState()
      store.setCinematicPlaying(null)
      store.setCameraState(seq.endState)
    }
  })

  return { play, isActive: () => activeRef.current }
}
