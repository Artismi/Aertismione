'use client'

/**
 * Il banco visto dalla bilia. La bilia e' una sola e la disegna e la muove la
 * pagina (MarblePage), banco compreso: qui non c'e' piu' una sfera 3D. Il 3D le
 * dice soltanto dove sono le cose sullo schermo, a ogni suo fotogramma:
 *
 * - il fascicolo e il Game Boy, come ostacoli: la loro base all'altezza del
 *   centro della bilia, in coordinate della pagina (il banco scorre con lei);
 * - il pallino della i del logo, il tabellone del fascicolo aperto (dove sta la
 *   bilia e il centro), sopra il Game Boy e dove se ne scende.
 *
 * E tiene la pagina al corrente del fascicolo e del Game Boy (marble.phase, grab).
 */

import { useEffect, useMemo, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { marble, type Spot, type Quad } from './marble'
import { FW, FD, BW, BD, BOARD_Y, MOBILE_Z } from './Folder3D'
import { consoleBase, consoleTop } from './Console3D'
import type { TablePhase } from './Table3D'

/** raggio della bilia nel mondo, per l'altezza a cui si misurano gli ostacoli */
export const MARBLE_R = 0.125

type Box = { x: number; z: number; hx: number; hz: number; ry: number }

/** il fascicolo chiuso e la base del Game Boy, sul banco (vedi Folder3D e Console3D) */
function obstacles(mobile: boolean): { folder: Box; console: Box } {
  return mobile
    ? { folder: { x: 0, z: MOBILE_Z, hx: FW / 2, hz: FD / 2, ry: 0 }, console: consoleBase(true) }
    : { folder: { x: -1.55, z: 0.05, hx: FW / 2, hz: FD / 2, ry: 0.07 }, console: consoleBase(false) }
}

export function Marble3D({ phase, mobile, grab, stage, hover, onConsole }: {
  phase: TablePhase
  mobile: boolean
  grab: boolean
  stage: RefObject<HTMLDivElement | null>
  /** il mouse e' sul fascicolo o sul Game Boy: il clic e' loro */
  hover: RefObject<{ folder: boolean; console: boolean }>
  /** la bilia e' atterrata sul Game Boy: si accende */
  onConsole: () => void
}) {
  const { camera, invalidate } = useThree()
  const k = useMemo(() => ({ p: new THREE.Vector3(), q: new THREE.Vector3(), s: new THREE.Vector3() }), [])

  useEffect(() => {
    marble.invalidate = invalidate
    marble.stage = stage.current
    marble.hover = hover.current
    return () => { marble.invalidate = null; marble.stage = null; marble.hover = null }
  }, [invalidate, stage, hover])
  useEffect(() => { marble.onConsole = onConsole }, [onConsole])
  useEffect(() => {
    marble.phase = phase
    marble.grab = grab
    invalidate()
  }, [phase, grab, invalidate])
  useEffect(() => () => { marble.obstacles.folder = marble.obstacles.console = null }, [])

  /** dove cade sullo schermo un punto del mondo, e quanto e' grande li' un raggio r */
  function toScreen(p: THREE.Vector3, r: number, out: Spot) {
    const w = window.innerWidth, h = window.innerHeight
    k.q.copy(p).project(camera)
    out.x = (k.q.x + 1) / 2 * w
    out.y = (1 - k.q.y) / 2 * h
    k.q.copy(p).addScaledVector(camera.up, r).project(camera)
    out.r = Math.abs((1 - k.q.y) / 2 * h - out.y)
    out.ok = true
  }

  /** la base di una scatola sul banco, all'altezza del centro della bilia, in coordinate della pagina */
  function quad(b: Box): Quad {
    const c = Math.cos(b.ry), s = Math.sin(b.ry)
    const w = window.innerWidth, h = window.innerHeight, sy = window.scrollY
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, d]) => {
      const lx = a * b.hx, lz = d * b.hz
      k.q.set(b.x + lx * c + lz * s, MARBLE_R, b.z - lx * s + lz * c).project(camera)
      return { x: (k.q.x + 1) / 2 * w, y: (1 - k.q.y) / 2 * h + sy }
    })
  }

  useFrame(() => {
    // il pallino della i del logo
    const lb = marble.logoBall
    if (lb) {
      lb.getWorldPosition(k.p)
      lb.getWorldScale(k.s)
      toScreen(k.p, ((lb as THREE.Mesh).geometry as THREE.SphereGeometry).parameters.radius * k.s.x, marble.logoAt)
      lb.visible = marble.mode === 'logo'
    }

    const o = obstacles(mobile)
    const zc = mobile ? MOBILE_Z : 0
    // il tabellone: il centro, e dove sta la bilia (scritto dalla mappa)
    toScreen(k.p.set(0, BOARD_Y + MARBLE_R, zc), MARBLE_R, marble.boardMid)
    const b = marble.board
    toScreen(k.p.set((b.u - 0.5) * BW, BOARD_Y + MARBLE_R + b.lift * BW, zc + (b.v - 0.5) * BD), MARBLE_R, marble.boardAt)
    // sopra il Game Boy, al centro della faccia inclinata; e un passo a sinistra, per scenderne
    const cb = o.console, top = consoleTop(mobile), side = cb.hx + 0.32
    toScreen(k.p.set(cb.x + top.fwd * Math.sin(cb.ry), top.y + MARBLE_R, cb.z + top.fwd * Math.cos(cb.ry)), MARBLE_R, marble.consoleAt)
    toScreen(k.p.set(cb.x - Math.cos(cb.ry) * side, MARBLE_R, cb.z + Math.sin(cb.ry) * side + top.fwd * Math.cos(cb.ry)), MARBLE_R, marble.consoleOut)

    // gli ostacoli: a fascicolo chiuso e con il Game Boy sul banco
    const closed = phase === 'closed'
    marble.obstacles.folder = closed ? quad(o.folder) : null
    marble.obstacles.console = closed && !grab ? quad(o.console) : null
  })

  return null
}
