'use client'

import { useState } from 'react'
import { Box, AlertCircle } from 'lucide-react'

export function Lead3DGate({ onCaptured }: { onCaptured: () => void }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (nombre.trim().length < 2) return setError('Escribe tu nombre.')
    if (telefono.trim().length < 7) return setError('Escribe un teléfono válido.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.trim())) return setError('Escribe un correo válido.')

    setSending(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          correo: correo.trim(),
          tratamiento: 'Otomodelación',
        }),
      })
    } catch {
      // no bloqueamos el 3D si falla el guardado
    }
    onCaptured()
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/70 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bone p-5">
        <div className="flex items-center gap-2 text-pine">
          <Box className="h-5 w-5" />
          <p className="text-sm font-semibold text-ink">Ver tu resultado en 3D</p>
        </div>
        <p className="mt-1 text-xs text-ink-soft">
          Déjanos tus datos y generamos la vista en 3D de tu resultado.
        </p>

        <div className="mt-4 space-y-2.5">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Tu teléfono"
            inputMode="tel"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <input
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="Tu correo"
            inputMode="email"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-blush">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={sending}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pine px-6 py-3 text-sm font-medium text-bone transition-colors hover:bg-pine-light disabled:opacity-60"
        >
          <Box className="h-4 w-4" />
          {sending ? 'Generando…' : 'Ver en 3D'}
        </button>
      </div>
    </div>
  )
}
