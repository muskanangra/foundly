import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

interface PixelImageProps {
  src?: string
  pixelSize?: number
  reveal?: boolean
  id?: number
  alt?: string
  className?: string
}

function seededVal(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000
  return x - Math.floor(x)
}

const PATTERN_COLORS = [
  '#8AAACE', '#6B8FB8', '#B8C8E8', '#E3ECFF',
  '#4B5A75', '#A0B8D8', '#D6E4F4', '#7098BE',
]

function drawPattern(canvas: HTMLCanvasElement, seed: number, pxSize: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const cols = Math.ceil(canvas.width / pxSize)
  const rows = Math.ceil(canvas.height / pxSize)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = seededVal(seed, r * cols + c)
      ctx.fillStyle = PATTERN_COLORS[Math.floor(v * PATTERN_COLORS.length)]
      ctx.fillRect(c * pxSize, r * pxSize, pxSize, pxSize)
    }
  }
}

function drawPixelated(canvas: HTMLCanvasElement, img: HTMLImageElement, pxSize: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const small = document.createElement('canvas')
  small.width = Math.max(1, Math.round(canvas.width / pxSize))
  small.height = Math.max(1, Math.round(canvas.height / pxSize))
  const sc = small.getContext('2d')!
  sc.imageSmoothingEnabled = false
  sc.drawImage(img, 0, 0, small.width, small.height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height)
}

export function PixelImage({ src, pixelSize = 8, reveal = false, id = 0, alt = '', className }: PixelImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [inView, setInView] = useState(false)

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const w = container.clientWidth || 300
    const h = container.clientHeight || 225
    canvas.width = w
    canvas.height = h

    if (!src) {
      drawPattern(canvas, id, pixelSize)
      return
    }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => drawPixelated(canvas, img, pixelSize)
    img.onerror = () => drawPattern(canvas, id, pixelSize)
    img.src = src
  }, [src, pixelSize, id])

  useEffect(() => {
    if (!reveal || !src) return
    if (prefersReducedMotion) { setInView(true); return }

    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); observer.disconnect() }
      },
      { rootMargin: '0px 0px -5% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [reveal, src, prefersReducedMotion])

  const isRevealed = prefersReducedMotion || inView
  const duration = prefersReducedMotion ? '0ms' : '600ms'

  return (
    <div ref={containerRef} className={clsx('relative overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
        style={{ opacity: reveal && src && isRevealed ? 0 : 1, transition: `opacity ${duration} ease` }}
      />
      {reveal && src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isRevealed ? 1 : 0, transition: `opacity ${duration} ease` }}
        />
      )}
    </div>
  )
}
