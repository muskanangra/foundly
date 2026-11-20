import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, actions, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    firstFocusRef.current?.focus()
    const prev = document.activeElement as HTMLElement | null
    return () => { prev?.focus() }
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" aria-hidden="true" />

      <div
        className={clsx(
          'relative z-10 w-full max-w-md rounded-2xl border border-taupe bg-ivory shadow-xl',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-taupe/50 px-6 py-4">
          <h2 id="modal-title" className="font-sans text-base font-semibold text-navy">
            {title}
          </h2>
          <button
            ref={firstFocusRef}
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 text-sapphire hover:bg-champagne transition-colors"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5 text-base text-sapphire leading-relaxed">{children}</div>

        {actions && (
          <div className="flex justify-end gap-3 border-t border-taupe/50 px-6 py-4">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
