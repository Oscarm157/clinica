'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, Sparkles, RotateCcw, AlertCircle, Camera } from 'lucide-react'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import { VideoTurntable } from './video-turntable'
import { VideoAds } from './video-ads'
import { LeadForm } from './lead-form'
import { CameraCapture } from './camera-capture'
import { Lead3DGate } from './lead-3d-gate'
import { sortFramesByYaw, alignDespuesToAntes } from '@/lib/face'

type Status = 'idle' | 'ready' | 'processing' | 'done' | 'error'

const MAX_MB = 8

function fileToBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve({ base64: dataUrl.split(',')[1], dataUrl })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function Simulator() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [original, setOriginal] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('image/jpeg')
  const [base64, setBase64] = useState<string>('')
  const [view, setView] = useState<'compare' | 'antes' | 'despues' | '3d'>('compare')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoFrames, setVideoFrames] = useState<string[]>([])
  const [videoStatus, setVideoStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [lead3d, setLead3d] = useState(false)
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback(async (file: File) => {
    setError(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato no válido. Usa JPG, PNG o WebP.')
      setStatus('error')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`La imagen supera ${MAX_MB} MB. Usa una más ligera.`)
      setStatus('error')
      return
    }
    const { base64, dataUrl } = await fileToBase64(file)
    setBase64(base64)
    setMimeType(file.type)
    setOriginal(dataUrl)
    setResult(null)
    setStatus('ready')
  }, [])

  const simulate = useCallback(async () => {
    setStatus('processing')
    setError(null)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Error desconocido')
      const despues = `data:image/jpeg;base64,${data.processedImageBase64}`
      // Alinear + recortar ambas a la región común (mismo tamaño, sin bordes negros).
      const al = original
        ? await alignDespuesToAntes(original, despues)
        : { antes: original, despues }
      if (al.antes) setOriginal(al.antes)
      setResult(al.despues)
      setResultUrl(data.processedImageUrl ?? null)
      setView('compare')
      setVideoUrl(null)
      setVideoFrames([])
      setVideoStatus('idle')
      setLead3d(false)
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo procesar la imagen.')
      setStatus('error')
    }
  }, [base64, mimeType])

  const startVideo = useCallback(async () => {
    if (!resultUrl) return
    setVideoStatus('loading')
    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: resultUrl }),
      })
      const data = await res.json()
      if (!data.success || !data.id) throw new Error()
      // Polling hasta que el video esté listo
      for (let i = 0; i < 90; i++) {
        await new Promise((r) => setTimeout(r, 4000))
        const poll = await (await fetch(`/api/video?id=${data.id}`)).json()
        if (poll.status === 'done' && poll.videoUrl) {
          setVideoUrl(poll.videoUrl)
          // Ordenar los frames por ángulo real (izq→frontal→der) antes de mostrar.
          const ordered = Array.isArray(poll.frames) && poll.frames.length
            ? await sortFramesByYaw(poll.frames, 7)
            : []
          setVideoFrames(ordered)
          setVideoStatus('idle')
          return
        }
        if (poll.status === 'error') throw new Error()
      }
      throw new Error()
    } catch {
      setVideoStatus('error')
    }
  }, [resultUrl])

  const openTurntable = () => {
    setView('3d')
    // El 3D exige datos: solo genera si el lead ya se capturó.
    if (lead3d && !videoUrl && videoStatus !== 'loading') startVideo()
  }

  const onCapture = (b64: string, dataUrl: string) => {
    setError(null)
    setBase64(b64)
    setMimeType('image/jpeg')
    setOriginal(dataUrl)
    setResult(null)
    setStatus('ready')
    setMode('upload')
  }

  const reset = () => {
    setStatus('idle')
    setOriginal(null)
    setResult(null)
    setBase64('')
    setError(null)
    setView('compare')
    setResultUrl(null)
    setVideoUrl(null)
    setVideoFrames([])
    setVideoStatus('idle')
    setLead3d(false)
    setMode('upload')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      {/* Panel visual */}
      <div className="relative mx-auto aspect-[8/9] w-full max-w-[85%] overflow-hidden rounded-2xl border border-line bg-bone-deep">
        {/* IDLE · subir foto */}
        {status === 'idle' && mode === 'upload' && (
          <div className="flex h-full w-full flex-col gap-3 p-3">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files?.[0]
                if (f) loadFile(f)
              }}
              className="group flex flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-pine/40 bg-pine/[0.06] px-8 text-center transition-colors hover:border-pine hover:bg-pine/10"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pine text-bone shadow-md transition-transform group-hover:scale-105">
                <Upload className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xl text-ink" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  Sube una foto de frente
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Arrastra la imagen o haz clic. JPG, PNG o WebP.
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) loadFile(f)
                }}
              />
            </label>
            <button
              onClick={() => setMode('camera')}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-bone py-3 text-sm font-medium text-ink transition-colors hover:border-pine hover:text-pine"
            >
              <Camera className="h-4 w-4" /> Usar la cámara
            </button>
          </div>
        )}

        {/* IDLE · cámara en vivo */}
        {status === 'idle' && mode === 'camera' && (
          <CameraCapture onCapture={onCapture} onCancel={() => setMode('upload')} />
        )}

        {/* READY (foto cargada) */}
        {status === 'ready' && original && (
          <img src={original} alt="Foto original" className="h-full w-full object-cover" />
        )}

        {/* PROCESSING */}
        {status === 'processing' && original && (
          <div className="relative h-full w-full">
            <img src={original} alt="Procesando" className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-x-0 h-px bg-blush shadow-[0_0_16px_4px_rgba(217,155,130,0.6)] animate-scan" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/20">
              <div className="flex items-center gap-2 rounded-full bg-bone/90 px-4 py-2 text-sm text-ink shimmer relative overflow-hidden">
                <Sparkles className="h-4 w-4 text-pine" />
                Generando tu simulación
              </div>
            </div>
          </div>
        )}

        {/* DONE: comparador antes/después */}
        {status === 'done' && original && result && (
          <div className="relative h-full w-full select-none">
            {view === 'compare' && (
              <>
                <ReactCompareSlider
                  className="h-full w-full"
                  itemOne={<ReactCompareSliderImage src={original} alt="Antes" style={{ objectFit: 'cover' }} />}
                  itemTwo={<ReactCompareSliderImage src={result} alt="Después" style={{ objectFit: 'cover' }} />}
                  defaultPosition={50}
                  handle={
                    <div className="flex h-full flex-col items-center">
                      <div className="h-12 w-0.5 bg-bone/90 shadow" />
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-bone text-ink shadow-lg ring-1 ring-black/5">
                        <span className="text-lg leading-none">⇆</span>
                      </div>
                      <div className="w-0.5 flex-1 bg-bone/90 shadow" />
                    </div>
                  }
                />
                <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-bone">
                  Antes
                </span>
                <span className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-pine px-3 py-1 text-xs font-medium text-bone">
                  Después
                </span>
              </>
            )}
            {(view === 'antes' || view === 'despues') && (
              <>
                <img
                  src={view === 'antes' ? original : result}
                  alt={view === 'antes' ? 'Antes' : 'Después'}
                  onClick={() => setView(view === 'antes' ? 'despues' : 'antes')}
                  className="h-full w-full cursor-pointer object-cover"
                />
                <span
                  className={`pointer-events-none absolute bottom-3 left-3 z-10 rounded-full px-3 py-1 text-xs font-medium text-bone ${
                    view === 'antes' ? 'bg-ink/70' : 'bg-pine'
                  }`}
                >
                  {view === 'antes' ? 'Antes' : 'Después'} · clic para alternar
                </span>
              </>
            )}
            {view === '3d' && (
              <>
                {/* Fondo: el resultado 2D mientras se pide datos / genera */}
                <img src={result} alt="Resultado" className="h-full w-full object-cover opacity-60" />
                {!lead3d && (
                  <Lead3DGate
                    onCaptured={() => {
                      setLead3d(true)
                      startVideo()
                    }}
                  />
                )}
                {lead3d && videoStatus === 'loading' && <VideoAds />}
                {lead3d && videoStatus === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-ink-soft">
                    <AlertCircle className="mr-2 h-5 w-5" /> No se pudo generar el video.
                  </div>
                )}
                {lead3d && videoStatus === 'idle' && videoUrl && (
                  <div className="absolute inset-0">
                    <VideoTurntable videoUrl={videoUrl} frames={videoFrames} />
                  </div>
                )}
              </>
            )}

            {/* Toggle rápido antes/después/3D, aparte del slider */}
            <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 gap-1 rounded-full bg-ink/70 p-1 backdrop-blur">
              {([
                ['compare', 'Comparar'],
                ['antes', 'Antes'],
                ['despues', 'Después'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    view === key ? 'bg-bone text-ink' : 'text-bone/90 hover:text-bone'
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={openTurntable}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  view === '3d' ? 'bg-bone text-ink' : 'text-bone/90 hover:text-bone'
                }`}
              >
                3D
              </button>
            </div>
          </div>
        )}

        {/* ERROR overlay (mantiene foto si existe) */}
        {status === 'error' && original && (
          <img src={original} alt="Foto" className="h-full w-full object-cover opacity-50" />
        )}
        {status === 'error' && !original && (
          <div className="flex h-full w-full items-center justify-center px-8 text-center text-ink-soft">
            <AlertCircle className="mr-2 h-5 w-5" /> {error}
          </div>
        )}
      </div>

      {/* Panel de control */}
      <div>
        <h2 className="text-3xl text-ink md:text-4xl">Ve tu resultado antes de decidir</h2>
        <p className="mt-4 text-ink-soft">
          Sube una foto de frente y mira cómo se verían tus orejas después de la otomodelación.
        </p>

        {error && status === 'error' && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-blush/50 bg-blush/10 px-4 py-3 text-sm text-ink">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blush" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          {(status === 'ready' || (status === 'error' && original)) && (
            <button
              onClick={simulate}
              className="inline-flex items-center gap-2 rounded-full bg-pine px-6 py-3 text-sm font-medium text-bone transition-colors hover:bg-pine-light"
            >
              <Sparkles className="h-4 w-4" /> Generar simulación
            </button>
          )}
          {status === 'processing' && (
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-full bg-pine/60 px-6 py-3 text-sm font-medium text-bone"
            >
              <Sparkles className="h-4 w-4 animate-pulse" /> Procesando…
            </button>
          )}
          {(status === 'done' || status === 'ready' || status === 'error') && original && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
            >
              <RotateCcw className="h-4 w-4" /> Otra foto
            </button>
          )}
        </div>

        {status === 'done' && (
          <>
            <p className="mt-6 text-sm text-ink-soft">
              {view === '3d'
                ? 'Arrastra sobre la imagen para girar y ver las orejas desde varios ángulos.'
                : view === 'compare'
                  ? 'Desliza sobre la imagen para comparar.'
                  : 'Haz clic en la imagen para alternar antes y después.'}
            </p>
            <LeadForm />
          </>
        )}
      </div>
    </div>
  )
}
