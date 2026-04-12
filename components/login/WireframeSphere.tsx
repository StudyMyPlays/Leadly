"use client"

import { useEffect, useRef } from "react"

export default function WireframeSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf: number
    let angle = 0

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const RADIUS = Math.min(window.innerWidth, window.innerHeight) * 0.28
    const LAT_LINES  = 10
    const LON_LINES  = 14
    const POINT_COUNT = 120

    // Project 3D point to 2D
    function project(x: number, y: number, z: number, cx: number, cy: number) {
      const fov = 600
      const scale = fov / (fov + z)
      return { x: cx + x * scale, y: cy + y * scale, alpha: (z / RADIUS + 1) / 2 }
    }

    // Rotate point around Y-axis
    function rotateY(x: number, z: number, a: number) {
      return {
        x: x * Math.cos(a) - z * Math.sin(a),
        z: x * Math.sin(a) + z * Math.cos(a),
      }
    }

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const cx = canvas.width  / 2
      const cy = canvas.height / 2

      // Draw latitude circles
      for (let i = 1; i < LAT_LINES; i++) {
        const phi = (Math.PI * i) / LAT_LINES
        const r   = RADIUS * Math.sin(phi)
        const y   = RADIUS * Math.cos(phi)

        ctx.beginPath()
        let first = true
        for (let seg = 0; seg <= 64; seg++) {
          const theta = (2 * Math.PI * seg) / 64
          let px = r * Math.cos(theta)
          const pz = r * Math.sin(theta)
          const rot = rotateY(px, pz, angle)
          px = rot.x
          const { x: sx, y: sy, alpha } = project(px, -y, rot.z, cx, cy)
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.35})`
          if (first) { ctx.moveTo(sx, sy); first = false } else ctx.lineTo(sx, sy)
        }
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Draw longitude lines
      for (let j = 0; j < LON_LINES; j++) {
        const theta = (2 * Math.PI * j) / LON_LINES
        ctx.beginPath()
        let first = true
        for (let seg = 0; seg <= 48; seg++) {
          const phi = (Math.PI * seg) / 48
          let px = RADIUS * Math.sin(phi) * Math.cos(theta)
          const py = RADIUS * Math.cos(phi)
          const pz = RADIUS * Math.sin(phi) * Math.sin(theta)
          const rot = rotateY(px, pz, angle)
          px = rot.x
          const { x: sx, y: sy, alpha } = project(px, -py, rot.z, cx, cy)
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha * 0.25})`
          if (first) { ctx.moveTo(sx, sy); first = false } else ctx.lineTo(sx, sy)
        }
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Draw floating dot nodes at intersections
      for (let i = 0; i < POINT_COUNT; i++) {
        const phi   = Math.acos(-1 + (2 * i) / POINT_COUNT)
        const theta = Math.sqrt(POINT_COUNT * Math.PI) * phi
        let px = RADIUS * Math.sin(phi) * Math.cos(theta)
        const py = RADIUS * Math.cos(phi)
        const pz = RADIUS * Math.sin(phi) * Math.sin(theta)
        const rot = rotateY(px, pz, angle)
        px = rot.x
        const { x: sx, y: sy, alpha } = project(px, -py, rot.z, cx, cy)
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
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.75 }}
    />
  )
}
