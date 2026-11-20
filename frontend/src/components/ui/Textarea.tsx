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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="font-sans text-sm font-medium text-sapphire">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={clsx(
          'w-full rounded-xl border bg-ivory px-4 py-3 text-base text-navy',
          'placeholder:text-taupe resize-y min-h-[100px]',
          'transition-colors duration-150 outline-none',
          error
            ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
            : 'border-taupe focus:border-sapphire focus:ring-2 focus:ring-sapphire/15',
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
        <p id={`${textareaId}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${textareaId}-helper`} className="text-sm text-sapphire/70">
          {helper}
        </p>
      )}
    </div>
  )
}
