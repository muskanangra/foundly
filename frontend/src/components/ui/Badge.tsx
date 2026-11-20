import { type ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  variant?: 'default' | 'muted' | 'danger' | 'success'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-3 py-0.5',
        'font-sans text-sm font-medium',
        variant === 'default' && 'bg-champagne text-sapphire border-taupe/60',
        variant === 'muted'   && 'bg-champagne/50 text-sapphire/70 border-taupe/40',
        variant === 'danger'  && 'bg-danger/10 text-danger border-danger/20',
        variant === 'success' && 'bg-success/10 text-success border-success/20',
        className,
      )}
    >
      {children}
    </span>
  )
}
