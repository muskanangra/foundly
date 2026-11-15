import { type HTMLAttributes } from 'react'
import clsx from 'clsx'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-[10px] border border-line bg-surface p-6',
        'transition-colors duration-150 hover:border-accent/30',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
