import { type ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  variant?: 'accent' | 'muted' | 'danger' | 'success'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'muted', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-[3px] border px-2.5 py-0.5',
        'font-mono text-[0.6rem] font-semibold uppercase tracking-widest',
        variant === 'accent'  && 'bg-accent-tint text-accent border-accent/20',
        variant === 'muted'   && 'bg-surface-2 text-ink-soft border-line',
        variant === 'danger'  && 'bg-danger/10 text-danger border-danger/20',
        variant === 'success' && 'bg-success/10 text-success border-success/20',
        className,
      )}
    >
      {children}
    </span>
  )
}
