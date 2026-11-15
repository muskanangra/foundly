import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

function PixelBlocks() {
  return (
    <svg width="72" height="60" viewBox="0 0 72 60" fill="none" aria-hidden="true">
      <rect x="8"  y="8"  width="12" height="12" rx="1" fill="#B8C8E8" />
      <rect x="22" y="8"  width="12" height="12" rx="1" fill="#8AAACE" />
      <rect x="36" y="8"  width="12" height="12" rx="1" fill="#E3ECFF" />
      <rect x="8"  y="22" width="12" height="12" rx="1" fill="#6B8FB8" />
      <rect x="22" y="22" width="12" height="12" rx="1" fill="#B8C8E8" />
      <rect x="36" y="22" width="12" height="12" rx="1" fill="#8AAACE" />
      <rect x="50" y="22" width="12" height="12" rx="1" fill="#E3ECFF" />
      <rect x="8"  y="36" width="12" height="12" rx="1" fill="#E3ECFF" />
      <rect x="22" y="36" width="12" height="12" rx="1" fill="#6B8FB8" />
      <rect x="50" y="36" width="12" height="12" rx="1" fill="#B8C8E8" />
    </svg>
  )
}

export function EmptyState({ title, message, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-[5px] bg-accent-tint text-accent">
          {icon}
        </div>
      ) : (
        <PixelBlocks />
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {message && <p className="max-w-sm text-xs text-ink-soft leading-relaxed">{message}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
