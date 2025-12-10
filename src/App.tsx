import { useEffect, useRef, useState } from 'react'
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
  const [visitorCount] = useState(7886)
  const [drawMode, setDrawMode] = useState<'particles' | 'circle'>('particles')

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
      const colors = ['#00FFFF', '#00FF00', '#FF6600', '#FFFF00', '#FF00FF']

      if (drawMode === 'particles') {
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2
          const velocity = 1 + Math.random() * 2
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
    }

    const handleMouseDown = () => {
      if (drawMode === 'circle') {
        const colors = ['#00FFFF', '#00FF00', '#FF6600', '#FFFF00', '#FF00FF']
        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          vx: 0,
          vy: 0,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)

    const animate = () => {
      // Clear canvas with fade
      ctx.fillStyle = 'rgba(11, 20, 80, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p: Particle) => p.life > 0)

      particlesRef.current.forEach((particle: Particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.08
        particle.life -= 0.015

        const alpha = particle.life
        const hex = particle.color.substring(1)
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`

        const size = 6 + Math.random() * 4
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size * Math.max(0.3, particle.life), 0, Math.PI * 2)
        ctx.fill()

        // Glow effect
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size * Math.max(0.3, particle.life) + 3, 0, Math.PI * 2)
        ctx.stroke()
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
  }, [drawMode])

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'rgb(11, 20, 80)'
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
    particlesRef.current = []
  }

  return (
    <div className="container">
      <div className="banner">
        <span className="banner-text">Welcome to my AWESOME homepage! This site is under construction! Come back soon for more cool stuff! Sign my guestbook!</span>
      </div>
      <canvas ref={canvasRef} className="canvas" />
      
      <div className="info-box">
        <h1 className="title">Rainbow Cursor!</h1>
        <p className="instruction">Move your mouse around!</p>
        <div className="visitor-info">
          <span className="visitor-label">You are visitor #</span>
          <span className="visitor-number">{visitorCount}</span>
          <div className="visitor-dot"></div>
        </div>
        <button className="guestbook-btn">Click me to sign the guestbook!</button>
      </div>

      <div className="center-text">Move your mouse!</div>

      <div className="controls">
        <button className="btn btn-clear" onClick={clearCanvas}>Clear</button>
        <button className="btn btn-circle" onClick={() => setDrawMode(drawMode === 'circle' ? 'particles' : 'circle')}>
          circle
        </button>
        <button className="btn btn-settings">Settings</button>
      </div>

      <div className="netscape-box">
        <span>Best viewed in Netscape Navigator 4.0</span>
        <div className="color-squares">
          <div className="square red"></div>
          <div className="square yellow"></div>
          <div className="square green"></div>
          <div className="square magenta"></div>
          <div className="square blue"></div>
          <div className="square cyan"></div>
        </div>
      </div>

      <div className="footer">Made with Microsoft FrontPage</div>
    </div>
  )
}
