'use client'

import { useEffect, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'

const ADS = [
  {
    img: '/oto3.webp',
    titulo: 'Sin cirugía, sin cortes ni cicatrices',
    puntos: [
      'La otomodelación acerca tus orejas a la cabeza.',
      'Resultados inmediatos; al día 10 la oreja luce normal.',
      'Cerca del 95% de las personas son candidatas.',
    ],
  },
  {
    img: '/oto5.webp',
    titulo: 'Poco invasiva y reversible',
    puntos: [
      'El procedimiento se puede revertir.',
      'Recuperación completa en 90 días.',
      'Pioneros de la otomodelación en México y Chile.',
    ],
  },
]

export function VideoAds() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % ADS.length), 10000)
    return () => clearInterval(id)
  }, [])

  const ad = ADS[i]
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-bone/90">
        <Sparkles className="h-4 w-4 animate-pulse text-blush" />
        <span className="text-xs">Preparando tu video, tarda cerca de un minuto…</span>
      </div>

      <div key={i} className="softfade w-full max-w-[16rem] overflow-hidden rounded-2xl border border-bone/15 bg-bone">
        <img src={ad.img} alt="Caso real antes y después" className="aspect-[5/4] w-full object-cover object-center" />
        <div className="p-4">
          <p className="text-lg leading-tight text-ink" style={{ fontFamily: 'var(--font-cormorant)' }}>
            {ad.titulo}
          </p>
          <ul className="mt-2 space-y-1.5">
            {ad.puntos.map((p) => (
              <li key={p} className="flex gap-2 text-xs text-ink-soft">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-1.5">
        {ADS.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-6 bg-bone' : 'w-1.5 bg-bone/40'}`}
          />
        ))}
      </div>
    </div>
  )
}
