'use client'

import { useEffect, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'

const ADS = [
  {
    titulo: 'Sin cirugía, sin cortes ni cicatrices',
    puntos: [
      'La otomodelación acerca tus orejas a la cabeza.',
      'Resultados inmediatos; al día 10 la oreja luce normal.',
    ],
  },
  {
    titulo: 'Poco invasiva y reversible',
    puntos: [
      'El procedimiento se puede revertir.',
      'Recuperación completa en 90 días; cerca del 95% son candidatos.',
    ],
  },
]

export function VideoAds() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % ADS.length), 4000)
    return () => clearInterval(id)
  }, [])

  const ad = ADS[i]
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-ink/75 px-8 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-bone/90">
        <Sparkles className="h-4 w-4 animate-pulse text-blush" />
        <span className="text-sm">Preparando tu video…</span>
      </div>

      <div key={i} className="rise w-full max-w-sm rounded-2xl border border-bone/15 bg-bone p-6">
        <p className="text-xl text-ink" style={{ fontFamily: 'var(--font-cormorant)' }}>
          {ad.titulo}
        </p>
        <ul className="mt-4 space-y-3">
          {ad.puntos.map((p) => (
            <li key={p} className="flex gap-3 text-sm text-ink-soft">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
                <Check className="h-3 w-3" strokeWidth={2.5} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-1.5">
        {ADS.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === i ? 'bg-bone' : 'bg-bone/40'}`}
          />
        ))}
      </div>
    </div>
  )
}
