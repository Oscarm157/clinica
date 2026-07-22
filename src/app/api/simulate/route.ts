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
const OTOMODELACION_PROMPT = `Eres un cirujano especialista en otoplastia generando una simulación fotorrealista del resultado de una otomodelación (corrección de orejas prominentes / de soplillo).

CAMBIO ÚNICO PERMITIDO — LAS OREJAS (HAZLO DRAMÁTICO Y EVIDENTE):
- Pega ambas orejas FIRMEMENTE contra la cabeza, reduciendo el ángulo aurículo-cefálico al mínimo (orejas casi planas contra el cráneo, como una otoplastia muy exitosa).
- La corrección debe ser INCONFUNDIBLE: al comparar antes y después, cualquiera debe notar de inmediato que las orejas dejaron de sobresalir. Si dudas, pégalas más.
- En la vista frontal, el borde externo de la oreja NO debe sobresalir del contorno de la cabeza más de lo mínimo; elimina la prominencia por completo.
- Define claramente el pliegue del antihélix.
- Aun así debe verse como una foto real de una persona (piel y oreja reales), no una caricatura.

TODO LO DEMÁS DEBE QUEDAR PIXEL-IDÉNTICO A LA FOTO ORIGINAL:
- Mismo encuadre, ángulo, escala, recorte y fondo. NO reencuadres, NO hagas zoom, NO reescales.
- Misma iluminación, tono y textura de piel.
- Rostro, peinado, ojos, cejas, nariz, boca, expresión, cuello y ropa: exactamente iguales.
- La persona debe reconocerse por completo. Cambia solo la proyección de las orejas.

RESULTADO: una foto clínica real de "después", no un render, filtro ni ilustración.`

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

    return NextResponse.json({ success: true, processedImageBase64: processed })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[simulate] Error:', msg)
    return NextResponse.json(
      { success: false, error: `Error de IA: ${msg.slice(0, 120)}` },
      { status: 500 }
    )
  }
}
