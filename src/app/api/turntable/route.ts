import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getGenAI, IMAGE_MODEL, extractImage } from '@/lib/genai'

export const runtime = 'nodejs'
export const maxDuration = 60

const bodySchema = z.object({
  imageBase64: z.string().min(100, 'Imagen inválida'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

// Fotogramas de -60° a +60°. El 0° reutiliza la imagen de entrada (no se regenera).
const ANGLES = [-60, -40, -20, 0, 20, 40, 60]

function anglePrompt(angle: number): string {
  const dir = angle < 0 ? 'hacia su izquierda' : 'hacia su derecha'
  return `Esta es una foto frontal de una persona con las orejas ya corregidas (pegadas a la cabeza).
Genera la MISMA persona vista con la cabeza girada ${Math.abs(angle)} grados ${dir} (rotación en yaw), como un fotograma de un giro de estudio.

REGLAS:
- Es la misma persona: conserva idénticos el rostro, la piel, el peinado, el vello facial y la expresión.
- Mantén las orejas pegadas a la cabeza (resultado de otomodelación ya aplicado).
- Misma iluminación de estudio y el mismo fondo liso y neutro.
- Encuadre centrado, misma escala y distancia de cámara; solo cambia el ángulo de la cabeza.
- Fotorrealista, como una foto real. Sin texto, sin marcos, sin otros cambios.`
}

async function renderAngle(
  angle: number,
  imageBase64: string,
  mimeType: string
): Promise<{ angle: number; base64: string } | null> {
  if (angle === 0) return { angle, base64: imageBase64 }
  try {
    const response = await getGenAI().models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        { text: anglePrompt(angle) },
        { inlineData: { mimeType, data: imageBase64 } },
      ],
      config: { responseModalities: ['image', 'text'] },
    })
    const img = extractImage(response)
    return img ? { angle, base64: img } : null
  } catch (err) {
    console.error(`[turntable] Ángulo ${angle} falló:`, err instanceof Error ? err.message : err)
    return null
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('[turntable] Falta GEMINI_API_KEY')
    return NextResponse.json(
      { success: false, error: 'El simulador no está configurado. Falta la API key.' },
      { status: 500 }
    )
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json(
      { success: false, error: 'Imagen inválida.' },
      { status: 400 }
    )
  }

  const results = await Promise.all(
    ANGLES.map((a) => renderAngle(a, parsed.imageBase64, parsed.mimeType))
  )
  const frames = results
    .filter((f): f is { angle: number; base64: string } => f !== null)
    .sort((a, b) => a.angle - b.angle)

  // Necesitamos al menos el frontal + un par de ángulos para que valga la pena
  if (frames.length < 3) {
    return NextResponse.json(
      { success: false, error: 'No se pudieron generar suficientes ángulos. Intenta de nuevo.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true, frames })
}
