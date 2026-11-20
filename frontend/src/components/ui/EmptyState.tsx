import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

function SapphireLine() {
  return (
    <svg width="80" height="40" viewBox="0 0 80 40" fill="none" aria-hidden="true">
      <path d="M4 36 L20 12 L36 24 L52 8 L68 20 L76 14" stroke="#3B507D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" opacity="0.5" />
      <circle cx="20" cy="12" r="2.5" fill="#3B507D" opacity="0.4" />
      <circle cx="52" cy="8"  r="2.5" fill="#3B507D" opacity="0.4" />
    </svg>
  )
}

export function EmptyState({ title, message, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-champagne text-sapphire">
          {icon}
        </div>
      ) : (
        <SapphireLine />
      )}
      <div className="flex flex-col gap-2">
        <p className="font-display text-[28px] font-[500] italic text-sapphire leading-tight">{title}</p>
        {message && <p className="max-w-sm text-base text-sapphire/70 leading-relaxed">{message}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
