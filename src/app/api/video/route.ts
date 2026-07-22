import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSeedanceVideo, getPrediction } from '@/lib/replicate'

export const runtime = 'nodejs'
export const maxDuration = 60

const VIDEO_PROMPT = `Treat the person in this photo as a frozen, realistic MANNEQUIN of themselves on a turntable. ONLY the head rotates horizontally; nothing else moves or changes.
- Rotate the head slowly from one side to the other (left and right), no more than about 45 degrees to each side, smooth and steady, like a studio turntable.
- DO NOT modify the face in any way: identity, facial features, skin, expression, mouth and eyes must stay EXACTLY as in the photo. Do not make the person smile, talk, blink or emote. It is a still mannequin that only turns.
- The eyes look in the same direction the head is facing; never turn the eyes toward the camera.
- The ears stay pinned close to the head the entire time. Same hairstyle, same clothing.
- The camera is completely fixed. Plain neutral studio background, steady soft lighting. No zoom, no text, no effects. Photorealistic.`

export async function POST(request: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ success: false, error: 'Falta el token.' }, { status: 500 })
  }
  let imageUrl: string
  try {
    imageUrl = z.object({ imageUrl: z.string().url() }).parse(await request.json()).imageUrl
  } catch {
    return NextResponse.json({ success: false, error: 'imageUrl inválida.' }, { status: 400 })
  }

  const id = await createSeedanceVideo(imageUrl, VIDEO_PROMPT)
  if (!id) {
    return NextResponse.json({ success: false, error: 'No se pudo iniciar el video.' }, { status: 502 })
  }
  return NextResponse.json({ success: true, id })
}

export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'Falta id.' }, { status: 400 })

  const { status, videoUrl } = await getPrediction(id)
  if (status === 'succeeded' && videoUrl) {
    return NextResponse.json({ success: true, status: 'done', videoUrl })
  }
  if (status === 'failed' || status === 'canceled' || status === 'error') {
    return NextResponse.json({ success: true, status: 'error' })
  }
  return NextResponse.json({ success: true, status: 'pending' })
}
