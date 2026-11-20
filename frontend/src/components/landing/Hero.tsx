import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ChangeEvent, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { listItems } from '../../api/items'
import { searchAutocomplete } from '../../api/search'
import { formatRelativeTime } from '../../lib/time'
import type { Item } from '../../api/types'

/* ── Word reveal animation ────────────────────────────────────── */
function RevealWord({
  children,
  delay,
  italic,
  sapphire,
}: {
  children: string
  delay: number
  italic?: boolean
  sapphire?: boolean
}) {
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
      <motion.span
        style={{ display: 'inline-block' }}
        initial={{ y: '110%' }}
        animate={{ y: 0 }}
        transition={{ delay, duration: 0.65, ease: [0.25, 0, 0, 1] }}
        className={`${italic ? 'italic' : ''} ${sapphire ? 'text-[#5B7CB0]' : ''}`}
      >
        {children}
      </motion.span>
    </span>
  )
}

/* ── Hero search bar ──────────────────────────────────────────── */
function HeroSearch() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listboxId = 'hero-search-listbox'
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); setIsOpen(false); return }
    try {
      const r = await searchAutocomplete(q)
      setSuggestions(r.suggestions)
      setIsOpen(r.suggestions.length > 0)
    } catch {
      setSuggestions([]); setIsOpen(false)
    }
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue(val)
    setActiveIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void fetchSuggestions(val), 300)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const q = activeIndex >= 0 ? suggestions[activeIndex] : value
      setIsOpen(false)
      navigate(`/feed?q=${encodeURIComponent(q.trim())}`)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setIsOpen(false)
    navigate(`/feed?q=${encodeURIComponent(value.trim())}`)
  }

  return (
    <form onSubmit={submit} role="search" className="relative w-full max-w-[560px]">
      <label htmlFor="hero-search-input" className="sr-only">Search found items</label>
      <div className="relative flex items-center">
        <Search size={18} className="pointer-events-none absolute left-5 text-sapphire/60" aria-hidden="true" />
        <input
          ref={inputRef}
          id="hero-search-input"
          type="search"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="What did you lose?"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={isOpen && activeIndex >= 0 ? `hero-suggestion-${activeIndex}` : undefined}
          className="w-full h-14 rounded-full bg-ivory border border-ivory/30 pl-12 pr-6 font-sans text-base text-navy placeholder:text-sapphire/50 outline-none focus:ring-2 focus:ring-ivory/40 transition-all"
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-taupe bg-ivory shadow-xl"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              id={`hero-suggestion-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => { setValue(s); setIsOpen(false); navigate(`/feed?q=${encodeURIComponent(s)}`) }}
              className={`cursor-pointer px-5 py-3 font-sans text-base transition-colors ${
                i === activeIndex ? 'bg-champagne text-sapphire' : 'text-navy hover:bg-champagne'
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}

/* ── Fanned item cards ────────────────────────────────────────── */
function FannedCards({ items }: { items: Item[] }) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-champagne border border-taupe/40 p-8 text-center max-w-xs">
        <p className="font-display text-[22px] italic text-sapphire">Nothing posted yet.</p>
        <p className="mt-2 font-sans text-sm text-sapphire/70">Be the first to post a find.</p>
        <button
          onClick={() => navigate('/post')}
          className="mt-4 rounded-full border-[1.5px] border-sapphire text-sapphire px-4 py-2 font-sans text-sm font-medium hover:bg-champagne transition-colors"
        >
          Post a find
        </button>
      </div>
    )
  }

  const rotations = [-8, -2, 4]
  const translations = ['-12px, 8px', '-4px, 2px', '4px, -4px']

  return (
    <div className="relative h-72 w-64 md:w-72 shrink-0">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          className="absolute inset-0 cursor-pointer"
          style={{
            transform: `rotate(${rotations[i]}deg) translate(${translations[i]})`,
            zIndex: i,
          }}
          whileHover={{ scale: 1.03, zIndex: 10 }}
          onClick={() => navigate(`/items/${item.id}`)}
        >
          <div className="w-full h-full rounded-2xl bg-champagne border border-taupe/40 overflow-hidden shadow-sm">
            <div className="h-3/4 bg-champagne overflow-hidden">
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="px-3 py-2">
              <p className="font-sans text-sm font-medium text-navy truncate">{item.name}</p>
              <p className="font-sans text-xs text-sapphire/70 truncate">Found at {item.location}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ── Ticker ───────────────────────────────────────────────────── */
function Ticker({ items }: { items: Item[] }) {
  const categoryNames = ['Electronics', 'Bags', 'Accessories', 'Books', 'Clothing', 'Keys', 'Stationery']

  const tickerItems = items.length > 0
    ? items.map((item) => `${item.name} · found at ${item.location} · ${formatRelativeTime(item.created_at)}`)
    : categoryNames.map((c) => `${c} · found on campus`)

  const doubled = [...tickerItems, ...tickerItems]

  return (
    <div
      className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-ivory/10 py-3"
      aria-hidden="true"
    >
      <div className="ticker-track flex gap-8 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="font-sans text-sm text-ivory/70 shrink-0">
            {item} <span className="text-ivory/30">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Main Hero component ──────────────────────────────────────── */
export function Hero() {
  const navigate = useNavigate()
  const shouldReduce = useReducedMotion()
  const [heroItems, setHeroItems] = useState<Item[]>([])
  const [lineVisible, setLineVisible] = useState(false)

  useEffect(() => {
    listItems({ page_size: 3, sort: 'newest' })
      .then((r) => setHeroItems(r.items))
      .catch(() => {})
  }, [])

  /* Show the decorative line after words reveal */
  useEffect(() => {
    if (shouldReduce) { setLineVisible(true); return }
    const t = setTimeout(() => setLineVisible(true), 1600)
    return () => clearTimeout(t)
  }, [shouldReduce])

  const wordDelay = shouldReduce ? 0 : 0.1

  return (
    <section
      aria-label="Foundly hero"
      className="relative bg-navy min-h-[90vh] flex flex-col -mt-16 pt-16"
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 flex flex-col md:flex-row items-center gap-12 md:gap-16 flex-1 py-20 md:py-28">
        {/* Left: headline + search + buttons */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Headline */}
          <div>
            <h1
              className="font-display text-ivory leading-tight"
              style={{ fontSize: 'clamp(56px, 8vw, 130px)', lineHeight: 1.05 }}
            >
              <span className="flex flex-wrap gap-x-[0.25em]">
                <RevealWord delay={0}              >Lost</RevealWord>
                <RevealWord delay={wordDelay}      >today.</RevealWord>
              </span>
              <span className="flex flex-wrap gap-x-[0.25em]">
                <RevealWord delay={wordDelay * 2} italic sapphire>Foundly</RevealWord>
                <RevealWord delay={wordDelay * 3} >tomorrow.</RevealWord>
              </span>
            </h1>

            {/* Decorative line */}
            <div className="mt-4 h-px bg-ivory/20 overflow-hidden">
              {lineVisible && <div className="line-draw h-px bg-ivory/40" />}
            </div>
          </div>

          <p className="font-sans text-base text-ivory/70 max-w-sm leading-relaxed">
            Every item found on campus, in one place. Search it, claim it, chat with the finder.
          </p>

          <HeroSearch />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/feed')}
              className="rounded-full bg-ivory text-navy px-6 py-3 font-sans text-[15px] font-medium hover:bg-champagne transition-colors"
            >
              Browse found items
            </button>
            <button
              onClick={() => navigate('/post')}
              className="rounded-full border-[1.5px] border-ivory/60 text-ivory px-6 py-3 font-sans text-[15px] font-medium hover:bg-white/10 transition-colors"
            >
              Post a find
            </button>
          </div>
        </div>

        {/* Right: fanned cards */}
        <div className="hidden lg:flex items-center justify-center shrink-0">
          <FannedCards items={heroItems} />
        </div>
      </div>

      {/* Ticker */}
      <Ticker items={heroItems} />
    </section>
  )
}
