import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

let genai: GoogleGenAI | null = null
function getGenAI() {
  if (!genai) genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
  return genai
}

const bodySchema = z.object({
  imageBase64: z.string().min(100, 'Imagen inválida'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

/**
 * Prompt de otomodelación: acercar las orejas a la cabeza (corregir orejas
 * prominentes / de soplillo) sin tocar nada más de la imagen.
 */
const OTOMODELACION_PROMPT = `Eres un cirujano especialista en otoplastia generando una simulación fotorrealista del resultado de una otomodelación (corrección de orejas prominentes / de soplillo).

CAMBIO ÚNICO PERMITIDO — LAS OREJAS:
- Acerca ambas orejas NOTABLEMENTE hacia la cabeza, reduciendo de forma clara y evidente el ángulo aurículo-cefálico. La diferencia debe verse a simple vista al comparar antes y después.
- Deja las orejas bien pegadas al cráneo, con proyección mínima como en un resultado real de otoplastia.
- Define claramente el pliegue del antihélix.
- Mantén el resultado natural y anatómicamente creíble: pegadas pero sin deformarlas ni aplanarlas de forma artificial.

TODO LO DEMÁS DEBE QUEDAR PIXEL-IDÉNTICO A LA FOTO ORIGINAL:
- Mismo encuadre, ángulo, escala, recorte y fondo. NO reencuadres, NO hagas zoom, NO reescales.
- Misma iluminación, tono y textura de piel.
- Rostro, peinado, ojos, cejas, nariz, boca, expresión, cuello y ropa: exactamente iguales.
- La persona debe reconocerse por completo. Cambia solo la proyección de las orejas.

RESULTADO: una foto clínica real de "después", no un render, filtro ni ilustración.`

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('[simulate] Falta GEMINI_API_KEY')
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
      { success: false, error: 'Envía una imagen válida (JPG, PNG o WebP).' },
      { status: 400 }
    )
  }

  try {
    const response = await getGenAI().models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        { text: OTOMODELACION_PROMPT },
        { inlineData: { mimeType: parsed.mimeType, data: parsed.imageBase64 } },
      ],
      config: { responseModalities: ['image', 'text'] },
    })

    let processed: string | null = null
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        processed = part.inlineData.data
        break
      }
    }

    if (!processed) {
      return NextResponse.json(
        { success: false, error: 'No se pudo generar la simulación. Prueba con otra foto de frente y bien iluminada.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, processedImageBase64: processed })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[simulate] Error de Gemini:', msg)
    return NextResponse.json(
      { success: false, error: `Error de IA: ${msg.slice(0, 120)}` },
      { status: 500 }
    )
  }
}
