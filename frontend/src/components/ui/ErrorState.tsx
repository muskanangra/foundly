import { Button } from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = "Can't reach the server. Check your connection and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <circle cx="28" cy="28" r="24" stroke="#BEB7A7" strokeWidth="1.5" />
        <path d="M20 20 L36 36 M36 20 L20 36" stroke="#A63D32" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      </svg>
      <div className="flex flex-col gap-2">
        <p className="font-display text-[28px] font-[500] italic text-sapphire">Something went wrong</p>
        <p className="max-w-sm text-base text-sapphire/70 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
