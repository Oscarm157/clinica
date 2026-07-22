'use client'

import { useState } from 'react'
import { MessageCircle, Check, AlertCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '5215520919481'
type Tratamiento = 'Otomodelación' | 'Lobuloplastía'

export function LeadForm() {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [tratamiento, setTratamiento] = useState<Tratamiento>('Otomodelación')
  const [state, setState] = useState<'form' | 'sending' | 'done'>('form')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (nombre.trim().length < 2) return setError('Escribe tu nombre.')
    if (telefono.trim().length < 7) return setError('Escribe un teléfono válido.')

    setState('sending')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim(), tratamiento }),
      })
      if (!(await res.json()).success) throw new Error()
    } catch {
      // No bloqueamos el WhatsApp si falla el guardado
    }

    const msg = `Hola, soy ${nombre.trim()}. Me interesa ${tratamiento} y ya probé el simulador en su sitio. Mi teléfono: ${telefono.trim()}.`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
    setState('done')
  }

  if (state === 'done') {
    return (
      <div className="mt-7 flex items-start gap-3 rounded-xl border border-pine/30 bg-pine/5 px-4 py-4">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine text-bone">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <div className="text-sm text-ink">
          <p className="font-medium">Listo, {nombre.trim().split(' ')[0]}.</p>
          <p className="mt-0.5 text-ink-soft">
            Te abrimos WhatsApp con tu mensaje. Nuestro equipo te responde en breve.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-7 rounded-xl border border-line bg-bone p-4">
      <p className="text-sm font-medium text-ink">¿Te gustó el cambio? Habla con un especialista.</p>
      <p className="mt-1 text-xs text-ink-soft">Déjanos tus datos y te contactamos por WhatsApp.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Tu teléfono"
          inputMode="tel"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>
      <div className="mt-3 flex gap-2">
        {(['Otomodelación', 'Lobuloplastía'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTratamiento(t)}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              tratamiento === t
                ? 'border-pine bg-pine text-bone'
                : 'border-line text-ink-soft hover:border-ink/30'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-blush">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={state === 'sending'}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pine px-6 py-3 text-sm font-medium text-bone transition-colors hover:bg-pine-light disabled:opacity-60"
      >
        <MessageCircle className="h-4 w-4" />
        {state === 'sending' ? 'Enviando…' : 'Contactar por WhatsApp'}
      </button>
    </div>
  )
}
