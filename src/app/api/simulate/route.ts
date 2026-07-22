import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { nanoBananaEdit } from '@/lib/replicate'

export const runtime = 'nodejs'
export const maxDuration = 60

const bodySchema = z.object({
  imageBase64: z.string().min(100, 'Imagen inválida'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

/**
 * Prompt de otomodelación: acercar las orejas a la cabeza (corregir orejas
 * prominentes / de soplillo) sin tocar nada más de la imagen.
 */
const OTOMODELACION_PROMPT = `Edita esta foto cambiando ÚNICAMENTE las orejas (corrección de otomodelación). Es una edición local, NO una regeneración de la imagen.

REGLA #1 — NO TOQUES EL ENCUADRE (lo más importante):
- El resultado debe tener EXACTAMENTE el mismo encuadre que la entrada: misma composición, mismo recorte, la cabeza del MISMO tamaño y en la MISMA posición.
- PROHIBIDO hacer zoom (ni acercar ni alejar), PROHIBIDO reencuadrar, reescalar, recortar, mover o rotar al sujeto. Si superpusieras el antes y el después, TODO debe coincidir pixel a pixel salvo las orejas.

REGLA #2 — NO DEFORMES NI CAMBIES LA CARA:
- Rostro idéntico: ojos, mirada, cejas, nariz, boca, forma de la cara, mandíbula, mentón, pómulos, arrugas, lunares, piel, peinado, vello facial, cuello, ropa, iluminación y fondo EXACTAMENTE iguales. La persona debe verse idéntica, no "parecida". Sin deformaciones.

CAMBIO PERMITIDO — SOLO LAS OREJAS (MUY marcado, aplánalas fuerte):
- APLANA ambas orejas contra la cabeza al MÁXIMO: reduce el ángulo aurículo-cefálico casi a cero, orejas prácticamente pegadas al cráneo, como una otoplastia muy exitosa y notoria.
- En la vista frontal, el borde externo de la oreja debe quedar casi alineado con el contorno de la cabeza: ELIMINA la prominencia por completo. La diferencia antes/después debe saltar a la vista; si dudas, pégalas MÁS, no menos.
- Define el pliegue del antihélix. Que se vea como una oreja real, no caricatura.

RESULTADO: la MISMA foto, mismo encuadre, misma persona, solo con las orejas corregidas.`

export async function POST(request: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('[simulate] Falta REPLICATE_API_TOKEN')
    return NextResponse.json(
      { success: false, error: 'El simulador no está configurado. Falta el token.' },
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
    const processed = await nanoBananaEdit(OTOMODELACION_PROMPT, parsed.imageBase64, parsed.mimeType)

    if (!processed) {
      return NextResponse.json(
        { success: false, error: 'No se pudo generar la simulación. Prueba con otra foto de frente y bien iluminada.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      processedImageBase64: processed.base64,
      processedImageUrl: processed.url,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[simulate] Error:', msg)
    return NextResponse.json(
      { success: false, error: `Error de IA: ${msg.slice(0, 120)}` },
      { status: 500 }
    )
  }
}
