import { type InputHTMLAttributes, useId } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export function Input({ label, error, helper, className, id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-ink-soft">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full rounded-[5px] border bg-surface px-4 py-2.5 text-sm text-ink',
          'placeholder:text-ink-soft min-h-[44px]',
          'transition-colors duration-150 outline-none',
          error
            ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger/30'
            : 'border-line focus:border-accent focus:ring-1 focus:ring-accent/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${inputId}-helper`} className="text-xs text-ink-soft">
          {helper}
        </p>
      )}
    </div>
  )
}
