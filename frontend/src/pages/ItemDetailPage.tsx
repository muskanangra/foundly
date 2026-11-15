import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  MessageCircle,
  Flag,
  Pencil,
  CheckCircle,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Loader'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { getItem } from '../api/items'
import { startConversation } from '../api/conversations'
import { createReport } from '../api/reports'
import { ApiError } from '../api/client'
import { formatRelativeTime, formatDate, formatDateTime } from '../lib/time'
import type { Item, PublicUser, Conversation } from '../api/types'
import type { ReportReason } from '../api/reports'

type PageStatus = 'loading' | 'success' | 'notfound' | 'error'

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'fake',          label: 'Fake listing' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'duplicate',     label: 'Duplicate post' },
  { value: 'spam',          label: 'Spam' },
  { value: 'other',         label: 'Other' },
]

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, isLoading: authLoading } = useAuth()
  const { addToast } = useToast()

  const backTo = (location.state as { from?: string } | null)?.from ?? '/feed'

  const [item, setItem] = useState<Item | null>(null)
  const [status, setStatus] = useState<PageStatus>('loading')

  const [contactLoading, setContactLoading] = useState(false)
  const [finderModal, setFinderModal] = useState(false)
  const [finder, setFinder] = useState<PublicUser | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)

  const [reportModal, setReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>('fake')
  const [reportNote, setReportNote] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  const itemId = Number(id)

  const loadItem = useCallback(() => {
    if (!itemId) { setStatus('notfound'); return }
    setStatus('loading')
    getItem(itemId)
      .then((data) => { setItem(data); setStatus('success') })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setStatus('notfound')
        } else {
          setStatus('error')
        }
      })
  }, [itemId])

  useEffect(() => { loadItem() }, [loadItem])

  const handleContactFinder = async () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }
    setContactLoading(true)
    try {
      const result = await startConversation(itemId)
      setFinder(result.finder)
      setConversation(result.conversation)
      setFinderModal(true)
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.detail : "Couldn't connect. Try again.")
    } finally {
      setContactLoading(false)
    }
  }

  const handleReport = () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }
    setReportModal(true)
  }

  const handleSubmitReport = async () => {
    if (!item) return
    setReportLoading(true)
    try {
      await createReport(item.id, reportReason, reportNote.trim() || undefined)
      addToast('success', 'Report submitted. Thank you for helping keep Foundly safe.')
      setReportModal(false)
      setReportNote('')
      setReportReason('fake')
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.detail : "Couldn't submit report. Try again.")
    } finally {
      setReportLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 md:py-16">
        <Skeleton className="mb-6 h-5 w-24" />
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <Skeleton className="aspect-[4/3] rounded-[10px]" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="mt-4 h-20 w-full" />
            <Skeleton className="mt-2 h-10 w-40" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'notfound') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft mb-4">Item not found</p>
        <h1 className="mb-3 text-2xl font-semibold text-ink">This item doesn't exist</h1>
        <p className="mb-8 text-sm text-ink-soft">
          It may have been removed by an admin.
        </p>
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          <ArrowLeft size={12} aria-hidden="true" />
          Back to browse
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <ErrorState onRetry={loadItem} />
      </div>
    )
  }

  if (!item) return null

  const isOwner = item.is_owner
  const isRemoved = item.status === 'removed'
  const idStr = `F-${String(item.id).padStart(4, '0')}`

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:py-16">
      <Link
        to={backTo}
        className="mb-8 inline-flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft size={11} aria-hidden="true" />
        Back
      </Link>

      <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
        {/* Image — large, sharp (not pixelated on detail page) */}
        <div className="aspect-[4/3] overflow-hidden rounded-[10px] border border-line bg-surface-2">
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          {/* ID badge + status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-accent tracking-widest">{idStr}</span>
            {item.status === 'returned' && <StatusBadge status="returned" />}
            {isRemoved && <StatusBadge status="removed" />}
            {item.status === 'active' && (
              <Badge variant="accent">{item.category.name}</Badge>
            )}
            {item.status !== 'active' && (
              <Badge variant="muted">{item.category.name}</Badge>
            )}
            {item.status === 'returned' && (
              <Badge variant="success">
                <CheckCircle size={10} aria-hidden="true" /> Returned
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-light text-ink md:text-3xl leading-tight">{item.name}</h1>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <MapPin size={13} aria-hidden="true" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Calendar size={13} aria-hidden="true" />
              <span>Found on {formatDate(item.found_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Clock size={13} aria-hidden="true" />
              <span>Found at {formatDateTime(item.found_at)}</span>
            </div>
          </div>

          {item.description && (
            <p className="text-sm leading-relaxed text-ink-soft">{item.description}</p>
          )}

          <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft/50">
            Posted {formatRelativeTime(item.created_at)}
          </p>

          {!isRemoved && (
            <div className="flex flex-wrap gap-3 pt-1">
              {isOwner ? (
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft/60">
                    This is your post
                  </p>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => navigate(`/items/${item.id}/edit`)}
                  >
                    <Pencil size={12} aria-hidden="true" />
                    Edit post
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  loading={contactLoading || authLoading}
                  onClick={handleContactFinder}
                >
                  <MessageCircle size={13} aria-hidden="true" />
                  Contact Finder
                </Button>
              )}

              {!isOwner && (
                <Button variant="ghost" size="md" onClick={handleReport} aria-label="Report this item">
                  <Flag size={13} aria-hidden="true" />
                  Report
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Finder modal — ONLY place finder name may appear */}
      <Modal
        open={finderModal}
        onClose={() => setFinderModal(false)}
        title="Finder identified"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setFinderModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { if (conversation) navigate(`/chats/${conversation.id}`) }}
            >
              Open chat
            </Button>
          </>
        }
      >
        {finder && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-soft">This item was posted by:</p>
            <p className="text-lg font-semibold text-ink">{finder.name}</p>
            <p className="text-xs text-ink-soft">
              You can now chat privately with the finder to arrange the return.
            </p>
          </div>
        )}
      </Modal>

      {/* Report modal */}
      <Modal
        open={reportModal}
        onClose={() => setReportModal(false)}
        title="Report this item"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setReportModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={reportLoading}
              onClick={handleSubmitReport}
            >
              Submit report
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Reason"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value as ReportReason)}
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <div className="flex flex-col gap-1">
            <label htmlFor="report-note" className="font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-ink-soft">
              Additional note{' '}
              <span className="font-normal normal-case text-ink-soft/60">(optional)</span>
            </label>
            <textarea
              id="report-note"
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              placeholder="Any extra context…"
              rows={3}
              className="w-full resize-none rounded-[5px] border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
