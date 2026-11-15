import { type SelectHTMLAttributes, useId } from 'react'
import clsx from 'clsx'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helper?: string
}

export function Select({ label, error, helper, className, id, children, ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-ink-soft">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'w-full rounded-[5px] border bg-surface px-4 py-2.5 text-sm text-ink',
          'min-h-[44px] transition-colors duration-150 outline-none',
          'appearance-none cursor-pointer',
          error
            ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger/30'
            : 'border-line focus:border-accent focus:ring-1 focus:ring-accent/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${selectId}-error` : helper ? `${selectId}-helper` : undefined
        }
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${selectId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${selectId}-helper`} className="text-xs text-ink-soft">
          {helper}
        </p>
      )}
    </div>
  )
}
