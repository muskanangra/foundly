import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { Search, X } from 'lucide-react'
import { clsx } from 'clsx'
import { searchAutocomplete } from '../../api/search'

interface SearchBarProps {
  initialQ: string
  onSearch: (q: string) => void
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <>
      {idx > 0 && <span>{text.slice(0, idx)}</span>}
      <span className="font-semibold text-accent">{text.slice(idx, idx + query.length)}</span>
      {idx + query.length < text.length && <span>{text.slice(idx + query.length)}</span>}
    </>
  )
}

export function SearchBar({ initialQ, onSearch }: SearchBarProps) {
  const [value, setValue] = useState(initialQ)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listboxId = 'search-autocomplete-listbox'
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); setIsOpen(false); return }
    try {
      const result = await searchAutocomplete(q)
      setSuggestions(result.suggestions)
      setIsOpen(result.suggestions.length > 0)
    } catch {
      setSuggestions([]); setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue(val)
    setActiveIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void fetchSuggestions(val), 300)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        const selected = suggestions[activeIndex]
        setValue(selected); setSuggestions([]); setIsOpen(false); setActiveIndex(-1); onSearch(selected)
      } else {
        setSuggestions([]); setIsOpen(false); onSearch(value)
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]); setIsOpen(false); setActiveIndex(-1)
    }
  }

  const handleSelectSuggestion = (s: string) => {
    setValue(s); setSuggestions([]); setIsOpen(false); setActiveIndex(-1); onSearch(s)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setValue(''); setSuggestions([]); setIsOpen(false); setActiveIndex(-1); onSearch('')
    inputRef.current?.focus()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSuggestions([]); setIsOpen(false); onSearch(value)
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative">
      <label htmlFor="feed-search" className="sr-only">Search found items</label>
      <div className="relative flex items-center">
        <Search
          size={18}
          className="pointer-events-none absolute left-5 text-ink-soft"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="feed-search"
          type="search"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search found items…"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
          }
          className={clsx(
            'w-full rounded-[5px] border border-line bg-surface py-3.5 pl-12 pr-12',
            'text-sm text-ink placeholder:text-ink-soft',
            'outline-none transition-colors',
            'focus:border-accent focus:ring-2 focus:ring-accent/20',
            'h-14',
          )}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-4 rounded-[5px] p-1 text-ink-soft hover:text-ink transition-colors"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full left-0 right-0 z-20 mt-1 overflow-hidden rounded-[5px] border border-line bg-surface shadow-xl"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              id={`suggestion-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelectSuggestion(s)}
              className={clsx(
                'cursor-pointer px-5 py-2.5 text-sm transition-colors',
                i === activeIndex
                  ? 'bg-accent-tint text-accent'
                  : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
              )}
            >
              <HighlightedText text={s} query={value} />
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
