import { type ButtonHTMLAttributes, type ReactNode, Children, isValidElement } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'pill'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

function splitChildren(children: ReactNode): { icon: ReactNode | null; label: ReactNode[] } {
  const arr = Children.toArray(children)
  if (arr.length === 0) return { icon: null, label: [] }
  const first = arr[0]
  if (isValidElement(first) && arr.length > 1) {
    return { icon: first, label: arr.slice(1) }
  }
  return { icon: null, label: arr }
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

  if (variant === 'primary') {
    const { icon, label } = splitChildren(children)
    const iconContent = loading ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : (icon ?? '+')

    const blockSize = size === 'sm' ? 'w-7 text-[10px]' : size === 'lg' ? 'w-11 text-sm' : 'w-9 text-xs'
    const textPad  = size === 'sm' ? 'px-3 py-1.5 text-[10px]' : size === 'lg' ? 'px-5 py-2.5 text-xs' : 'px-4 py-2 text-[11px]'

    return (
      <button
        disabled={isDisabled}
        className={clsx(
          'inline-flex items-stretch cursor-pointer select-none',
          'rounded-[5px] overflow-hidden border border-accent',
          'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:border-accent-ink',
          className,
        )}
        {...props}
      >
        <span
          className={clsx(
            'flex items-center justify-center self-stretch shrink-0 bg-accent text-white hover:bg-accent-ink',
            blockSize,
            '[button:hover_&]:bg-accent-ink',
          )}
          aria-hidden="true"
        >
          {iconContent}
        </span>
        <span
          className={clsx(
            'flex items-center justify-center font-mono font-semibold uppercase tracking-widest text-accent',
            textPad,
          )}
        >
          {label}
        </span>
      </button>
    )
  }

  if (variant === 'pill') {
    const textSize = size === 'sm' ? 'text-[10px] px-3 py-1.5' : size === 'lg' ? 'text-xs px-5 py-2.5' : 'text-[11px] px-4 py-2'
    return (
      <button
        disabled={isDisabled}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-full cursor-pointer',
          'bg-accent text-white font-mono font-semibold uppercase tracking-widest',
          'border border-accent hover:bg-accent-ink hover:border-accent-ink',
          'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          textSize,
          className,
        )}
        {...props}
      >
        {loading && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
        {children}
      </button>
    )
  }

  const baseText = size === 'sm' ? 'text-[10px] px-3 py-1.5' : size === 'lg' ? 'text-xs px-5 py-2.5' : 'text-[11px] px-4 py-2'

  return (
    <button
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-[5px] cursor-pointer',
        'font-mono font-semibold uppercase tracking-widest',
        'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        baseText,
        variant === 'secondary' && [
          'bg-surface border border-line text-ink',
          'hover:border-accent hover:text-accent',
          'focus-visible:outline-accent',
        ],
        variant === 'ghost' && [
          'bg-transparent border border-transparent text-ink-soft',
          'hover:text-ink hover:bg-surface-2',
          'focus-visible:outline-accent',
        ],
        variant === 'danger' && [
          'bg-danger border border-danger text-white',
          'hover:bg-red-700 hover:border-red-700',
          'focus-visible:outline-danger',
        ],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
