import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const handleClear = () => setSearchParams(new URLSearchParams())
  const handleRetry = () => setRetryCount((c) => c + 1)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink md:text-3xl mb-1">
          Items found at JUIT
        </h1>
        <p className="text-sm text-ink-soft">
          Browse items found on campus — search, filter, and contact finders privately.
        </p>
      </div>

      <div className="mb-5">
        <SearchBar key={q} initialQ={q} onSearch={handleSearch} />
      </div>

      <div className="mb-8">
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

      {status === 'success' && items.length > 0 && (
        <p className="mb-5 font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">
          {items.length} of {total} item{total !== 1 ? 's' : ''} found
        </p>
      )}

      {status === 'loading' && (
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
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
          title="No found items match your search"
          message="Try different keywords, a broader location, or clearing the filters."
          actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
          onAction={hasActiveFilters ? handleClear : undefined}
        />
      )}

      {status === 'success' && items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
  )
}
