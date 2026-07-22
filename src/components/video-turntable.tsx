'use client'

import { useState } from 'react'
import { Play, Move3d } from 'lucide-react'
import { Turntable } from './turntable'

export function VideoTurntable({ videoUrl, frames }: { videoUrl: string; frames: string[] }) {
  const [mode, setMode] = useState<'girar' | 'video'>(frames.length ? 'girar' : 'video')

  return (
    <div className="relative h-full w-full select-none">
      {mode === 'girar' && frames.length > 0 ? (
        <Turntable frames={frames} />
      ) : (
        <video src={videoUrl} className="h-full w-full object-cover" muted playsInline loop autoPlay />
      )}

      {/* Toggle Girar / Video (abajo, sin chocar con el toggle principal de arriba) */}
      {frames.length > 0 && (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full bg-ink/70 p-1 backdrop-blur">
          {([
            ['girar', 'Girar', Move3d],
            ['video', 'Video', Play],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                mode === key ? 'bg-bone text-ink' : 'text-bone/90 hover:text-bone'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
