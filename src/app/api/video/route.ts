import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSeedanceVideo, getPrediction } from '@/lib/replicate'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'
import ffmpegStatic from 'ffmpeg-static'

export const runtime = 'nodejs'
export const maxDuration = 60

const FRAMES = 16

const VIDEO_PROMPT = `Treat the person in this photo as a frozen, realistic MANNEQUIN of themselves. Only the head turns; nothing else moves or changes.
- The head slowly shakes "no": one calm, slow, continuous side-to-side turning motion. It turns to their LEFT until the LEFT ear is fully visible in side profile, then smoothly turns to their RIGHT until the RIGHT ear is fully visible in side profile, gently oscillating. BOTH ears must clearly be shown in profile during the clip.
- HARD LIMIT: never rotate PAST a side profile, NEVER show the back of the head or the nape, ABSOLUTELY NO 360-degree spin. Stay within the front 180 degrees.
- DO NOT modify the face at all: identity, features, skin and expression stay EXACTLY as in the photo. The person does NOT smile, talk, blink or emote.
- Keep the gaze calm and still, as if being examined and staying quiet: the eyes follow the head's direction, never dart around, never turn toward the camera. Not stiff like a soldier, just naturally still.
- The ears stay pinned close to the head the entire time. Same hairstyle, same clothing.
- The camera is completely fixed. Plain neutral studio background, steady soft lighting. No zoom, no text, no effects. Photorealistic, subtle natural motion.`

async function extractFrames(videoUrl: string): Promise<string[]> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'turn-'))
  const mp4 = path.join(tmp, 'v.mp4')
  const buf = Buffer.from(await (await fetch(videoUrl)).arrayBuffer())
  await fs.writeFile(mp4, buf)

  // 7 cuadros equiespaciados: leer duración real y sacar 1 frame por segmento (-ss).
  const bin = (ffmpegStatic as unknown as string) || 'ffmpeg'
  const dur = await probeDuration(bin, mp4)
  const frames: string[] = []
  for (let i = 0; i < FRAMES; i++) {
    const t = (dur * (i + 0.5)) / FRAMES // centro de cada segmento
    const out = path.join(tmp, `f${i}.jpg`)
    await new Promise<void>((resolve, reject) => {
      const p = spawn(bin, ['-y', '-ss', t.toFixed(3), '-i', mp4, '-frames:v', '1', '-q:v', '3', out])
      p.on('error', reject)
      p.on('exit', () => resolve())
    })
    try {
      frames.push((await fs.readFile(out)).toString('base64'))
    } catch {
      /* si un cuadro falla, se omite */
    }
  }
  await fs.rm(tmp, { recursive: true, force: true }).catch(() => {})
  return frames
}

function probeDuration(bin: string, mp4: string): Promise<number> {
  return new Promise((resolve) => {
    let err = ''
    const p = spawn(bin, ['-i', mp4])
    p.stderr.on('data', (d) => (err += d.toString()))
    p.on('error', () => resolve(5))
    p.on('exit', () => {
      const m = err.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
      resolve(m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 5)
    })
  })
}

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
    let frames: string[] = []
    try {
      frames = await extractFrames(videoUrl)
    } catch (e) {
      console.error('[video] extracción falló:', e instanceof Error ? e.message : e)
    }
    return NextResponse.json({ success: true, status: 'done', videoUrl, frames })
  }
  if (status === 'failed' || status === 'canceled' || status === 'error') {
    return NextResponse.json({ success: true, status: 'error' })
  }
  return NextResponse.json({ success: true, status: 'pending' })
}
