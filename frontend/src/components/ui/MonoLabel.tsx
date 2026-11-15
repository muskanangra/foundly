import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface MonoLabelProps {
  children: ReactNode
  className?: string
}

export function MonoLabel({ children, className }: MonoLabelProps) {
  return (
    <p
      className={clsx(
        'font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-soft',
        className,
      )}
    >
      {children}
    </p>
  )
}
