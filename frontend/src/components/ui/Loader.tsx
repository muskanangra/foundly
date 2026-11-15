import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

interface LoaderProps {
  size?: number
  className?: string
}

export function Loader({ size = 24, className }: LoaderProps) {
  return (
    <Loader2
      size={size}
      className={clsx('animate-spin text-accent', className)}
      aria-label="Loading"
      role="status"
    />
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx('rounded-[5px] bg-surface-2 animate-pulse', className)}
    />
  )
}
