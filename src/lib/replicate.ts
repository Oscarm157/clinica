export const NANO_STD = 'google/nano-banana' // estándar, más barato
export const NANO_PRO = 'google/nano-banana-pro' // más calidad, más caro

/**
 * Edita una imagen con Nano Banana en Replicate (foto + prompt -> foto editada).
 * `model` elige estándar (default) o pro. Devuelve base64 o null si falla.
 */
export async function nanoBananaEdit(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  model: string = NANO_STD
): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return null

  const res = await fetch(
    `https://api.replicate.com/v1/models/${model}/predictions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt,
          image_input: [`data:${mimeType};base64,${imageBase64}`],
        },
      }),
    }
  )

  if (!res.ok) {
    console.error('[replicate] HTTP', res.status, (await res.text()).slice(0, 200))
    return null
  }

  const data = await res.json()

  // Si el wait no alcanzó a terminar, hacer polling del recurso
  let prediction = data
  const getUrl: string | undefined = data?.urls?.get
  for (let i = 0; i < 40 && prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled'; i++) {
    await new Promise((r) => setTimeout(r, 1500))
    const poll = await fetch(getUrl!, { headers: { Authorization: `Bearer ${token}` } })
    prediction = await poll.json()
  }

  if (prediction.status !== 'succeeded') {
    console.error('[replicate] status', prediction.status, String(prediction.error).slice(0, 150))
    return null
  }

  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
  if (typeof output !== 'string') return null

  const img = await fetch(output)
  if (!img.ok) return null
  return Buffer.from(await img.arrayBuffer()).toString('base64')
}
