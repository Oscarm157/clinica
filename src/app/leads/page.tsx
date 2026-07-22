'use client'

import { useEffect, useState } from 'react'

type Lead = { nombre: string; telefono: string; tratamiento: string; fecha: string }

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null)

  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
      .catch(() => setLeads([]))
  }, [])

  return (
    <main className="min-h-screen bg-bone px-6 py-16 text-ink">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow text-blush">Panel interno · demo</p>
        <h1 className="mt-3 text-4xl text-ink md:text-5xl">Leads del simulador</h1>
        <p className="mt-3 text-ink-soft">
          Cada persona que prueba el simulador y deja sus datos aparece aquí.
        </p>

        {leads === null ? (
          <p className="mt-10 text-ink-soft">Cargando…</p>
        ) : leads.length === 0 ? (
          <p className="mt-10 text-ink-soft">Aún no hay leads. Prueba el simulador y deja tus datos.</p>
        ) : (
          <div className="mt-10 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-bone-deep text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Tratamiento</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{l.nombre}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/${l.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pine underline underline-offset-2"
                      >
                        {l.telefono}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{l.tratamiento}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {new Date(l.fecha).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
