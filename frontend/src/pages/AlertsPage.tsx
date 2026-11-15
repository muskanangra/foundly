import { useState, useEffect, useId } from 'react'
import { Trash2, BellPlus } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useToast } from '../components/ui/Toast'
import { listAlerts, createAlert, deleteAlert } from '../api/alerts'
import { listCategories } from '../api/categories'
import { ApiError } from '../api/client'
import { formatDate } from '../lib/time'
import type { MatchAlert, Category } from '../api/types'

export default function AlertsPage() {
  const { addToast } = useToast()
  const formId = useId()

  const [alerts, setAlerts] = useState<MatchAlert[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /* Form state */
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [location, setLocation] = useState('')
  const [fieldError, setFieldError] = useState('')

  const load = () => {
    setLoading(true)
    setError(false)
    Promise.all([listAlerts(), listCategories()])
      .then(([a, c]) => { setAlerts(a); setCategories(c) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!keyword.trim()) { setFieldError('Keyword is required'); return }
    setFieldError('')
    setCreating(true)
    try {
      const alert = await createAlert({
        keyword: keyword.trim(),
        ...(categoryId ? { category_id: Number(categoryId) } : {}),
        ...(location.trim() ? { location: location.trim() } : {}),
      })
      setAlerts((prev) => [alert, ...prev])
      setKeyword('')
      setCategoryId('')
      setLocation('')
      addToast('success', "Alert saved! You'll be notified when matching items are posted.")
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.detail : 'Failed to create alert. Try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await deleteAlert(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.detail : 'Failed to delete alert.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink md:text-3xl">My Alerts</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Get notified when items matching your criteria are posted.
        </p>
      </div>

      {/* Create form */}
      <div className="mb-10 rounded-[10px] border border-line bg-surface p-5 md:p-6">
        <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-ink">
          Create a new alert
        </h2>
        <div className="flex flex-col gap-4">
          <Input
            id={`${formId}-keyword`}
            label="Keyword"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setFieldError('') }}
            error={fieldError}
            placeholder="e.g. laptop, bottle, keys"
          />
          <Select
            id={`${formId}-category`}
            label="Category (optional)"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Any category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input
            id={`${formId}-location`}
            label="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Library, Block B"
          />
          <div className="pt-1">
            <Button variant="primary" size="md" loading={creating} onClick={handleCreate}>
              <BellPlus size={14} aria-hidden="true" />
              {creating ? 'Saving…' : 'Create alert'}
            </Button>
          </div>
        </div>
      </div>

      {/* Alert list */}
      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[10px] bg-surface-2" />
          ))}
        </div>
      )}

      {error && <ErrorState onRetry={load} />}

      {!loading && !error && alerts.length === 0 && (
        <EmptyState
          title="No alerts yet"
          message="Create your first alert above to start getting notified."
        />
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              deleting={deletingId === alert.id}
              onDelete={() => void handleDelete(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AlertRow({
  alert,
  deleting,
  onDelete,
}: {
  alert: MatchAlert
  deleting: boolean
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-4 rounded-[10px] border border-line bg-surface px-5 py-3.5">
      <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-semibold text-sm text-ink">"{alert.keyword}"</span>
        {alert.category && (
          <Chip>{alert.category.name}</Chip>
        )}
        {alert.location && (
          <Chip>{alert.location}</Chip>
        )}
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft/50">
          {formatDate(alert.created_at)}
        </span>
      </div>
      <button
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Delete alert for "${alert.keyword}"`}
        className="rounded-[5px] p-1.5 text-ink-soft hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-50"
      >
        {deleting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-ink-soft" aria-hidden="true" />
        ) : (
          <Trash2 size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
