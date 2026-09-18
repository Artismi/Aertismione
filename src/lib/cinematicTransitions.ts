/**
 * ============================================================
 *  Cinematic transitions — sequenze camera dichiarative
 * ============================================================
 *
 *  Ogni hotspot della scena 3D ha la sua sequenza unica:
 *  movimento camera + animazione oggetto + apparizione overlay.
 *
 *  Le sequenze sono dati (timeline keyframe) leggibili e modificabili
 *  senza toccare la logica di esecuzione (vedi src/hooks/useCameraPath.ts).
 *
 *  Coordinate world space coerenti con la scena Blender:
 *  - Y negativo = verso la camera (foreground)
 *  - Z positivo = verso l'alto
 *  - X positivo = verso destra
 * ============================================================
 */

import { Vector3 } from 'three'
import type { CameraState } from '@/stores/useStore'

const V = (x: number, y: number, z: number) => new Vector3(x, y, z)

/* ─── Camera positions di base (stato statico) ────────────────────────── */
export const CAMERA_POSITIONS: Record<CameraState, { pos: Vector3; target: Vector3; fov: number }> = {
  logo:      { pos: V(14.5, -18.0,  8.5), target: V(14.5, -12.0, 6.5), fov: 35 },
  hub:       { pos: V(14.5, -24.0,  4.2), target: V(14.5, -12.0, 1.2), fov: 35 },
  portfolio: { pos: V(11.8, -13.0,  5.5), target: V(11.8, -13.0, 0.42), fov: 42 },
  about:     { pos: V(16.0, -16.0,  2.0), target: V(15.0, -11.5, 1.4), fov: 32 },
  servizi:   { pos: V(10.5, -19.0,  1.8), target: V(10.5, -15.5, 0.5), fov: 28 },
  lab:       { pos: V(17.8, -15.0,  1.6), target: V(17.8, -13.5, 1.1), fov: 25 },
  contatti:  { pos: V(18.8,  -7.0,  2.0), target: V(18.8,  -3.0, 1.5), fov: 35 },
}

/* ─── Cinematic keyframe type ─────────────────────────────────────────── */

export type Easing = 'linear' | 'expo' | 'easeInOut' | 'easeOutBack'

export type CinematicKeyframe = {
  /** Tempo normalizzato 0-1 della sequenza */
  t: number
  /** Posizione/target/FOV camera per questo keyframe */
  camera?: { pos: Vector3; target: Vector3; fov: number }
  /** Clip animazione da avviare sull'avatar */
  avatarAction?: string
  /** Animazione su una mesh specifica (es. apertura coperchio toolbox) */
  objectAction?: {
    name: string
    property: 'rotationX' | 'rotationY' | 'rotationZ' | 'emissiveIntensity' | 'opacity'
    value: number
  }
  /** Stato overlay (enter/visible/exit) */
  overlay?: {
    target: 'portfolio' | 'about' | 'servizi' | 'lab' | 'contatti'
    state: 'enter' | 'visible' | 'exit'
  }
  /** Flash fullscreen lampo */
  flash?: { color: string; opacity: number }
  /** Attiva un sistema di particelle */
  particles?: { name: string; intensity: number }
  /** Easing per il segmento dal keyframe PRECEDENTE a questo */
  easing?: Easing
}

export type CinematicSequence = {
  id: string
  duration: number         // secondi totali
  endState: CameraState    // stato camera al termine della sequenza
  keyframes: CinematicKeyframe[]
}

/* ─── Le 5 sequenze "enter" + 5 "exit" ────────────────────────────────── */

export const TRANSITIONS: Record<string, CinematicSequence> = {

  /* ────────── 🔧 TOOLBOX → SERVIZI (1.6s) ────────── */
  toolbox_enter: {
    id: 'toolbox_enter',
    duration: 1.6,
    endState: 'servizi',
    keyframes: [
      { t: 0.00, camera: { pos: V(14.5,-24,4.2),    target: V(14.5,-12,1.2),    fov: 35 } },
      { t: 0.31, camera: { pos: V(10.5,-19,1.8),    target: V(10.5,-15.5,0.5),  fov: 28 }, easing: 'expo' },
      { t: 0.31, objectAction: { name: 'ToolboxLid', property: 'rotationX', value: -1.92 } }, // -110°
      { t: 0.44, particles: { name: 'ToolboxEmerge', intensity: 1 } },
      { t: 0.75, overlay: { target: 'servizi', state: 'enter' } },
      { t: 1.00, camera: { pos: V(10.5,-19,1.8),    target: V(10.5,-15.5,0.5),  fov: 28 },
                 overlay: { target: 'servizi', state: 'visible' }, easing: 'easeInOut' },
    ],
  },

  /* ────────── 🎱 BILIARDO → PROGETTI (1.4s) ────────── */
  billiard_enter: {
    id: 'billiard_enter',
    duration: 1.4,
    endState: 'portfolio',
    keyframes: [
      { t: 0.00, camera: { pos: V(14.5,-24,4.2),    target: V(14.5,-12,1.2),    fov: 35 } },
      { t: 0.21, camera: { pos: V(11.8,-13,5.5),    target: V(11.8,-13,3.0),    fov: 38 } },
      { t: 0.29, avatarAction: 'jump_table' },
      { t: 0.50, camera: { pos: V(11.8,-13,5.5),    target: V(11.8,-13,0.42),   fov: 42 }, easing: 'expo' },
      { t: 0.50, particles: { name: 'BilliardNodes', intensity: 1 } },
      { t: 0.85, overlay: { target: 'portfolio', state: 'visible' } },
      { t: 1.00, camera: { pos: V(11.8,-13,5.5),    target: V(11.8,-13,0.42),   fov: 42 }, easing: 'easeInOut' },
    ],
  },

  /* ────────── 👤 AVATAR → CHI SONO (1.8s) ────────── */
  avatar_enter: {
    id: 'avatar_enter',
    duration: 1.8,
    endState: 'about',
    keyframes: [
      { t: 0.00, camera: { pos: V(14.5,-24,4.2),    target: V(14.5,-12,1.2),    fov: 35 } },
      { t: 0.00, avatarAction: 'sit_to_stand' },
      { t: 0.44, camera: { pos: V(16.0,-16.0,2.0),  target: V(15.0,-11.5,1.4),  fov: 32 }, easing: 'expo' },
      { t: 0.55, avatarAction: 'idle_address' },
      { t: 0.77, overlay: { target: 'about', state: 'enter' } },
      { t: 1.00, camera: { pos: V(16.0,-16.0,2.0),  target: V(15.0,-11.5,1.4),  fov: 32 },
                 overlay: { target: 'about', state: 'visible' }, easing: 'easeInOut' },
    ],
  },

  /* ────────── 💻 TERMINAL → LAB (2.2s) — LA PIÙ TEATRALE ────────── */
  terminal_enter: {
    id: 'terminal_enter',
    duration: 2.2,
    endState: 'lab',
    keyframes: [
      { t: 0.00, camera: { pos: V(14.5,-24,4.2),    target: V(14.5,-12,1.2),    fov: 35 } },
      { t: 0.00, objectAction: { name: 'TerminalScreen', property: 'emissiveIntensity', value: 0.2 } },
      { t: 0.18, objectAction: { name: 'TerminalScreen', property: 'emissiveIntensity', value: 1.0 } }, // boot
      { t: 0.41, camera: { pos: V(17.8,-15.0,1.6),  target: V(17.8,-13.5,1.1),  fov: 25 }, easing: 'expo' },
      { t: 0.59, particles: { name: 'CRTBootText', intensity: 1 } },
      { t: 0.81, camera: { pos: V(17.8,-13.8,1.1),  target: V(17.8,-13.5,1.1),  fov: 20 }, easing: 'easeInOut' },
      { t: 0.82, flash: { color: '#5BFF6A', opacity: 0.3 } },
      { t: 0.85, overlay: { target: 'lab', state: 'enter' } },
      { t: 1.00, overlay: { target: 'lab', state: 'visible' } },
    ],
  },

  /* ────────── ⛩️ PORTAL → CONTATTI (1.8s) ────────── */
  portal_enter: {
    id: 'portal_enter',
    duration: 1.8,
    endState: 'contatti',
    keyframes: [
      { t: 0.00, camera: { pos: V(14.5,-24,4.2),    target: V(14.5,-12,1.2),    fov: 35 } },
      { t: 0.28, camera: { pos: V(18.8,-14.0,3.0),  target: V(18.8,-8.0,2.0),   fov: 35 }, easing: 'expo' },
      { t: 0.28, objectAction: { name: 'Portal', property: 'emissiveIntensity', value: 0.4 } },
      { t: 0.28, particles: { name: 'PortalSparkles', intensity: 1 } },
      { t: 0.56, camera: { pos: V(18.8,-11.0,2.5),  target: V(18.8,-7.0,2.0),   fov: 50 }, easing: 'easeInOut' },
      { t: 0.61, flash: { color: '#ffffff', opacity: 0.8 } },
      { t: 0.78, camera: { pos: V(18.8, -7.0,2.0),  target: V(18.8,-3.0,1.5),   fov: 35 } },
      { t: 0.89, overlay: { target: 'contatti', state: 'enter' } },
      { t: 1.00, overlay: { target: 'contatti', state: 'visible' } },
    ],
  },

  /* ────────── EXIT sequences (return to hub) ────────── */

  toolbox_exit: {
    id: 'toolbox_exit',
    duration: 1.2,
    endState: 'hub',
    keyframes: [
      { t: 0.00, overlay: { target: 'servizi', state: 'exit' } },
      { t: 0.42, objectAction: { name: 'ToolboxLid', property: 'rotationX', value: 0 } },
      { t: 1.00, camera: { pos: V(14.5,-24,4.2),    target: V(14.5,-12,1.2),    fov: 35 }, easing: 'easeInOut' },
    ],
  },

  billiard_exit: {
    id: 'billiard_exit',
    duration: 1.0,
    endState: 'hub',
    keyframes: [
      { t: 0.00, overlay: { target: 'portfolio', state: 'exit' } },
      { t: 1.00, camera: { pos: V(14.5,-24,4.2),    target: V(14.5,-12,1.2),    fov: 35 }, easing: 'easeInOut' },
    ],
  },

  avatar_exit: {
    id: 'avatar_exit',
    duration: 1.5,
    endState: 'hub',
    keyframes: [
      { t: 0.00, overlay: { target: 'about', state: 'exit' } },
      { t: 0.20, avatarAction: 'stand_to_sit' },
      { t: 1.00, camera: { pos: V(14.5,-24,4.2),    target: V(14.5,-12,1.2),    fov: 35 }, easing: 'easeInOut' },
    ],
  },

  terminal_exit: {
    id: 'terminal_exit',
    duration: 1.0,
    endState: 'hub',
    keyframes: [
      { t: 0.00, overlay: { target: 'lab', state: 'exit' } },
      { t: 0.30, objectAction: { name: 'TerminalScreen', property: 'emissiveIntensity', value: 0 } },
      { t: 1.00, camera: { pos: V(14.5,-24,4.2),    target: V(14.5,-12,1.2),    fov: 35 }, easing: 'easeInOut' },
    ],
  },

  portal_exit: {
    id: 'portal_exit',
    duration: 1.5,
    endState: 'hub',
    keyframes: [
      { t: 0.00, overlay: { target: 'contatti', state: 'exit' } },
      { t: 0.40, flash: { color: '#ffffff', opacity: 0.6 } },
      { t: 0.60, objectAction: { name: 'Portal', property: 'emissiveIntensity', value: 0 } },
      { t: 1.00, camera: { pos: V(14.5,-24,4.2),    target: V(14.5,-12,1.2),    fov: 35 }, easing: 'easeInOut' },
    ],
  },
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

/** Mappa: section name → cinematic id (enter) */
export const SECTION_TO_ENTER: Record<string, string> = {
  servizi:   'toolbox_enter',
  portfolio: 'billiard_enter',
  about:     'avatar_enter',
  lab:       'terminal_enter',
  contatti:  'portal_enter',
}

/** Mappa: section name → cinematic id (exit) */
export const SECTION_TO_EXIT: Record<string, string> = {
  servizi:   'toolbox_exit',
  portfolio: 'billiard_exit',
  about:     'avatar_exit',
  lab:       'terminal_exit',
  contatti:  'portal_exit',
}

/** Applica easing function */
export function applyEasing(t: number, easing: Easing = 'expo'): number {
  switch (easing) {
    case 'linear':       return t
    case 'expo':         return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    case 'easeInOut':    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    case 'easeOutBack':  {
      const c1 = 1.70158, c3 = c1 + 1
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
    }
  }
}
