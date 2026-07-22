import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Clínica Armonízate · Especialistas en orejas',
  description:
    'Otomodelación sin cirugía, cortes ni cicatrices, y lobuloplastía. Pioneros de la otomodelación en México y Chile. +2,500 pacientes atendidos.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  )
}
