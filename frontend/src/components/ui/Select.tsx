import {
  useState,
  useRef,
  useId,
  useCallback,
  useEffect,
  type KeyboardEvent,
} from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  id?: string
  className?: string
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  error,
  disabled,
  id,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const generatedId = useId()
  const selectId = id ?? generatedId
  const listboxId = `${selectId}-listbox`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  const close = useCallback(() => {
    setOpen(false)
    setHighlighted(-1)
  }, [])

  const select = useCallback(
    (val: string) => {
      onChange(val)
      close()
      triggerRef.current?.focus()
    },
    [onChange, close],
  )

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  /* Scroll highlighted option into view */
  useEffect(() => {
    if (!open || highlighted < 0) return
    const item = listRef.current?.children[highlighted] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlighted, open])

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) { setOpen(true); setHighlighted(0) }
        else setHighlighted((h) => Math.min(h + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted((h) => Math.max(h - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!open) { setOpen(true); break }
        if (highlighted >= 0) select(options[highlighted].value)
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        close()
        break
    }
  }

  return (
    <div className={clsx('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label id={`${selectId}-label`} className="font-sans text-sm font-medium text-sapphire">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        id={selectId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={label ? `${selectId}-label` : undefined}
        aria-activedescendant={highlighted >= 0 ? `${listboxId}-${highlighted}` : undefined}
        aria-invalid={!!error}
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen((v) => !v) }}
        onKeyDown={handleKeyDown}
        className={clsx(
          'flex h-12 w-full items-center justify-between rounded-xl border bg-ivory px-4',
          'font-sans text-base text-left transition-colors duration-150 outline-none cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-danger focus:ring-2 focus:ring-danger/20'
            : open
              ? 'border-sapphire ring-2 ring-sapphire/15'
              : 'border-taupe hover:border-sapphire/50',
        )}
      >
        <span className={clsx(selectedOption ? 'text-navy' : 'text-taupe')}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={clsx(
            'shrink-0 text-sapphire transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={label ?? 'Options'}
          className={clsx(
            'absolute top-full left-0 right-0 z-50 mt-1',
            'max-h-60 overflow-y-auto rounded-xl border border-taupe bg-ivory',
            'shadow-lg',
            label && 'top-[calc(100%-0.375rem)]',
          )}
        >
          {options.map((opt, i) => (
            <li
              key={opt.value}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={opt.value === value}
              onMouseDown={(e) => { e.preventDefault(); select(opt.value) }}
              onMouseEnter={() => setHighlighted(i)}
              className={clsx(
                'cursor-pointer px-4 py-3 font-sans text-base transition-colors',
                opt.value === value
                  ? 'bg-champagne text-sapphire font-medium'
                  : i === highlighted
                    ? 'bg-champagne text-navy'
                    : 'text-navy hover:bg-champagne',
              )}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
