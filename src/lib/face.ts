'use client'

// FaceLandmarker en modo IMAGE, compartido para (1) ordenar frames por ángulo
// y (2) alinear el "después" al "antes" en el comparador. Reusa @mediapipe/tasks-vision.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let landmarkerPromise: Promise<any> | null = null

function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      )
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
      })
    })()
  }
  return landmarkerPromise
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Ordena frames (base64) por giro de cabeza y devuelve `pick` dataURLs
 * repartidos de IZQUIERDA→frontal→DERECHA. Descarta frames sin rostro (nuca).
 */
export async function sortFramesByYaw(base64Frames: string[], pick = 7): Promise<string[]> {
  try {
    const lm = await getLandmarker()
    const scored: { url: string; yaw: number }[] = []
    for (const b64 of base64Frames) {
      const url = `data:image/jpeg;base64,${b64}`
      try {
        const img = await loadImg(url)
        const res = lm.detect(img)
        const pts = res.faceLandmarks?.[0]
        if (!pts) continue
        const nose = pts[1]
        const l = pts[234]
        const r = pts[454]
        const denom = r.x - l.x
        if (Math.abs(denom) < 1e-4) continue
        scored.push({ url, yaw: (nose.x - l.x) / denom }) // ~0.5 frontal
      } catch {
        /* skip */
      }
    }
    if (scored.length < 2) return base64Frames.slice(0, pick).map((b) => `data:image/jpeg;base64,${b}`)
    scored.sort((a, b) => a.yaw - b.yaw)
    const out: string[] = []
    for (let i = 0; i < pick; i++) {
      const idx = Math.round((i * (scored.length - 1)) / (pick - 1))
      out.push(scored[idx].url)
    }
    return out
  } catch {
    return base64Frames.slice(0, pick).map((b) => `data:image/jpeg;base64,${b}`)
  }
}

/**
 * Alinea el "después" al "antes" por los ojos (escala + traslación) sobre un canvas
 * del tamaño del "antes", para que el comparador solape aunque el modelo haya hecho zoom.
 * Devuelve el dataURL alineado, o el original si no detecta rostro.
 */
export async function alignDespuesToAntes(antes: string, despues: string): Promise<string> {
  try {
    const lm = await getLandmarker()
    const [ia, id] = await Promise.all([loadImg(antes), loadImg(despues)])
    const a = lm.detect(ia).faceLandmarks?.[0]
    const d = lm.detect(id).faceLandmarks?.[0]
    if (!a || !d) return despues

    const eye = (pts: { x: number; y: number }[], img: HTMLImageElement, i: number) => ({
      x: pts[i].x * img.width,
      y: pts[i].y * img.height,
    })
    const a1 = eye(a, ia, 33)
    const a2 = eye(a, ia, 263)
    const d1 = eye(d, id, 33)
    const d2 = eye(d, id, 263)
    const distA = Math.hypot(a2.x - a1.x, a2.y - a1.y)
    const distD = Math.hypot(d2.x - d1.x, d2.y - d1.y)
    if (distD < 1) return despues
    const s = distA / distD
    const midA = { x: (a1.x + a2.x) / 2, y: (a1.y + a2.y) / 2 }
    const midD = { x: (d1.x + d2.x) / 2, y: (d1.y + d2.y) / 2 }

    const cv = document.createElement('canvas')
    cv.width = ia.width
    cv.height = ia.height
    const ctx = cv.getContext('2d')
    if (!ctx) return despues
    ctx.translate(midA.x, midA.y)
    ctx.scale(s, s)
    ctx.translate(-midD.x, -midD.y)
    ctx.drawImage(id, 0, 0)
    return cv.toDataURL('image/jpeg', 0.95)
  } catch {
    return despues
  }
}
