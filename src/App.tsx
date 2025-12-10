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
  const defaultEntries = [
    { name: 'cooluser123', message: 'awesome site dude!', date: '12/10/2025' },
    { name: 'rainbowfan', message: 'love the rainbow cursor!', date: '12/09/2025' },
    { name: 'webmaster2000', message: 'check back soon for updates!', date: '12/08/2025' },
  ]

  const [guestbookEntries, setGuestbookEntries] = useState<Array<{ name: string; message: string; date: string }>>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('guestbookEntries') : null
      return raw ? JSON.parse(raw) : defaultEntries
    } catch (e) {
      return defaultEntries
    }
  })
  const [newEntry, setNewEntry] = useState({ name: '', message: '' })
  // Settings / extras
  const [showSettings, setShowSettings] = useState(false)
  const [sizeBase, setSizeBase] = useState(8)
  const [decayRate, setDecayRate] = useState(0.015)
  const [colorMode, setColorMode] = useState<'rainbow' | 'palette'>('rainbow')
  const [showStars, setShowStars] = useState(true)
  const [soundOn, setSoundOn] = useState(true)
  const [fps, setFps] = useState(0)
  const starsRef = useRef<{ x: number; y: number; r: number; phase: number }[]>([])
  const fpsCounterRef = useRef({ frames: 0, last: Date.now() })

  // Load persisted settings (if any)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const s = localStorage.getItem('rg_settings')
        if (s) {
          const parsed = JSON.parse(s)
          if (parsed.sizeBase != null) setSizeBase(parsed.sizeBase)
          if (parsed.decayRate != null) setDecayRate(parsed.decayRate)
          if (parsed.colorMode != null) setColorMode(parsed.colorMode)
          if (parsed.showStars != null) setShowStars(parsed.showStars)
          if (parsed.soundOn != null) setSoundOn(parsed.soundOn)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // Persist settings when they change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const s = { sizeBase, decayRate, colorMode, showStars, soundOn }
        localStorage.setItem('rg_settings', JSON.stringify(s))
      }
    } catch (e) {
      // ignore
    }
  }, [sizeBase, decayRate, colorMode, showStars, soundOn])

  // Persist guestbook entries when they change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('guestbookEntries', JSON.stringify(guestbookEntries))
      }
    } catch (e) {
      // ignore
    }
  }, [guestbookEntries])

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
      const palette = ['#00FFFF', '#00FF00', '#FF6600', '#FFFF00', '#FF00FF']
      const altPalette = ['#FF3B3B', '#FFD93D', '#6EE7B7', '#60A5FA', '#C084FC']
      const colors = colorMode === 'rainbow' ? palette : altPalette

      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2
        const velocity = 0.5 + Math.random() * 2
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

    // update smiley pupils based on mouse position
    const handlePupilMove = (e: MouseEvent) => {
      const left = document.getElementById('leftPupil')
      const right = document.getElementById('rightPupil')
      const smiley = document.querySelector('.smiley-button') as HTMLElement | null
      if (!left || !right || !smiley) return
      const rect = smiley.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const maxOffset = 3.5
      const calc = (eyeCx: number, eyeCy: number) => {
        const dx = e.clientX - eyeCx
        const dy = e.clientY - eyeCy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const nx = (dx / dist) * Math.min(maxOffset, dist / 12)
        const ny = (dy / dist) * Math.min(maxOffset, dist / 12)
        return { nx, ny }
      }
      // left eye center approx
      const leftEye = { x: rect.left + rect.width * 0.32, y: rect.top + rect.height * 0.37 }
      const rightEye = { x: rect.left + rect.width * 0.68, y: rect.top + rect.height * 0.37 }
      const l = calc(leftEye.x, leftEye.y)
      const r = calc(rightEye.x, rightEye.y)
      left.setAttribute('cx', String(20 + l.nx))
      left.setAttribute('cy', String(24 + l.ny))
      right.setAttribute('cx', String(44 + r.nx))
      right.setAttribute('cy', String(24 + r.ny))
    }

    const handleMouseDown = () => {
      const palette = ['#00FFFF', '#00FF00', '#FF6600', '#FFFF00', '#FF00FF']
      const colors = colorMode === 'rainbow' ? palette : ['#FF3B3B', '#FFD93D', '#6EE7B7', '#60A5FA', '#C084FC']
      particlesRef.current.push({
        x: mouseRef.current.x,
        y: mouseRef.current.y,
        vx: 0,
        vy: 0,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
      if (soundOn) {
        try {
          const Ac = (window.AudioContext || (window as any).webkitAudioContext)
          const ac = new Ac()
          const o = ac.createOscillator()
          const g = ac.createGain()
          o.type = 'sine'
          o.frequency.value = 440 + Math.random() * 300
          g.gain.value = 0.02
          o.connect(g)
          g.connect(ac.destination)
          o.start()
          setTimeout(() => { o.stop(); ac.close() }, 140)
        } catch (e) {
          // ignore
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousemove', handlePupilMove)
    window.addEventListener('mousedown', handleMouseDown)

    const animate = () => {
      // Clear canvas with fade
      ctx.fillStyle = 'rgba(11, 20, 80, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Stars background
      if (showStars) {
        if (starsRef.current.length === 0) {
          for (let i = 0; i < 120; i++) {
            starsRef.current.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5, phase: Math.random() * Math.PI * 2 })
          }
        }
        const t = Date.now() / 1000
        ctx.save()
        for (const s of starsRef.current) {
          const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(s.phase + t * 2))
          ctx.fillStyle = `rgba(255,255,255,${a})`
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p: Particle) => p.life > 0)

      particlesRef.current.forEach((particle: Particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.06
        particle.life -= decayRate

        const alpha = particle.life
        const hex = particle.color.substring(1)
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`

        const size = sizeBase + Math.random() * (sizeBase * 0.6)

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

      // FPS counting
      fpsCounterRef.current.frames++
      const now = Date.now()
      if (now - fpsCounterRef.current.last >= 500) {
        setFps(Math.round((fpsCounterRef.current.frames * 1000) / (now - fpsCounterRef.current.last)))
        fpsCounterRef.current.frames = 0
        fpsCounterRef.current.last = now
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousemove', handlePupilMove)
      window.removeEventListener('mousedown', handleMouseDown)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [drawMode, colorMode, decayRate, sizeBase, showStars, soundOn])

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
  }

  const cycleDrawMode = () => {
    const modes: Array<'circles' | 'squares' | 'stars' | 'hearts' | 'smileys'> = ['circles', 'squares', 'stars', 'hearts', 'smileys']
    const currentIndex = modes.indexOf(drawMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setDrawMode(modes[nextIndex])
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
        <button className="btn btn-settings" onClick={() => setShowSettings(true)}>Settings</button>
      </div>

      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
            <h3>Settings</h3>
            <div className="setting-row">
              <label>Particle size: {sizeBase}</label>
              <input type="range" min={2} max={24} value={sizeBase} onChange={(e) => setSizeBase(Number(e.target.value))} />
            </div>
            <div className="setting-row">
              <label>Decay rate: {decayRate.toFixed(3)}</label>
              <input type="range" min={0.004} max={0.05} step={0.001} value={decayRate} onChange={(e) => setDecayRate(Number(e.target.value))} />
            </div>
            <div className="setting-row">
              <label>Color mode:</label>
              <select value={colorMode} onChange={(e) => setColorMode(e.target.value as any)}>
                <option value="rainbow">Rainbow</option>
                <option value="palette">Pastel</option>
              </select>
            </div>
            <div className="setting-row">
              <label><input type="checkbox" checked={showStars} onChange={(e) => setShowStars(e.target.checked)} /> Stars background</label>
            </div>
            <div className="setting-row">
              <label><input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} /> Click sound</label>
            </div>
          </div>
        </div>
      )}

      <div className="fps-display">{fps} FPS</div>

      <div className="smiley-button" role="button" tabIndex={0} onClick={() => (window.location.href = '/blank.html')} onKeyPress={(e) => { if (e.key === 'Enter') window.location.href = '/blank.html' }} aria-label="Smiley link">
        <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#glow)">
            <circle cx="32" cy="32" r="30" fill="url(#smileGradient)" stroke="#fff" strokeOpacity="0.2" />
          </g>
          <circle cx="20" cy="24" r="8" fill="#fff" />
          <circle cx="44" cy="24" r="8" fill="#fff" />
          <circle id="leftPupil" cx="20" cy="24" r="3" fill="#000" />
          <circle id="rightPupil" cx="44" cy="24" r="3" fill="#000" />
          <path d="M20 40 Q32 50 44 40" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
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
