'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X, AlertCircle } from 'lucide-react'

type Status = 'requesting' | 'loading-model' | 'live' | 'error'

export function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (base64: string, dataUrl: string) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<Status>('requesting')
  const [error, setError] = useState<string | null>(null)
  const [earsOn, setEarsOn] = useState(false)
  const earsRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false

    async function init() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('insecure')
        }
        setStatus('requesting')
        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: isMobile ? 640 : 1280 },
            height: { ideal: isMobile ? 480 : 720 },
          },
        })
        if (cancelled) return
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setStatus('loading-model')
        const { FilesetResolver, FaceLandmarker, DrawingUtils } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
        )
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        })
        if (cancelled) {
          landmarker.close()
          return
        }
        landmarkerRef.current = landmarker
        setStatus('live')
        loop(FaceLandmarker, DrawingUtils)
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        const name = err instanceof DOMException ? err.name : (err as Error)?.message
        if (name === 'NotAllowedError') setError('Permite el acceso a la cámara para continuar.')
        else if (name === 'NotFoundError') setError('No se detectó ninguna cámara.')
        else if (name === 'insecure')
          setError('La cámara necesita HTTPS. Abre el sitio en https:// o sube una foto.')
        else setError('No se pudo iniciar la cámara. Intenta de nuevo o sube una foto.')
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function loop(FaceLandmarker: any, DrawingUtils: any) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const landmarker = landmarkerRef.current
      if (!video || !canvas || !landmarker) return

      if (canvas.width !== video.videoWidth && video.videoWidth) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }
      const ctx = canvas.getContext('2d')
      if (ctx && video.videoWidth) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const res = landmarker.detectForVideo(video, performance.now())
        if (res.faceLandmarks?.length) {
          const utils = new DrawingUtils(ctx)
          for (const lm of res.faceLandmarks) {
            // Malla fina translúcida
            ctx.shadowBlur = 0
            utils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
              color: 'rgba(51,104,92,0.28)',
              lineWidth: 0.6,
            })
            // Contornos con glow suave
            ctx.shadowColor = 'rgba(217,155,130,0.9)'
            ctx.shadowBlur = 8
            utils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: '#f7f3ec', lineWidth: 2 })
            utils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: 'rgba(247,243,236,0.85)', lineWidth: 1.5 })
            ctx.shadowColor = 'rgba(217,155,130,1)'
            ctx.shadowBlur = 10
            utils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: '#d99b82', lineWidth: 1.75 })
            utils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: '#d99b82', lineWidth: 1.75 })
            utils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: '#e8bfae', lineWidth: 2 })
            utils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: '#e8bfae', lineWidth: 2 })

            // Marcadores de orejas (landmarks 234 / 454, junto a cada oreja)
            for (const idx of [234, 454]) {
              const pt = lm[idx]
              if (!pt) continue
              const x = pt.x * canvas.width
              const y = pt.y * canvas.height
              ctx.shadowColor = 'rgba(217,155,130,1)'
              ctx.shadowBlur = 14
              ctx.strokeStyle = '#d99b82'
              ctx.lineWidth = 2.5
              ctx.beginPath()
              ctx.arc(x, y, 11, 0, 2 * Math.PI)
              ctx.stroke()
              ctx.fillStyle = '#d99b82'
              ctx.beginPath()
              ctx.arc(x, y, 3, 0, 2 * Math.PI)
              ctx.fill()
            }
            ctx.shadowBlur = 0
          }
        }
        const has = !!res.faceLandmarks?.length
        if (has !== earsRef.current) {
          earsRef.current = has
          setEarsOn(has)
        }
      }
      rafRef.current = requestAnimationFrame(() => loop(FaceLandmarker, DrawingUtils))
    }

    init()
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (landmarkerRef.current) landmarkerRef.current.close()
    }
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const c = document.createElement('canvas')
    c.width = video.videoWidth
    c.height = video.videoHeight
    const ctx = c.getContext('2d')
    if (!ctx) return
    // Des-espejar: el preview se muestra espejado, la foto se guarda natural
    ctx.translate(c.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, c.width, c.height)
    const dataUrl = c.toDataURL('image/jpeg', 0.92)
    onCapture(dataUrl.split(',')[1], dataUrl)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Overlays de estado */}
      {(status === 'requesting' || status === 'loading-model') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/70 text-bone">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-bone/30 border-t-bone" />
          <p className="text-sm">{status === 'requesting' ? 'Solicitando cámara…' : 'Cargando modelo…'}</p>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-bone">
          <AlertCircle className="h-6 w-6 text-blush" />
          <p className="text-sm text-bone/90">{error}</p>
          <button
            onClick={onCancel}
            className="mt-2 rounded-full bg-bone px-5 py-2 text-sm font-medium text-ink"
          >
            Volver a subir foto
          </button>
        </div>
      )}

      {status === 'live' && (
        <>
          {/* Viewfinder con esquinas */}
          <div className="pointer-events-none absolute inset-6">
            {[
              'left-0 top-0 border-l-2 border-t-2 rounded-tl-lg',
              'right-0 top-0 border-r-2 border-t-2 rounded-tr-lg',
              'left-0 bottom-0 border-l-2 border-b-2 rounded-bl-lg',
              'right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg',
            ].map((c) => (
              <span key={c} className={`absolute h-7 w-7 border-bone/70 ${c}`} />
            ))}
          </div>
          <p
            className={`pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-medium text-bone backdrop-blur transition-colors ${
              earsOn ? 'bg-pine/90' : 'bg-ink/60'
            }`}
          >
            {earsOn ? '✓ Orejas detectadas' : 'Coloca tu rostro dentro del encuadre'}
          </p>
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
            <button
              onClick={onCancel}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/60 text-bone backdrop-blur transition-colors hover:bg-ink"
              aria-label="Cancelar"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={capture}
              className="inline-flex items-center gap-2 rounded-full bg-pine px-6 py-3 text-sm font-medium text-bone shadow-lg transition-colors hover:bg-pine-light"
            >
              <Camera className="h-4 w-4" /> Capturar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
