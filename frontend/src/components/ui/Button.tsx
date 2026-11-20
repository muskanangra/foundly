import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled ?? loading

  const sizeClasses = {
    sm:  'text-sm   px-4   py-1.5 gap-1.5',
    md:  'text-[15px] px-5 py-2.5 gap-2',
    lg:  'text-base  px-7   py-3   gap-2',
  }[size]

  return (
    <button
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-sans font-medium',
        'transition-colors duration-150 cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses,
        variant === 'primary'   && 'bg-navy text-ivory hover:bg-sapphire',
        variant === 'secondary' && 'bg-transparent border-[1.5px] border-navy text-navy hover:bg-champagne',
        variant === 'ghost'     && 'bg-transparent text-sapphire hover:bg-champagne',
        variant === 'danger'    && 'bg-danger text-ivory hover:opacity-90',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin shrink-0" aria-hidden="true" />}
      {children}
    </button>
  )
}
