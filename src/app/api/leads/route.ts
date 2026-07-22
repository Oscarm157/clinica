import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const LEADS_FILE = path.join(process.cwd(), 'leads.json')

const leadSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre requerido').max(80),
  telefono: z.string().trim().min(7, 'Teléfono inválido').max(20),
  tratamiento: z.enum(['Otomodelación', 'Lobuloplastía']),
})

type Lead = z.infer<typeof leadSchema> & { fecha: string }

async function readLeads(): Promise<Lead[]> {
  try {
    return JSON.parse(await fs.readFile(LEADS_FILE, 'utf8'))
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  let lead: z.infer<typeof leadSchema>
  try {
    lead = leadSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ success: false, error: 'Datos inválidos.' }, { status: 400 })
  }

  const leads = await readLeads()
  leads.unshift({ ...lead, fecha: new Date().toISOString() })
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2))

  return NextResponse.json({ success: true })
}

export async function GET() {
  const leads = await readLeads()
  return NextResponse.json({ success: true, leads })
}
