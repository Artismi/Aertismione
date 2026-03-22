'use client'

import { useRef, useState, useCallback } from 'react'
import styles from './MapViewer.module.css'

interface Props {
  src: string
  accent: string
  onImageClick?: (src: string) => void
}

export function MapViewer({ src, accent, onImageClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  const clamp = (ox: number, oy: number, s: number) => {
    const el = containerRef.current
    if (!el) return { x: ox, y: oy }
    const maxX = (el.clientWidth * (s - 1)) / 2
    const maxY = (el.clientHeight * (s - 1)) / 2
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    }
  }

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale(s => {
      const next = Math.max(1, Math.min(6, s - e.deltaY * 0.005))
      setOffset(o => clamp(o.x, o.y, next))
      return next
    })
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) { onImageClick?.(src); return }
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setOffset(clamp(dragStart.current.ox + dx, dragStart.current.oy + dy, scale))
  }

  const onPointerUp = () => setDragging(false)

  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }) }

  return (
    <div className={styles.wrap}>
      <div
        ref={containerRef}
        className={styles.container}
        style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={reset}
      >
        <img
          src={src}
          alt=""
          className={styles.img}
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          }}
          draggable={false}
        />
      </div>

      <div className={styles.hud}>
        <button className={styles.resetBtn} onClick={reset} style={{ borderColor: accent }}>
          ↺ reset
        </button>
        <span className={styles.zoom} style={{ color: accent }}>
          {Math.round(scale * 100)}%
        </span>
        <span className={styles.hint}>scroll → zoom &nbsp;·&nbsp; doppio click → reset</span>
      </div>
    </div>
  )
}
