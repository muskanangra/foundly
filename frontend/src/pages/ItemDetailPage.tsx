import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, MessageCircle, Flag, Pencil, CheckCircle } from 'lucide-react'
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
import { formatDateTime } from '../lib/time'
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
      <div className="mx-auto max-w-[960px] px-6 py-10 md:py-16">
        <Skeleton className="mb-8 h-5 w-20 rounded-full" />
        <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-5 w-1/2 rounded-xl" />
            <Skeleton className="h-5 w-2/5 rounded-xl" />
            <Skeleton className="mt-4 h-20 w-full rounded-xl" />
            <Skeleton className="mt-2 h-12 w-40 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'notfound') {
    return (
      <div className="mx-auto max-w-[960px] px-6 py-20 text-center">
        <p className="font-display text-[28px] italic text-sapphire mb-3">Item not found</p>
        <p className="font-sans text-base text-sapphire/70 mb-8">
          It may have been removed by an admin.
        </p>
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 font-sans text-base text-sapphire hover:underline"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to browse
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-[960px] px-6 py-10">
        <ErrorState onRetry={loadItem} />
      </div>
    )
  }

  if (!item) return null

  const isOwner = item.is_owner
  const isRemoved = item.status === 'removed'
  const idStr = `F-${String(item.id).padStart(4, '0')}`

  return (
    <div className="mx-auto max-w-[960px] px-6 py-10 md:py-16">
      <Link
        to={backTo}
        className="mb-8 inline-flex items-center gap-2 font-sans text-sm text-sapphire hover:text-navy transition-colors"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back
      </Link>

      <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-champagne border border-taupe/30">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover"
              decoding="async"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="font-display text-[64px] italic text-taupe/50" aria-hidden="true">F</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          {/* ID + status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-sm font-medium text-sapphire/60">{idStr}</span>
            {item.status === 'returned' && <StatusBadge status="returned" />}
            {isRemoved && <StatusBadge status="removed" />}
            <Badge variant={item.status === 'active' ? 'default' : 'muted'}>
              {item.category.name}
            </Badge>
            {item.status === 'returned' && (
              <Badge variant="success">
                <CheckCircle size={12} aria-hidden="true" /> Returned
              </Badge>
            )}
          </div>

          <h1 className="font-display text-[40px] md:text-[48px] font-semibold text-navy leading-tight">
            {item.name}
          </h1>

          {/* Single date + location line */}
          <div className="flex items-start gap-2 font-sans text-base text-sapphire/70">
            <Calendar size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>Found on {formatDateTime(item.found_at)} · {item.location}</span>
          </div>

          {item.description && (
            <p className="font-sans text-base leading-relaxed text-sapphire/80">{item.description}</p>
          )}

          {!isRemoved && (
            <div className="flex flex-wrap gap-3 pt-1">
              {isOwner ? (
                <div className="flex flex-col gap-2">
                  <p className="font-sans text-sm text-sapphire/50">This is your post</p>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => navigate(`/items/${item.id}/edit`)}
                  >
                    <Pencil size={14} aria-hidden="true" />
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
                  <MessageCircle size={15} aria-hidden="true" />
                  Contact finder
                </Button>
              )}

              {!isOwner && (
                <Button variant="ghost" size="md" onClick={handleReport} aria-label="Report this item">
                  <Flag size={14} aria-hidden="true" />
                  Report
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Finder modal */}
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
            <p className="font-sans text-base text-sapphire/70">This item was posted by:</p>
            <p className="font-display text-[28px] font-semibold text-navy">{finder.name}</p>
            <p className="font-sans text-sm text-sapphire/70">
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
              variant="danger"
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
            options={REPORT_REASONS}
            value={reportReason}
            onChange={(v) => setReportReason(v as ReportReason)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-note" className="font-sans text-sm font-medium text-sapphire">
              Additional note{' '}
              <span className="font-normal text-sapphire/50">(optional)</span>
            </label>
            <textarea
              id="report-note"
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              placeholder="Any extra context…"
              rows={3}
              className="w-full resize-none rounded-xl border border-taupe bg-ivory px-4 py-3 font-sans text-base text-navy placeholder:text-taupe outline-none transition-colors focus:border-sapphire focus:ring-2 focus:ring-sapphire/15"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
