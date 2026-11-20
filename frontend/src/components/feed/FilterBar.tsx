import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { Select } from '../ui/Select'
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
  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Categories vertical list */}
      <div>
        <p className="font-sans text-sm font-medium text-sapphire mb-3">Category</p>
        <ul role="group" aria-label="Filter by category" className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={() => onCategoryChange(0)}
              aria-pressed={categoryId === 0}
              className={clsx(
                'flex items-center justify-between w-full px-3 py-2 rounded-xl font-sans text-[15px] transition-colors text-left',
                categoryId === 0
                  ? 'bg-navy text-ivory font-medium'
                  : 'text-sapphire hover:bg-champagne',
              )}
            >
              <span>All items</span>
              {categoryId === 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-ivory/60 shrink-0" aria-hidden="true" />
              )}
            </button>
          </li>
          {categories.length === 0 ? (
            /* Skeleton rows while categories load */
            Array.from({ length: 5 }).map((_, i) => (
              <li key={i}>
                <div className="h-9 rounded-xl bg-champagne animate-pulse" aria-hidden="true" />
              </li>
            ))
          ) : (
            categories.map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => onCategoryChange(cat.id)}
                  aria-pressed={categoryId === cat.id}
                  className={clsx(
                    'flex items-center justify-between w-full px-3 py-2 rounded-xl font-sans text-[15px] transition-colors text-left',
                    categoryId === cat.id
                      ? 'bg-navy text-ivory font-medium'
                      : 'text-sapphire hover:bg-champagne',
                  )}
                >
                  <span>{cat.name}</span>
                  <span className="flex items-center gap-2">
                    {/* oxlint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(cat as any).active_count !== undefined && (
                      <span className={clsx(
                        'font-sans text-sm',
                        categoryId === cat.id ? 'text-ivory/60' : 'text-sapphire/40',
                      )}>
                        {/* oxlint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(cat as any).active_count}
                      </span>
                    )}
                    {categoryId === cat.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-ivory/60 shrink-0" aria-hidden="true" />
                    )}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-location" className="font-sans text-sm font-medium text-sapphire">
          Location
        </label>
        <input
          id="filter-location"
          type="text"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="e.g. Library"
          className={clsx(
            'h-12 w-full rounded-xl border border-taupe bg-ivory px-4',
            'font-sans text-base text-navy placeholder:text-taupe',
            'outline-none transition-colors',
            'focus:border-sapphire focus:ring-2 focus:ring-sapphire/15',
          )}
        />
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-from" className="font-sans text-sm font-medium text-sapphire">
            From
          </label>
          <input
            id="filter-from"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={clsx(
              'h-12 w-full rounded-xl border border-taupe bg-ivory px-3',
              'font-sans text-base text-navy',
              'outline-none transition-colors',
              'focus:border-sapphire focus:ring-2 focus:ring-sapphire/15',
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-to" className="font-sans text-sm font-medium text-sapphire">
            To
          </label>
          <input
            id="filter-to"
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className={clsx(
              'h-12 w-full rounded-xl border border-taupe bg-ivory px-3',
              'font-sans text-base text-navy',
              'outline-none transition-colors',
              'focus:border-sapphire focus:ring-2 focus:ring-sapphire/15',
            )}
          />
        </div>
      </div>

      {/* Sort */}
      <Select
        label="Sort"
        options={sortOptions}
        value={sort}
        onChange={(v) => onSortChange(v as 'newest' | 'oldest')}
      />

      {/* Clear */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 font-sans text-sm text-danger hover:underline transition-colors"
        >
          <X size={13} aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  )
}
