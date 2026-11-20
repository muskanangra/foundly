import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Button } from '../components/ui/Button'
import { SearchBar } from '../components/feed/SearchBar'
import { FilterBar } from '../components/feed/FilterBar'
import { ItemCard } from '../components/feed/ItemCard'
import { ItemCardSkeleton } from '../components/feed/ItemCardSkeleton'
import { listItems } from '../api/items'
import { listCategories } from '../api/categories'
import type { Item, Category } from '../api/types'

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

const PAGE_SIZE = 12

export default function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const cat = Number(searchParams.get('cat')) || 0
  const loc = searchParams.get('loc') ?? ''
  const dateFrom = searchParams.get('from') ?? ''
  const dateTo = searchParams.get('to') ?? ''
  const sort = (searchParams.get('sort') ?? 'newest') as 'newest' | 'oldest'

  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [loadingMore, setLoadingMore] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [retryCount, setRetryCount] = useState(0)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const fetchIdRef = useRef(0)

  const hasActiveFilters = !!(q || cat || loc || dateFrom || dateTo || sort !== 'newest')

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    const id = ++fetchIdRef.current
    setItems([])
    setPage(1)
    setTotal(0)
    setStatus('loading')

    listItems({
      q: q || undefined,
      category_id: cat || undefined,
      location: loc || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort,
      page: 1,
      page_size: PAGE_SIZE,
    })
      .then((result) => {
        if (id !== fetchIdRef.current) return
        setItems(result.items)
        setTotal(result.total)
        setStatus('success')
      })
      .catch(() => {
        if (id !== fetchIdRef.current) return
        setStatus('error')
      })
  }, [q, cat, loc, dateFrom, dateTo, sort, retryCount])

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1
    setLoadingMore(true)
    listItems({
      q: q || undefined,
      category_id: cat || undefined,
      location: loc || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort,
      page: nextPage,
      page_size: PAGE_SIZE,
    })
      .then((result) => {
        setItems((prev) => [...prev, ...result.items])
        setTotal(result.total)
        setPage(nextPage)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }, [q, cat, loc, dateFrom, dateTo, sort, page])

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) { next.set(key, value) } else { next.delete(key) }
      return next
    })
  }

  const handleSearch = (newQ: string) => setParam('q', newQ)
  const handleCategory = (id: number) => setParam('cat', id ? String(id) : '')
  const handleLocation = (v: string) => setParam('loc', v)
  const handleDateFrom = (v: string) => setParam('from', v)
  const handleDateTo = (v: string) => setParam('to', v)
  const handleSort = (v: 'newest' | 'oldest') => setParam('sort', v === 'newest' ? '' : v)
  const handleClear = () => { setSearchParams(new URLSearchParams()); setMobileFiltersOpen(false) }
  const handleRetry = () => setRetryCount((c) => c + 1)

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:py-14">
      {/* Page header */}
      <div className="flex items-baseline justify-between gap-4 mb-8">
        <h1 className="font-display text-[48px] md:text-[52px] font-semibold text-navy leading-tight">
          Found on campus
        </h1>
        {status === 'success' && (
          <p className="font-sans text-base text-sapphire/70 shrink-0">
            {total} item{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Mobile: search + filters button */}
      <div className="flex gap-3 mb-6 md:hidden">
        <div className="flex-1">
          <SearchBar key={q} initialQ={q} onSearch={handleSearch} />
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="relative h-12 rounded-xl border border-taupe bg-ivory px-3 font-sans text-base text-sapphire hover:bg-champagne transition-colors shrink-0"
          aria-label="Open filters"
        >
          <SlidersHorizontal size={18} />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-navy" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="md:flex md:gap-10">
        {/* Sidebar (desktop) */}
        <div className="hidden md:block w-[280px] shrink-0">
          <div className="sticky top-20">
            <div className="mb-5">
              <SearchBar key={q} initialQ={q} onSearch={handleSearch} />
            </div>
            <FilterBar
              categories={categories}
              categoryId={cat}
              location={loc}
              dateFrom={dateFrom}
              dateTo={dateTo}
              sort={sort}
              hasActiveFilters={hasActiveFilters}
              onCategoryChange={handleCategory}
              onLocationChange={handleLocation}
              onDateFromChange={handleDateFrom}
              onDateToChange={handleDateTo}
              onSortChange={handleSort}
              onClear={handleClear}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {status === 'loading' && (
            <div
              className="grid grid-cols-2 gap-4 sm:grid-cols-3"
              aria-busy="true"
              aria-label="Loading items"
            >
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
          )}

          {status === 'error' && (
            <ErrorState
              message="Couldn't load items. Check your connection and try again."
              onRetry={handleRetry}
            />
          )}

          {status === 'success' && items.length === 0 && (
            <EmptyState
              title="Nothing found here"
              message="Try different keywords, a broader location, or clearing the filters."
              actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
              onAction={hasActiveFilters ? handleClear : undefined}
            />
          )}

          {status === 'success' && items.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>

              {items.length < total && (
                <div className="mt-10 flex flex-col items-center gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    loading={loadingMore}
                    onClick={handleLoadMore}
                  >
                    {loadingMore ? 'Loading…' : `Load more (${total - items.length} remaining)`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters bottom sheet */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-ivory border-t border-taupe max-h-[80vh] overflow-y-auto md:hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-taupe/50">
              <h2 className="font-sans text-base font-semibold text-navy">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-1.5 text-sapphire hover:bg-champagne transition-colors"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              <FilterBar
                categories={categories}
                categoryId={cat}
                location={loc}
                dateFrom={dateFrom}
                dateTo={dateTo}
                sort={sort}
                hasActiveFilters={hasActiveFilters}
                onCategoryChange={handleCategory}
                onLocationChange={handleLocation}
                onDateFromChange={handleDateFrom}
                onDateToChange={handleDateTo}
                onSortChange={handleSort}
                onClear={handleClear}
              />
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Show results
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
