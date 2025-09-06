"use client"

import { useEffect, useRef, useState } from "react"

interface WebNode {
  x: number
  y: number
  originalX: number
  originalY: number
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      // Reset and set transform for crisp rendering on HiDPI screens
      if (typeof ctx.setTransform === "function") {
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
      } else {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      }
      setDimensions({ width: rect.width, height: rect.height })
    }

    updateSize()
    window.addEventListener("resize", updateSize)

    const gridSize = 80
    const nodes: WebNode[] = []

    // Calculate grid dimensions to center the grid
    const cols = Math.floor(dimensions.width / gridSize)
    const rows = Math.floor(dimensions.height / gridSize)
    const offsetX = (dimensions.width - (cols - 1) * gridSize) / 2
    const offsetY = (dimensions.height - (rows - 1) * gridSize) / 2

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * gridSize
        const y = offsetY + row * gridSize
        nodes.push({
          x,
          y,
          originalX: x,
          originalY: y,
        })
      }
    }

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    // Track mouse globally so the canvas doesn't block UI interactions
    window.addEventListener("mousemove", handleMouseMove)

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      nodes.forEach((node) => {
        const dx = mouseRef.current.x - node.originalX
        const dy = mouseRef.current.y - node.originalY
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Stretch effect - nodes move toward mouse with falloff
        const maxDistance = 200
        if (distance < maxDistance) {
          const force = ((maxDistance - distance) / maxDistance) * 0.3
          node.x = node.originalX + dx * force
          node.y = node.originalY + dy * force
        } else {
          // Return to original position
          node.x += (node.originalX - node.x) * 0.05
          node.y += (node.originalY - node.y) * 0.05
        }
      })

      nodes.forEach((node, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)

        // Draw horizontal connections (to the right)
        if (col < cols - 1) {
          const rightNode = nodes[i + 1]
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(rightNode.x, rightNode.y)
          ctx.stroke()
        }

        // Draw vertical connections (downward)
        if (row < rows - 1) {
          const bottomNode = nodes[i + cols]
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(bottomNode.x, bottomNode.y)
          ctx.stroke()
        }

        // Draw node
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
        ctx.beginPath()
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", updateSize)
      window.removeEventListener("mousemove", handleMouseMove)
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions.width, dimensions.height])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 w-full h-full pointer-events-none"
      style={{ background: "transparent" }}
    />
  )
}
