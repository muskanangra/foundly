import { X } from 'lucide-react'
import { clsx } from 'clsx'
import type { Category } from '../../api/types'

interface FilterBarProps {
  categories: Category[]
  categoryId: number
  location: string
  dateFrom: string
  dateTo: string
  sort: 'newest' | 'oldest'
  hasActiveFilters: boolean
  onCategoryChange: (id: number) => void
  onLocationChange: (loc: string) => void
  onDateFromChange: (d: string) => void
  onDateToChange: (d: string) => void
  onSortChange: (s: 'newest' | 'oldest') => void
  onClear: () => void
}

export function FilterBar({
  categories,
  categoryId,
  location,
  dateFrom,
  dateTo,
  sort,
  hasActiveFilters,
  onCategoryChange,
  onLocationChange,
  onDateFromChange,
  onDateToChange,
  onSortChange,
  onClear,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Category segments */}
      <div
        role="group"
        aria-label="Filter by category"
        className="flex gap-1 overflow-x-auto pb-1 no-scrollbar"
      >
        <button
          type="button"
          onClick={() => onCategoryChange(0)}
          aria-pressed={categoryId === 0}
          className={clsx(
            'shrink-0 rounded-[5px] border px-4 py-2',
            'font-mono text-[0.6rem] font-semibold uppercase tracking-widest whitespace-nowrap',
            'transition-colors duration-150',
            categoryId === 0
              ? 'border-accent bg-accent-tint text-accent'
              : 'border-line bg-surface text-ink-soft hover:border-accent/40 hover:text-ink',
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            aria-pressed={categoryId === cat.id}
            className={clsx(
              'shrink-0 rounded-[5px] border px-4 py-2',
              'font-mono text-[0.6rem] font-semibold uppercase tracking-widest whitespace-nowrap',
              'transition-colors duration-150',
              categoryId === cat.id
                ? 'border-accent bg-accent-tint text-accent'
                : 'border-line bg-surface text-ink-soft hover:border-accent/40 hover:text-ink',
            )}
          >
            {cat.name}
            {cat.active_count !== undefined && (
              <span className="ml-1.5 font-normal opacity-60">
                {cat.active_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[140px] flex-1">
          <label
            htmlFor="filter-location"
            className="font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-ink-soft"
          >
            Location
          </label>
          <input
            id="filter-location"
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="e.g. Library"
            className={clsx(
              'w-full rounded-[5px] border border-line bg-surface px-3 py-2 text-sm text-ink',
              'placeholder:text-ink-soft outline-none transition-colors',
              'focus:border-accent focus:ring-1 focus:ring-accent/30',
            )}
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[130px]">
          <label
            htmlFor="filter-from"
            className="font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-ink-soft"
          >
            From
          </label>
          <input
            id="filter-from"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={clsx(
              'w-full rounded-[5px] border border-line bg-surface px-3 py-2 text-sm text-ink',
              'outline-none transition-colors',
              'focus:border-accent focus:ring-1 focus:ring-accent/30',
            )}
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[130px]">
          <label
            htmlFor="filter-to"
            className="font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-ink-soft"
          >
            To
          </label>
          <input
            id="filter-to"
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className={clsx(
              'w-full rounded-[5px] border border-line bg-surface px-3 py-2 text-sm text-ink',
              'outline-none transition-colors',
              'focus:border-accent focus:ring-1 focus:ring-accent/30',
            )}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-sort"
            className="font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-ink-soft"
          >
            Sort
          </label>
          <select
            id="filter-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest')}
            className={clsx(
              'rounded-[5px] border border-line bg-surface px-3 py-2 text-sm text-ink',
              'outline-none transition-colors appearance-none cursor-pointer',
              'focus:border-accent focus:ring-1 focus:ring-accent/30',
            )}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-[5px] border border-line px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft transition-colors hover:border-danger/50 hover:text-danger"
          >
            <X size={11} aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
