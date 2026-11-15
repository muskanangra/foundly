import { type TextareaHTMLAttributes, useId } from 'react'
import clsx from 'clsx'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

export function Textarea({ label, error, helper, className, id, ...props }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-ink-soft">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={clsx(
          'w-full rounded-[5px] border bg-surface px-4 py-2.5 text-sm text-ink',
          'placeholder:text-ink-soft resize-y min-h-[100px]',
          'transition-colors duration-150 outline-none',
          error
            ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger/30'
            : 'border-line focus:border-accent focus:ring-1 focus:ring-accent/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${textareaId}-error`
            : helper
              ? `${textareaId}-helper`
              : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${textareaId}-helper`} className="text-xs text-ink-soft">
          {helper}
        </p>
      )}
    </div>
  )
}
