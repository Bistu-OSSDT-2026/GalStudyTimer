import { useEffect, useRef } from 'react'
import { getAnalyserNode } from '../../services/audioService'
import { useAudioStore } from '../../stores/audioStore'

const RING_OUTER_RADIUS = 170   // ProgressRing 340, strokeWidth 6 → (340-6)/2 + 3
const CANVAS_SIZE = 440
const CENTER = CANVAS_SIZE / 2
const BAR_COUNT = 128           // match time-domain sample count
const BAR_INNER_RADIUS = RING_OUTER_RADIUS + 2
const BAR_MAX_HEIGHT = 50

interface AudioVisualizerProps {
  children: React.ReactNode
}

export function AudioVisualizer({ children }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const isPlaying = useAudioStore((s) => s.isPlaying)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return

    const timeData = new Uint8Array(BAR_COUNT)
    const heights = new Float32Array(BAR_COUNT)
    const particles: { angle: number; speed: number; radius: number; alpha: number; life: number }[] = []

    const draw = () => {
      timeRef.current += 1
      const analyser = getAnalyserNode()
      let anySignal = false

      if (analyser && isPlaying) {
        analyser.getByteTimeDomainData(timeData)
        for (let i = 0; i < BAR_COUNT; i++) {
          // Convert sample (0-255, center=128) to amplitude 0-1, boost ×2
          const amp = Math.min(1, (Math.abs(timeData[i] - 128) / 128) * 3.5)
          // Fast attack / medium decay
          heights[i] = amp > heights[i]
            ? amp  // instant attack
            : heights[i] * 0.65 + amp * 0.35  // smooth decay
          if (amp > 0.01) anySignal = true
        }
      }

      if (!anySignal) {
        // Rapid decay when silence
        for (let i = 0; i < BAR_COUNT; i++) heights[i] *= 0.75
      }

      ctx2d.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      // Ambient glow when playing
      if (isPlaying) {
        const glow = ctx2d.createRadialGradient(CENTER, CENTER, 150, CENTER, CENTER, 225)
        glow.addColorStop(0, 'rgba(139, 92, 246, 0)')
        glow.addColorStop(0.35, 'rgba(139, 92, 246, 0.04)')
        glow.addColorStop(0.7, 'rgba(168, 85, 247, 0.07)')
        glow.addColorStop(1, 'rgba(139, 92, 246, 0)')
        ctx2d.fillStyle = glow
        ctx2d.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      }

      ctx2d.save()
      ctx2d.translate(CENTER, CENTER)

      // Draw every bar around the full circle
      for (let i = 0; i < BAR_COUNT; i++) {
        const value = heights[i]
        if (value < 0.008) continue // skip near-silent bars

        const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const innerR = BAR_INNER_RADIUS
        const outerR = BAR_INNER_RADIUS + value * BAR_MAX_HEIGHT

        // Rainbow color cycling
        const hue = (i / BAR_COUNT * 360 + timeRef.current * 1.2) % 360
        const alpha = 0.25 + value * 0.75

        // Glow
        ctx2d.shadowBlur = isPlaying ? 8 + value * 6 : 0
        ctx2d.shadowColor = `hsla(${hue}, 100%, 60%, ${alpha * 0.6})`

        // Bar body
        ctx2d.strokeStyle = `hsla(${hue}, 95%, ${50 + value * 30}%, ${alpha})`
        ctx2d.lineWidth = 1.8
        ctx2d.lineCap = 'round'
        ctx2d.beginPath()
        ctx2d.moveTo(cos * innerR, sin * innerR)
        ctx2d.lineTo(cos * outerR, sin * outerR)
        ctx2d.stroke()

        // Bright tip on tall bars
        if (value > 0.15) {
          ctx2d.shadowBlur = 6
          ctx2d.shadowColor = `hsla(${hue}, 100%, 80%, ${value})`
          ctx2d.strokeStyle = `hsla(${hue}, 100%, 85%, ${value * 0.8})`
          ctx2d.lineWidth = 0.8
          ctx2d.beginPath()
          ctx2d.moveTo(cos * (outerR - 3), sin * (outerR - 3))
          ctx2d.lineTo(cos * outerR, sin * outerR)
          ctx2d.stroke()
        }
      }

      // Particle effects on active bars
      if (isPlaying) {
        for (let i = 0; i < BAR_COUNT; i++) {
          if (heights[i] > 0.5 && Math.random() < 0.06) {
            const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2
            const r = BAR_INNER_RADIUS + heights[i] * BAR_MAX_HEIGHT
            particles.push({ angle, speed: 0.2 + Math.random() * 0.5, radius: r, alpha: 0.85, life: 15 + Math.random() * 20 })
          }
        }
        if (particles.length > 250) particles.splice(0, particles.length - 250)

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]
          p.radius += p.speed
          p.alpha *= 0.94
          p.life -= 1
          if (p.life <= 0 || p.alpha < 0.02) { particles.splice(i, 1); continue }

          const hue = (p.angle / (Math.PI * 2) * 360 + timeRef.current * 2) % 360
          const px = Math.cos(p.angle) * p.radius
          const py = Math.sin(p.angle) * p.radius
          ctx2d.shadowBlur = 3
          ctx2d.shadowColor = `hsla(${hue}, 100%, 70%, ${p.alpha})`
          ctx2d.fillStyle = `hsla(${hue}, 100%, 80%, ${p.alpha})`
          ctx2d.beginPath()
          ctx2d.arc(px, py, 1.4, 0, Math.PI * 2)
          ctx2d.fill()
        }
      }

      ctx2d.restore()
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying])

  return (
    <div className="relative" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="absolute inset-0"
        style={{ pointerEvents: 'none' }}
      />
      <div
        className="absolute z-10"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        {children}
      </div>
    </div>
  )
}
