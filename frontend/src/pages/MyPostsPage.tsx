import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, PlusCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ItemCard } from '../components/feed/ItemCard'
import { ItemCardSkeleton } from '../components/feed/ItemCardSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { getMyItems, markItemReturned } from '../api/items'
import { ApiError } from '../api/client'
import type { Item } from '../api/types'

type Tab = 'active' | 'closed'

export default function MyPostsPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<Tab>('active')
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [marking, setMarking] = useState(false)

  const load = () => {
    setLoading(true)
    setError(false)
    getMyItems()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activeItems = items.filter((i) => i.status === 'active')
  const closedItems = items.filter((i) => i.status !== 'active')
  const displayed = tab === 'active' ? activeItems : closedItems

  const handleMarkReturned = async () => {
    if (!confirmId) return
    setMarking(true)
    try {
      const updated = await markItemReturned(confirmId)
      setItems((prev) => prev.map((i) => (i.id === confirmId ? updated : i)))
      addToast('success', 'Item marked as returned!')
      setConfirmId(null)
      setTab('closed')
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.detail : 'Failed to update. Try again.')
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:py-16">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[40px] md:text-[48px] font-semibold text-navy leading-tight">
            My Posts
          </h1>
          <p className="mt-2 font-sans text-base text-sapphire/70">
            Items you've posted as found on campus.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/post')}>
          <PlusCircle size={14} aria-hidden="true" />
          Post a find
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-6 border-b border-taupe/40">
        {(['active', 'closed'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 font-sans text-[15px] font-medium transition-colors relative ${
              tab === t
                ? 'text-navy after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-navy after:rounded-t-sm'
                : 'text-sapphire/50 hover:text-sapphire'
            }`}
          >
            {t === 'active' ? `Active (${activeItems.length})` : `Returned / Removed (${closedItems.length})`}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && <ErrorState onRetry={load} />}

      {!loading && !error && displayed.length === 0 && (
        <EmptyState
          title={tab === 'active' ? 'No active posts' : 'No closed posts'}
          message={
            tab === 'active'
              ? "You haven't posted any found items yet."
              : 'None of your posts have been returned or removed yet.'
          }
          actionLabel={tab === 'active' ? 'Post a find' : undefined}
          onAction={tab === 'active' ? () => navigate('/post') : undefined}
        />
      )}

      {!loading && !error && displayed.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {displayed.map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              <ItemCard
                item={item}
                showLink
                showStatus={item.status !== 'active'}
              />
              {item.status === 'active' && (
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/items/${item.id}/edit`)}
                    aria-label={`Edit ${item.name}`}
                    className="flex-1"
                  >
                    <Pencil size={11} aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmId(item.id)}
                    aria-label={`Mark ${item.name} as returned`}
                    className="flex-1"
                  >
                    Returned
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm mark-returned modal */}
      <Modal
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        title="Mark as returned?"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={marking} onClick={handleMarkReturned}>
              Yes, mark returned
            </Button>
          </>
        }
      >
        <p className="font-sans text-base text-sapphire/70">
          Are you sure you have returned this item? This will remove it from the active listings and
          the post will be closed.
        </p>
      </Modal>
    </div>
  )
}
