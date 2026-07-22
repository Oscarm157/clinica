export const NANO_STD = 'google/nano-banana' // estándar, más barato
export const NANO_PRO = 'google/nano-banana-pro' // más calidad, más caro
const SEEDANCE = 'bytedance/seedance-1-lite' // image-to-video rápido

const API = 'https://api.replicate.com/v1'

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Prediction = { status: string; output?: any; error?: unknown; urls?: { get?: string } }

/** Crea una predicción y espera (Prefer: wait) o hace polling hasta terminar. */
async function runToEnd(model: string, input: object, wait: boolean): Promise<Prediction | null> {
  const headers = authHeaders()
  if (wait) headers['Prefer'] = 'wait'
  const res = await fetch(`${API}/models/${model}/predictions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ input }),
  })
  if (!res.ok) {
    console.error('[replicate] HTTP', res.status, (await res.text()).slice(0, 200))
    return null
  }
  let pred: Prediction = await res.json()
  const getUrl = pred.urls?.get
  for (let i = 0; i < 60 && !['succeeded', 'failed', 'canceled'].includes(pred.status); i++) {
    await new Promise((r) => setTimeout(r, 1500))
    const poll = await fetch(getUrl!, { headers: authHeaders() })
    pred = await poll.json()
  }
  return pred
}

function firstUrl(output: unknown): string | null {
  const o = Array.isArray(output) ? output[0] : output
  return typeof o === 'string' ? o : null
}

/**
 * Edita una imagen con Nano Banana (foto + prompt -> foto editada).
 * Devuelve { base64, url } o null.
 */
export async function nanoBananaEdit(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  model: string = NANO_STD
): Promise<{ base64: string; url: string } | null> {
  if (!process.env.REPLICATE_API_TOKEN) return null
  const pred = await runToEnd(model, {
    prompt,
    image_input: [`data:${mimeType};base64,${imageBase64}`],
  }, true)
  if (!pred || pred.status !== 'succeeded') {
    if (pred) console.error('[replicate] nano status', pred.status, String(pred.error).slice(0, 150))
    return null
  }
  const url = firstUrl(pred.output)
  if (!url) return null
  const img = await fetch(url)
  if (!img.ok) return null
  return { base64: Buffer.from(await img.arrayBuffer()).toString('base64'), url }
}

/** Crea la predicción de video Seedance (image-to-video). Reintenta si Replicate throttlea
 * (429 con crédito bajo = ráfaga de 1, la 2ª llamada tras el 2D se cae). Devuelve el id. */
export async function createSeedanceVideo(imageUrl: string, prompt: string): Promise<string | null> {
  if (!process.env.REPLICATE_API_TOKEN) return null
  const body = JSON.stringify({
    input: { image: imageUrl, prompt, duration: 7, resolution: '720p', camera_fixed: true },
  })
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${API}/models/${SEEDANCE}/predictions`, {
      method: 'POST',
      headers: authHeaders(),
      body,
    })
    if (res.ok) {
      const pred: Prediction = await res.json()
      return (pred as unknown as { id?: string }).id ?? null
    }
    if (res.status === 429 && attempt < 3) {
      await new Promise((r) => setTimeout(r, 12000)) // esperar la ventana de la ráfaga
      continue
    }
    console.error('[replicate] seedance HTTP', res.status, (await res.text()).slice(0, 200))
    return null
  }
  return null
}

/** Consulta una predicción por id (para polling del video). */
export async function getPrediction(id: string): Promise<{ status: string; videoUrl: string | null }> {
  const res = await fetch(`${API}/predictions/${id}`, { headers: authHeaders() })
  if (!res.ok) return { status: 'error', videoUrl: null }
  const pred: Prediction = await res.json()
  return { status: pred.status, videoUrl: pred.status === 'succeeded' ? firstUrl(pred.output) : null }
}
