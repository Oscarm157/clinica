import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { nanoBananaEdit, NANO_PRO } from '@/lib/replicate'

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
const OTOMODELACION_PROMPT = `Eres un cirujano especialista en otoplastia generando una simulación fotorrealista del resultado de una otomodelación (corrección de orejas prominentes / de soplillo).

CAMBIO ÚNICO PERMITIDO — LAS OREJAS (HAZLO DRAMÁTICO Y EVIDENTE):
- Pega ambas orejas FIRMEMENTE contra la cabeza, reduciendo el ángulo aurículo-cefálico al mínimo (orejas casi planas contra el cráneo, como una otoplastia muy exitosa).
- La corrección debe ser INCONFUNDIBLE: al comparar antes y después, cualquiera debe notar de inmediato que las orejas dejaron de sobresalir. Si dudas, pégalas más.
- En la vista frontal, el borde externo de la oreja NO debe sobresalir del contorno de la cabeza más de lo mínimo; elimina la prominencia por completo.
- Define claramente el pliegue del antihélix.
- Aun así debe verse como una foto real de una persona (piel y oreja reales), no una caricatura.

ATA EL RESTO DE LA IMAGEN (CRÍTICO — preserva la identidad al 100%):
- Edita ÚNICAMENTE las orejas y su entorno inmediato (la zona pegada a la cabeza). El otro ~90% de la imagen debe quedar PIXEL-IDÉNTICO al original.
- NO alteres NADA del rostro: ojos, cejas, nariz, boca, forma de la cara, mandíbula, mentón, pómulos, arrugas, lunares y textura de piel EXACTAMENTE iguales. La persona debe verse idéntica, no "parecida".
- La mirada queda natural y al frente, con los mismos ojos del original (no vidriosos, no alterados, sin cambiar hacia dónde miran).
- No cambies el peinado, el vello facial, el cuello, la ropa, la iluminación ni el fondo.
- Mismo encuadre, ángulo, escala y recorte. NO reencuadres, NO hagas zoom, NO reescales.

RESULTADO: una foto clínica real de "después" de la MISMA persona, no un render, filtro ni ilustración.`

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
    const processed = await nanoBananaEdit(OTOMODELACION_PROMPT, parsed.imageBase64, parsed.mimeType, NANO_PRO)

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
