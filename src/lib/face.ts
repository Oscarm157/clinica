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
 * Alinea el "después" al "antes" por los ojos (escala + traslación) y RECORTA ambas a la
 * región común, para que queden del MISMO tamaño y encuadre, sin bordes negros. Solo cambian
 * las orejas. Devuelve el par recortado, o las originales si no detecta rostro.
 */
export async function alignDespuesToAntes(
  antes: string,
  despues: string
): Promise<{ antes: string; despues: string }> {
  try {
    const lm = await getLandmarker()
    const [ia, id] = await Promise.all([loadImg(antes), loadImg(despues)])
    const a = lm.detect(ia).faceLandmarks?.[0]
    const d = lm.detect(id).faceLandmarks?.[0]
    if (!a || !d) return { antes, despues }

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
    if (distD < 1) return { antes, despues }
    const s = distA / distD
    const midA = { x: (a1.x + a2.x) / 2, y: (a1.y + a2.y) / 2 }
    const midD = { x: (d1.x + d2.x) / 2, y: (d1.y + d2.y) / 2 }

    // "Después" alineado sobre un lienzo del tamaño del "antes"
    const aligned = document.createElement('canvas')
    aligned.width = ia.width
    aligned.height = ia.height
    const actx = aligned.getContext('2d')
    if (!actx) return { antes, despues }
    actx.translate(midA.x, midA.y)
    actx.scale(s, s)
    actx.translate(-midD.x, -midD.y)
    actx.drawImage(id, 0, 0)

    // Región cubierta por el "después" escalado (para no dejar negro)
    const x0 = Math.max(0, midA.x - s * midD.x)
    const y0 = Math.max(0, midA.y - s * midD.y)
    const x1 = Math.min(ia.width, midA.x + s * (id.width - midD.x))
    const y1 = Math.min(ia.height, midA.y + s * (id.height - midD.y))
    const cw = Math.max(1, Math.round(x1 - x0))
    const ch = Math.max(1, Math.round(y1 - y0))
    const cx = Math.round(x0)
    const cy = Math.round(y0)

    const crop = (srcCanvasOrImg: CanvasImageSource) => {
      const c = document.createElement('canvas')
      c.width = cw
      c.height = ch
      c.getContext('2d')!.drawImage(srcCanvasOrImg, cx, cy, cw, ch, 0, 0, cw, ch)
      return c.toDataURL('image/jpeg', 0.95)
    }

    return { antes: crop(ia), despues: crop(aligned) }
  } catch {
    return { antes, despues }
  }
}
