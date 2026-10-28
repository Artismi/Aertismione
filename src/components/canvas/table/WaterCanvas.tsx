'use client'

/**
 * L'acqua rosata dietro a tutto, su un canvas suo: un triangolo che copre lo
 * schermo e lo shader della piscina (waterFragment), niente three.js. Costa un
 * passaggio solo, quindi puo' muoversi sempre: 30 volte al secondo e a ogni
 * scroll. Il mondo 3D sta sopra, trasparente dove non c'e' niente, e si
 * ridisegna solo quando cambia qualcosa.
 *
 * I valori (tempo, scroll, scala, logo) sono gli stessi che usa il vetro del
 * logo (water, in WorldBackdrop): quello che si vede attraverso il vetro e
 * quello che si vede intorno combaciano.
 */

import { useEffect, useRef } from 'react'
import { useStore } from '@/stores/useStore'
import { water, waterFragment, waterScale, neutralAt } from './WorldBackdrop'
import { logoSeen } from './shared'

const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'
/** l'acqua e' morbida: oltre una volta e mezza i pixel dello schermo non si vede differenza */
const MAX_DPR = 1.5
const FRAME_MS = 1000 / 30

export function WaterCanvas({ mobile }: { mobile: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const gl = canvas?.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' })
    if (!canvas || !gl) return

    const shader = (type: number, src: string) => {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      return sh
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, waterFragment))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('acqua:', gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u = (n: string) => gl.getUniformLocation(prog, n)
    const U = {
      time: u('u_time'), fade: u('u_fade'), white: u('u_white'), res: u('u_res'),
      scroll: u('u_scroll'), scale: u('u_scale'), logo: u('u_logo'), px: u('u_px'),
      neutral: u('u_neutral'),
    }

    let w = 0, h = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : MAX_DPR)
      w = window.innerWidth; h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      dirty = true
    }

    const t0 = performance.now()
    let raf = 0, last = 0, dirty = true, lastScroll = -1
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const st = useStore.getState()
      if (document.hidden || st.gameOpen || st.away) return
      const y = window.scrollY
      // si muove a 30 fotogrammi al secondo, e subito quando la pagina scorre
      if (!dirty && y === lastScroll && now - last < FRAME_MS) return
      dirty = false; last = now; lastScroll = y

      water.u_time.value = (now - t0) / 1000
      water.u_res.value.set(w, h)
      waterScale(w, h, water.u_scale.value)
      water.u_scroll.value = y / Math.max(1, h) * 0.12
      water.u_neutral.value = neutralAt(y, h)
      const L = water.u_logo.value
      gl.uniform1f(U.time, water.u_time.value)
      gl.uniform1f(U.fade, water.u_fade.value)
      gl.uniform1f(U.white, water.u_white.value)
      gl.uniform2f(U.res, w, h)
      gl.uniform1f(U.scroll, water.u_scroll.value)
      gl.uniform2f(U.scale, water.u_scale.value.x, water.u_scale.value.y)
      // il logo sale con la pagina: dall'ultima volta che il 3D l'ha misurato si sposta di quanto e' scorsa
      gl.uniform4f(U.logo, L.x, L.y + (y - logoSeen.scroll) / Math.max(1, h), L.z, L.w)
      gl.uniform2f(U.px, canvas.width, canvas.height)
      gl.uniform1f(U.neutral, water.u_neutral.value)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [mobile])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
