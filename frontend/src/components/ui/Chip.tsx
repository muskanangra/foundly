import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface ChipProps {
  children: ReactNode
  className?: string
}

export function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-[3px] border border-line bg-transparent px-2 py-0.5',
        'font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-ink-soft',
        className,
      )}
    >
      {children}
    </span>
  )
}
