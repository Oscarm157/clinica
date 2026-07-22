'use client'

import { useRef, useState } from 'react'
import { Play, Move3d } from 'lucide-react'

export function VideoTurntable({ videoUrl }: { videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<'video' | 'girar'>('video')
  const [pos, setPos] = useState(0) // 0..1 para la barra en modo girar
  const drag = useRef(false)

  const switchMode = (m: 'video' | 'girar') => {
    const v = videoRef.current
    setMode(m)
    if (!v) return
    if (m === 'video') {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }

  const scrub = (clientX: number, el: HTMLElement) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = el.getBoundingClientRect()
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    v.currentTime = t * v.duration
    setPos(t)
  }

  return (
    <div className="relative h-full w-full select-none">
      <video
        ref={videoRef}
        src={videoUrl}
        className="h-full w-full object-cover"
        muted
        playsInline
        loop
        autoPlay
      />

      {/* Capa de arrastre en modo girar */}
      {mode === 'girar' && (
        <div
          className="absolute inset-0 cursor-ew-resize touch-none"
          onPointerDown={(e) => {
            drag.current = true
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            scrub(e.clientX, e.currentTarget)
          }}
          onPointerMove={(e) => drag.current && scrub(e.clientX, e.currentTarget)}
          onPointerUp={() => (drag.current = false)}
          onPointerCancel={() => (drag.current = false)}
        >
          <span className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 rounded-full bg-ink/60 px-4 py-1.5 text-xs font-medium text-bone backdrop-blur">
            Arrastra para girar
          </span>
          <div className="pointer-events-none absolute inset-x-6 bottom-16 h-1 rounded-full bg-bone/30">
            <div className="h-full rounded-full bg-bone" style={{ width: `${pos * 100}%` }} />
          </div>
        </div>
      )}

      {/* Toggle Video / Girar (abajo, para no chocar con el toggle principal) */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full bg-ink/70 p-1 backdrop-blur">
        {([
          ['video', 'Video', Play],
          ['girar', 'Girar', Move3d],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              mode === key ? 'bg-bone text-ink' : 'text-bone/90 hover:text-bone'
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>
    </div>
  )
}
