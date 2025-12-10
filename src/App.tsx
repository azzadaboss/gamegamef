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
  const [drawMode, setDrawMode] = useState<'circles' | 'squares' | 'stars' | 'hearts' | 'smileys'>('circles')
  const [showGuestbook, setShowGuestbook] = useState(false)
  const [guestbookEntries, setGuestbookEntries] = useState<Array<{ name: string; message: string; date: string }>>([
    { name: 'cooluser123', message: 'awesome site dude!', date: '12/10/2025' },
    { name: 'rainbowfan', message: 'love the rainbow cursor!', date: '12/09/2025' },
    { name: 'webmaster2000', message: 'check back soon for updates!', date: '12/08/2025' },
  ])
  const [newEntry, setNewEntry] = useState({ name: '', message: '' })

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3
    const step = Math.PI / spikes

    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      const x = cx + Math.cos(rot) * outerRadius
      const y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step

      const ix = cx + Math.cos(rot) * innerRadius
      const iy = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(ix, iy)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
    ctx.fill()
  }

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const s = size
    ctx.beginPath()
    ctx.moveTo(x, y - s * 0.4)
    
    // Left curve
    ctx.bezierCurveTo(x - s * 0.6, y - s * 0.8, x - s * 0.8, y - s * 0.4, x - s * 0.3, y + s * 0.3)
    // Bottom point
    ctx.bezierCurveTo(x, y + s * 0.8, x, y + s * 0.8, x, y + s * 0.8)
    // Right curve
    ctx.bezierCurveTo(x, y + s * 0.8, x, y + s * 0.8, x + s * 0.3, y + s * 0.3)
    ctx.bezierCurveTo(x + s * 0.8, y - s * 0.4, x + s * 0.6, y - s * 0.8, x, y - s * 0.4)
    
    ctx.closePath()
    ctx.fill()
  }

  const drawSmiley = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, r: number, g: number, b: number, alpha: number) => {
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
    ctx.beginPath()
    ctx.arc(x - size * 0.35, y - size * 0.2, size * 0.15, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + size * 0.35, y - size * 0.2, size * 0.15, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y + size * 0.2, size * 0.35, 0, Math.PI)
    ctx.stroke()
  }

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

    const handleMouseDown = () => {
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
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`

        const size = 6 + Math.random() * 4

        if (drawMode === 'circles') {
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, size * Math.max(0.3, particle.life), 0, Math.PI * 2)
          ctx.fill()
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, size * Math.max(0.3, particle.life) + 3, 0, Math.PI * 2)
          ctx.stroke()
        } else if (drawMode === 'squares') {
          const s = size * Math.max(0.3, particle.life)
          ctx.fillRect(particle.x - s, particle.y - s, s * 2, s * 2)
          ctx.lineWidth = 2
          ctx.strokeRect(particle.x - s - 3, particle.y - s - 3, s * 2 + 6, s * 2 + 6)
        } else if (drawMode === 'stars') {
          drawStar(ctx, particle.x, particle.y, 5, size * Math.max(0.3, particle.life), size * Math.max(0.5, particle.life))
        } else if (drawMode === 'hearts') {
          drawHeart(ctx, particle.x, particle.y, size * Math.max(0.3, particle.life))
        } else if (drawMode === 'smileys') {
          drawSmiley(ctx, particle.x, particle.y, size * Math.max(0.3, particle.life) + 3, r, g, b, alpha)
        }
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

  const getButtonText = () => {
    switch (drawMode) {
      case 'circles':
        return 'circles'
      case 'squares':
        return 'squares'
      case 'stars':
        return 'stars'
      case 'hearts':
        return 'hearts'
      case 'smileys':
        return 'smileys'
      default:
        return 'circles'
    }
  }

  const addGuestbookEntry = () => {
    if (newEntry.name.trim() && newEntry.message.trim()) {
      const today = new Date()
      const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`
      setGuestbookEntries([{ name: newEntry.name, message: newEntry.message, date: dateStr }, ...guestbookEntries])
      setNewEntry({ name: '', message: '' })
    }
  }   case 'hearts':
        return 'hearts'
      case 'smileys':
        return 'smileys'
      default:
        return 'circles'
    }
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
        <button className="guestbook-btn" onClick={() => setShowGuestbook(true)}>Click me to sign the guestbook!</button>
      </div>

      {showGuestbook && (
        <div className="guestbook-modal">
          <div className="guestbook-content">
            <button className="close-btn" onClick={() => setShowGuestbook(false)}>✕</button>
            <h2>Sign the Guestbook!</h2>
            
            <div className="guestbook-form">
              <input
                type="text"
                placeholder="Your name"
                value={newEntry.name}
                onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && addGuestbookEntry()}
              />
              <textarea
                placeholder="Your message..."
                value={newEntry.message}
                onChange={(e) => setNewEntry({ ...newEntry, message: e.target.value })}
                rows={4}
              />
              <button onClick={addGuestbookEntry} className="submit-btn">Sign Guestbook</button>
            </div>

            <div className="guestbook-entries">
              <h3>Previous Visitors:</h3>
              {guestbookEntries.map((entry, idx) => (
                <div key={idx} className="entry">
                  <p className="entry-name"><strong>{entry.name}</strong> - {entry.date}</p>
                  <p className="entry-message">{entry.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="center-text">Move your mouse!</div>

      <div className="controls">
        <button className="btn btn-clear" onClick={clearCanvas}>Clear</button>
        <button className="btn btn-circle" onClick={cycleDrawMode}>
          {getButtonText()}
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
