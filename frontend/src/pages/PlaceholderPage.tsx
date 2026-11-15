/* Generic placeholder page used by routes not yet fully built */
import { clsx } from 'clsx'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="font-mono text-xs uppercase tracking-widest text-muted">
        // coming soon
      </span>
      <h1 className={clsx('text-3xl font-semibold text-text md:text-4xl')}>{title}</h1>
      {description && (
        <p className="max-w-md text-sm text-muted leading-relaxed">{description}</p>
      )}
      <div className="h-px w-16 bg-border" aria-hidden="true" />
      <p className="font-mono text-xs text-muted">This page will be built in Part 2.</p>
    </div>
  )
}
