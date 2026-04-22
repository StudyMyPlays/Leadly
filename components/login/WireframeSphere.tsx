"use client"

import { useEffect, useRef } from "react"

/**
 * A rotating wireframe sphere rendered to a full-bleed canvas.
 * The canvas sizes itself to the nearest relatively-positioned ancestor
 * (whatever `absolute inset-0` resolves to) and re-scales on resize. We
 * account for devicePixelRatio so lines stay crisp on retina screens.
 */
export default function WireframeSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let angle = 0

    // Current CSS size (independent of DPR)
    let cssWidth = 0
    let cssHeight = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
      cssWidth = Math.max(1, rect.width)
      cssHeight = Math.max(1, rect.height)
      canvas.width = Math.round(cssWidth * dpr)
      canvas.height = Math.round(cssHeight * dpr)
      // Scale the context so 1 unit == 1 CSS pixel.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // React to viewport changes AND container size changes (e.g. browser
    // dev-tools open/close, font scaling, orientation changes).
    const onWinResize = () => resize()
    window.addEventListener("resize", onWinResize)

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => resize())
      : null
    ro?.observe(canvas)

    const LAT_LINES = 10
    const LON_LINES = 14
    const POINT_COUNT = 120

    function project(
      x: number,
      y: number,
      z: number,
      cx: number,
      cy: number,
      radius: number,
    ) {
      const fov = 600
      const scale = fov / (fov + z)
      return { x: cx + x * scale, y: cy + y * scale, alpha: (z / radius + 1) / 2 }
    }

    function rotateY(x: number, z: number, a: number) {
      return {
        x: x * Math.cos(a) - z * Math.sin(a),
        z: x * Math.sin(a) + z * Math.cos(a),
      }
    }

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, cssWidth, cssHeight)

      const cx = cssWidth / 2
      const cy = cssHeight / 2
      const radius = Math.min(cssWidth, cssHeight) * 0.28

      // Latitude circles
      for (let i = 1; i < LAT_LINES; i++) {
        const phi = (Math.PI * i) / LAT_LINES
        const r = radius * Math.sin(phi)
        const y = radius * Math.cos(phi)

        ctx.beginPath()
        let first = true
        for (let seg = 0; seg <= 64; seg++) {
          const theta = (2 * Math.PI * seg) / 64
          let px = r * Math.cos(theta)
          const pz = r * Math.sin(theta)
          const rot = rotateY(px, pz, angle)
          px = rot.x
          const { x: sx, y: sy, alpha } = project(px, -y, rot.z, cx, cy, radius)
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.35})`
          if (first) {
            ctx.moveTo(sx, sy)
            first = false
          } else {
            ctx.lineTo(sx, sy)
          }
        }
        ctx.lineWidth = 0.6
        ctx.stroke()
      }

      // Longitude lines
      for (let j = 0; j < LON_LINES; j++) {
        const theta = (2 * Math.PI * j) / LON_LINES
        ctx.beginPath()
        let first = true
        for (let seg = 0; seg <= 48; seg++) {
          const phi = (Math.PI * seg) / 48
          let px = radius * Math.sin(phi) * Math.cos(theta)
          const py = radius * Math.cos(phi)
          const pz = radius * Math.sin(phi) * Math.sin(theta)
          const rot = rotateY(px, pz, angle)
          px = rot.x
          const { x: sx, y: sy, alpha } = project(px, -py, rot.z, cx, cy, radius)
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha * 0.25})`
          if (first) {
            ctx.moveTo(sx, sy)
            first = false
          } else {
            ctx.lineTo(sx, sy)
          }
        }
        ctx.lineWidth = 0.6
        ctx.stroke()
      }

      // Floating nodes
      for (let i = 0; i < POINT_COUNT; i++) {
        const phi = Math.acos(-1 + (2 * i) / POINT_COUNT)
        const theta = Math.sqrt(POINT_COUNT * Math.PI) * phi
        let px = radius * Math.sin(phi) * Math.cos(theta)
        const py = radius * Math.cos(phi)
        const pz = radius * Math.sin(phi) * Math.sin(theta)
        const rot = rotateY(px, pz, angle)
        px = rot.x
        const { x: sx, y: sy, alpha } = project(px, -py, rot.z, cx, cy, radius)
        ctx.beginPath()
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(147, 197, 253, ${alpha * 0.55})`
        ctx.fill()
      }

      angle += 0.0028
      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onWinResize)
      ro?.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        width: "100%",
        height: "100%",
        opacity: 0.85,
      }}
    />
  )
}
