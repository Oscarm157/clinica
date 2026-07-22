import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getGenAI, IMAGE_MODEL, extractImage } from '@/lib/genai'

export const runtime = 'nodejs'
export const maxDuration = 60

const bodySchema = z.object({
  imageBase64: z.string().min(100, 'Imagen inválida'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

// Intermedios juntos (giro suave al centro) y extremos lejanos (giro notorio).
// El 0° reutiliza la imagen de entrada (no se regenera).
const ANGLES = [-70, -42, -18, 0, 18, 42, 70]

function anglePrompt(angle: number): string {
  const dir = angle < 0 ? 'hacia su izquierda' : 'hacia su derecha'
  return `Esta es una foto frontal de una persona con las orejas ya corregidas (pegadas a la cabeza).
Genera la MISMA persona vista con la cabeza girada ${Math.abs(angle)} grados ${dir}, como un fotograma de un giro de estudio (turntable) perfectamente estabilizado.

ESTABILIDAD DE LA TOMA (CRÍTICO, para que el giro no "salte"):
- Gira la cabeza SOLO en horizontal (yaw). NO cambies la inclinación vertical (pitch): la persona no debe levantar ni bajar el rostro.
- Mantén la mirada al frente y la LÍNEA DE LOS OJOS a la MISMA ALTURA que en la foto original.
- La cabeza debe ocupar el mismo tamaño y quedar centrada en el mismo punto del encuadre; misma distancia y altura de cámara. No hagas zoom ni muevas el sujeto arriba/abajo.

MIRADA Y EXPRESIÓN CONGELADAS (CRÍTICO para que no "cobre vida"):
- Trátalo como girar una figura/maniquí realista de la persona en un turntable: SOLO rota la cabeza, NADA más se mueve.
- La MIRADA acompaña el giro de la cabeza: los ojos miran en la MISMA dirección a la que apunta la cara. NUNCA dirijas los ojos hacia la cámara ni al frente del encuadre.
- Expresión EXACTAMENTE IGUAL a la foto original: misma boca cerrada y neutra, mismos párpados. No sonrías, no cambies el gesto, no abras/cierres los ojos.

CONSISTENCIA:
- Es la misma persona: rostro, piel, peinado y vello facial idénticos.
- Mantén las orejas pegadas a la cabeza (otomodelación ya aplicada).
- Misma iluminación de estudio y el mismo fondo liso y neutro.
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
