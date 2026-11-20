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
        'inline-flex items-center rounded-full border border-taupe/60 bg-transparent px-2.5 py-0.5',
        'font-sans text-sm font-medium text-sapphire',
        className,
      )}
    >
      {children}
    </span>
  )
}
