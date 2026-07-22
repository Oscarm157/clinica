import { Simulator } from '@/components/simulator'
import { Check, MessageCircle, MapPin } from 'lucide-react'

const WHATSAPP = 'https://wa.me/5215520919481'

const ciudades = [
  'Ciudad de México', 'Naucalpan', 'Metepec', 'Guadalajara',
  'Monterrey', 'Puebla', 'Querétaro', 'San Luis Potosí',
  'Cancún', 'Tijuana', 'Torreón', 'Oaxaca', 'Veracruz', 'Chile',
]

export default function Home() {
  return (
    <main className="bg-bone text-ink">
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line/60 bg-bone/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="text-xl tracking-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Clínica <span className="text-pine">Armonízate</span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
            <a href="#simulador" className="transition-colors hover:text-ink">Simulador</a>
            <a href="#otomodelacion" className="transition-colors hover:text-ink">Otomodelación</a>
            <a href="#lobuloplastia" className="transition-colors hover:text-ink">Lobuloplastía</a>
            <a href="#sucursales" className="transition-colors hover:text-ink">Sucursales</a>
          </div>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-pine px-5 py-2.5 text-sm font-medium text-bone transition-colors hover:bg-pine-light"
          >
            <MessageCircle className="h-4 w-4" /> Agenda tu valoración
          </a>
        </nav>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden px-6 pt-36 pb-24">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow rise text-blush">Especialistas en orejas · México y Chile</p>
          <h1 className="rise mt-6 max-w-4xl text-5xl leading-[0.98] text-ink md:text-7xl lg:text-8xl">
            Acercamos tus orejas a tu cabeza, sin cirugía.
          </h1>
          <p className="rise mt-8 max-w-xl text-lg text-ink-soft">
            La otomodelación es una técnica sin cortes ni cicatrices que corrige las orejas prominentes
            con resultados inmediatos. Somos pioneros de la otomodelación en México y Chile.
          </p>
          <div className="rise mt-10 flex flex-wrap gap-4">
            <a
              href="#simulador"
              className="rounded-full bg-pine px-7 py-3.5 text-sm font-medium text-bone transition-colors hover:bg-pine-light"
            >
              Prueba el simulador
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-ink/20 px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
            >
              Escríbenos por WhatsApp
            </a>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
            {[
              ['+2,500', 'pacientes atendidos'],
              ['7', 'profesionales con cédula'],
              ['95%', 'de candidatos elegibles'],
              ['90 días', 'de recuperación total'],
            ].map(([n, l]) => (
              <div key={l} className="bg-bone px-6 py-8">
                <p className="text-4xl text-pine" style={{ fontFamily: 'var(--font-cormorant)' }}>{n}</p>
                <p className="mt-1 text-sm text-ink-soft">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULADOR */}
      <section id="simulador" className="border-y border-line bg-bone-deep px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Simulator />
        </div>
      </section>

      {/* OTOMODELACIÓN */}
      <section id="otomodelacion" className="px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="eyebrow text-blush">Tratamiento estrella</p>
            <h2 className="mt-3 text-5xl text-ink md:text-6xl">Otomodelación</h2>
            <p className="mt-6 text-lg text-ink-soft">
              Una técnica innovadora que, sin cirugía, cortes ni cicatrices, acerca tus orejas a tu cabeza.
              Los resultados se ven de inmediato y al día 10 la oreja luce normal.
            </p>
            <div className="mt-10 flex items-baseline gap-3">
              <span className="text-sm text-ink-soft">Desde</span>
              <span className="text-5xl text-pine" style={{ fontFamily: 'var(--font-cormorant)' }}>$21,990</span>
              <span className="text-sm text-ink-soft">MXN</span>
            </div>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-pine px-7 py-3.5 text-sm font-medium text-bone transition-colors hover:bg-pine-light"
            >
              <MessageCircle className="h-4 w-4" /> Consulta si eres candidato
            </a>
          </div>

          <ul className="space-y-5 lg:pt-16">
            {[
              ['Sin cirugía', 'Sin cortes ni cicatrices. No requiere quirófano.'],
              ['Reversible', 'El procedimiento se puede revertir si así lo decides.'],
              ['Resultados inmediatos', 'Ves el cambio el mismo día; al día 10 la oreja se ve normal.'],
              ['Apta para casi todos', 'Aproximadamente el 95% de las personas son candidatas.'],
              ['Recuperación de 90 días', 'La consolidación completa toma alrededor de 90 días.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-4 border-b border-line pb-5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="font-medium text-ink">{t}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LOBULOPLASTÍA */}
      <section id="lobuloplastia" className="border-t border-line bg-pine px-6 py-24 text-bone">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="eyebrow text-blush-soft">También corregimos el lóbulo</p>
              <h2 className="mt-3 text-5xl text-bone md:text-6xl">Lobuloplastía</h2>
              <p className="mt-6 max-w-xl text-lg text-bone/80">
                Corrige rasgaduras, espacios y la forma de tu lóbulo en una sola sesión.
                El retiro de puntos es a los 10 días.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-bone/70">Desde</p>
              <p className="text-5xl text-bone" style={{ fontFamily: 'var(--font-cormorant)' }}>$5,490</p>
              <p className="text-sm text-bone/70">MXN</p>
            </div>
          </div>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-bone px-7 py-3.5 text-sm font-medium text-pine transition-colors hover:bg-blush-soft"
          >
            <MessageCircle className="h-4 w-4" /> Agenda tu sesión
          </a>
        </div>
      </section>

      {/* SUCURSALES */}
      <section id="sucursales" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="eyebrow text-blush">Dónde estamos</p>
            <h2 className="mt-3 text-5xl text-ink md:text-6xl">Sucursales</h2>
            <p className="mt-6 text-lg text-ink-soft">
              Atención presencial en las principales ciudades de México y en Chile.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 md:grid-cols-4">
            {ciudades.map((c) => (
              <div key={c} className="flex items-center gap-2 border-b border-line py-3 text-ink">
                <MapPin className="h-4 w-4 shrink-0 text-pine" strokeWidth={1.5} />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-line bg-bone-deep px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl text-ink md:text-5xl text-balance">
            Resuelve tus dudas con nuestro equipo
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-ink-soft">
            Escríbenos por WhatsApp y agenda una valoración con uno de nuestros 7 profesionales
            con cédula. Te decimos si eres candidato y resolvemos todas tus preguntas.
          </p>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-pine px-8 py-4 text-sm font-medium text-bone transition-colors hover:bg-pine-light"
          >
            <MessageCircle className="h-5 w-5" /> WhatsApp 55 2091 9481
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 text-sm text-ink-soft md:flex-row md:items-center">
          <div>
            <p className="text-lg text-ink" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Clínica Armonízate
            </p>
            <p className="mt-1">Especialistas en orejas · Pioneros de la otomodelación en México y Chile</p>
          </div>
          <div className="flex flex-col gap-1 md:text-right">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              WhatsApp: 55 2091 9481
            </a>
            <a href="mailto:soporte@clinicaarmonizate.mx" className="hover:text-ink">
              soporte@clinicaarmonizate.mx
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
