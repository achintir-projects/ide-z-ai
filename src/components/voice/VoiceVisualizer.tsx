'use client'

import { useEffect, useRef } from 'react'

interface VoiceVisualizerProps {
  isRecording: boolean
  audioLevel: number
}

export default function VoiceVisualizer({ isRecording, audioLevel }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (isRecording) {
        // Draw frequency bars
        const barCount = 32
        const barWidth = canvas.width / barCount
        
        for (let i = 0; i < barCount; i++) {
          // Simulate frequency data with some randomness based on audio level
          const barHeight = Math.random() * audioLevel * 2 + audioLevel * 0.5
          const x = i * barWidth
          const y = canvas.height - barHeight
          
          // Create gradient
          const gradient = ctx.createLinearGradient(0, y, 0, canvas.height)
          gradient.addColorStop(0, '#3B82F6')
          gradient.addColorStop(1, '#1E40AF')
          
          ctx.fillStyle = gradient
          ctx.fillRect(x + 1, y, barWidth - 2, barHeight)
          
          // Add rounded top
          ctx.beginPath()
          ctx.arc(x + barWidth / 2, y, (barWidth - 2) / 2, 0, Math.PI, true)
          ctx.fill()
        }
        
        // Draw center waveform
        ctx.beginPath()
        ctx.strokeStyle = '#EF4444'
        ctx.lineWidth = 2
        
        for (let x = 0; x < canvas.width; x++) {
          const frequency = 0.02
          const amplitude = audioLevel * 0.5
          const y = canvas.height / 2 + Math.sin(x * frequency + Date.now() * 0.005) * amplitude
          
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        
        ctx.stroke()
      } else {
        // Draw idle state
        ctx.fillStyle = '#E5E7EB'
        const barCount = 32
        const barWidth = canvas.width / barCount
        const idleHeight = 4
        
        for (let i = 0; i < barCount; i++) {
          const x = i * barWidth
          const y = canvas.height / 2 - idleHeight / 2
          ctx.fillRect(x + 1, y, barWidth - 2, idleHeight)
        }
      }
      
      requestAnimationFrame(draw)
    }
    
    draw()
  }, [isRecording, audioLevel])

  return (
    <div className="w-full h-20 bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={400}
        height={80}
        className="w-full h-full"
      />
    </div>
  )
}