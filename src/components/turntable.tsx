'use client'

import { useRef, useState } from 'react'
import { Move3d } from 'lucide-react'

/**
 * Turntable discreto: N frames ordenados por giro de cabeza IZQUIERDA→frontal→DERECHA.
 * El slider sigue hacia dónde voltea la cara; arranca en el centro (frontal).
 */
export function Turntable({ frames }: { frames: string[] }) {
  const n = frames.length
  const mid = Math.floor(n / 2)
  const [index, setIndex] = useState(mid)
  const [hint, setHint] = useState(true)
  const areaRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const setFromX = (clientX: number) => {
    const el = areaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setIndex(Math.round(t * (n - 1))) // snap al checkpoint más cercano
  }

  return (
    <div className="relative h-full w-full select-none">
      {frames.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Ángulo ${i + 1}`}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}

      {/* Zona de arrastre */}
      <div
        ref={areaRef}
        className="absolute inset-0 cursor-ew-resize touch-none"
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          setHint(false)
          setFromX(e.clientX)
        }}
        onPointerMove={(e) => dragging.current && setFromX(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      />

      {hint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center">
          <span className="flex items-center gap-2 rounded-full bg-ink/70 px-4 py-2 text-xs font-medium text-bone backdrop-blur">
            <Move3d className="h-4 w-4" /> Arrastra para girar la cabeza
          </span>
        </div>
      )}

      {/* Checkpoints (7 ángulos) */}
      <div className="pointer-events-none absolute inset-x-8 bottom-14 flex items-center justify-between">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-bone/25" />
        {frames.map((_, i) => (
          <span
            key={i}
            className={`relative rounded-full transition-all ${
              i === index
                ? 'h-3 w-3 bg-bone ring-2 ring-bone/40'
                : i === mid
                  ? 'h-2 w-2 bg-bone/70'
                  : 'h-1.5 w-1.5 bg-bone/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
