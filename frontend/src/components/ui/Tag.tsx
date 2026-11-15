import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface TagProps {
  children: ReactNode
  className?: string
}

export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-[3px] bg-accent px-2.5 py-1',
        'font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-white',
        'select-none',
        className,
      )}
    >
      {children}
    </span>
  )
}
