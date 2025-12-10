import { useEffect, useRef } from 'react'
import './App.css'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }

      // Create particles at mouse position
      const colors = [
        '#FF006E',
        '#FB5607',
        '#FFBE0B',
        '#8338EC',
        '#3A86FF',
        '#06FFA5',
      ]

      for (let i = 0; i < 3; i++) {
        const angle = (Math.random() * Math.PI * 2)
        const velocity = 2 + Math.random() * 3
        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }

    const handleMouseDown = () => {
      const colors = [
        '#FF006E',
        '#FB5607',
        '#FFBE0B',
        '#8338EC',
        '#3A86FF',
        '#06FFA5',
      ]

      // Burst of particles
      for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2
        const velocity = 4 + Math.random() * 3
        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)

    const animate = () => {
      // Clear canvas with slight fade
      ctx.fillStyle = 'rgba(10, 10, 20, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p: Particle) => p.life > 0)

      particlesRef.current.forEach((particle: Particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.1 // gravity
        particle.life -= 0.02

        const alpha = particle.life
        ctx.fillStyle = particle.color.replace(')', `, ${alpha})`)
          .replace('rgb', 'rgba')

        // If it's hex, convert to rgba
        if (particle.color.startsWith('#')) {
          const hex = particle.color.substring(1)
          const r = parseInt(hex.substring(0, 2), 16)
          const g = parseInt(hex.substring(2, 4), 16)
          const b = parseInt(hex.substring(4, 6), 16)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        }

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 4 * Math.max(0, particle.life), 0, Math.PI * 2)
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="container">
      <canvas ref={canvasRef} className="canvas" />
      <div className="ui">
        <h1>Rainbow Trail</h1>
        <p>Move your mouse and click to create particle trails</p>
      </div>
    </div>
  )
}
