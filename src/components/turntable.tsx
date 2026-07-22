'use client'

import { useRef, useState } from 'react'
import { Move3d } from 'lucide-react'

const PX_PER_FRAME = 44

export function Turntable({ frames }: { frames: string[] }) {
  const [index, setIndex] = useState(Math.floor(frames.length / 2))
  const drag = useRef<{ startX: number; startIndex: number } | null>(null)
  const [hint, setHint] = useState(true)

  const onDown = (x: number) => {
    drag.current = { startX: x, startIndex: index }
    setHint(false)
  }
  const onMove = (x: number) => {
    if (!drag.current) return
    const delta = x - drag.current.startX
    const next = Math.round(drag.current.startIndex + delta / PX_PER_FRAME)
    setIndex(Math.max(0, Math.min(frames.length - 1, next)))
  }
  const onUp = () => {
    drag.current = null
  }

  return (
    <div
      className="relative h-full w-full cursor-ew-resize touch-none select-none"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId)
        onDown(e.clientX)
      }}
      onPointerMove={(e) => onMove(e.clientX)}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {frames.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Ángulo ${i}`}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}

      {hint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <span className="flex items-center gap-2 rounded-full bg-ink/70 px-4 py-2 text-xs font-medium text-bone backdrop-blur">
            <Move3d className="h-4 w-4" /> Arrastra para girar
          </span>
        </div>
      )}

      {/* Marcador de posición del giro */}
      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center gap-1.5">
        {frames.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === index ? 'bg-bone' : 'bg-bone/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
