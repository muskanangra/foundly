import { Button } from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

function PixelBlocks() {
  return (
    <svg width="72" height="60" viewBox="0 0 72 60" fill="none" aria-hidden="true">
      <rect x="8"  y="8"  width="12" height="12" rx="1" fill="#B8C8E8" />
      <rect x="22" y="8"  width="12" height="12" rx="1" fill="#D6DEEB" />
      <rect x="36" y="8"  width="12" height="12" rx="1" fill="#8AAACE" />
      <rect x="50" y="8"  width="12" height="12" rx="1" fill="#E3ECFF" />
      <rect x="8"  y="22" width="12" height="12" rx="1" fill="#6B8FB8" />
      <rect x="22" y="22" width="12" height="12" rx="1" fill="#B8C8E8" />
      <rect x="50" y="22" width="12" height="12" rx="1" fill="#D93A3A" opacity="0.5" />
      <rect x="8"  y="36" width="12" height="12" rx="1" fill="#E3ECFF" />
      <rect x="36" y="36" width="12" height="12" rx="1" fill="#D93A3A" opacity="0.3" />
      <rect x="50" y="36" width="12" height="12" rx="1" fill="#B8C8E8" />
    </svg>
  )
}

export function ErrorState({
  message = "Can't reach the server. Check your connection and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <PixelBlocks />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-ink">Something went wrong</p>
        <p className="max-w-sm text-xs text-ink-soft leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
