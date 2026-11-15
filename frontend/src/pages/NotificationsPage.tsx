import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, MessageSquare } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useRealtime } from '../context/RealtimeProvider'
import { useToast } from '../components/ui/Toast'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications'
import { formatRelativeTime } from '../lib/time'
import type { Notification } from '../api/types'

export default function NotificationsPage() {
  const { clearUnread } = useRealtime()
  const { addToast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const load = () => {
    setLoading(true)
    setError(false)
    listNotifications()
      .then(setNotifications)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    clearUnread()
  }, [clearUnread])

  const handleMarkRead = async (n: Notification) => {
    if (n.is_read) return
    try {
      const updated = await markNotificationRead(n.id)
      setNotifications((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } catch {
      /* optimistic ignore */
    }
  }

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {
      addToast('error', 'Could not mark all as read. Try again.')
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink md:text-3xl">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            loading={markingAll}
            onClick={handleMarkAll}
          >
            <CheckCheck size={14} aria-hidden="true" />
            Mark all read
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col divide-y divide-line rounded-[10px] border border-line overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4 animate-pulse">
              <div className="h-9 w-9 shrink-0 rounded-[5px] bg-surface-2" />
              <div className="flex flex-1 flex-col gap-2 justify-center">
                <div className="h-3 w-48 rounded bg-surface-2" />
                <div className="h-2.5 w-64 rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorState onRetry={load} />}

      {!loading && !error && notifications.length === 0 && (
        <EmptyState
          icon={<Bell size={24} aria-hidden="true" />}
          title="No notifications"
          message="You'll see updates about your posts and conversations here."
        />
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="flex flex-col divide-y divide-line rounded-[10px] border border-line overflow-hidden bg-surface">
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              onRead={() => void handleMarkRead(n)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationRow({
  notification: n,
  onRead,
}: {
  notification: Notification
  onRead: () => void
}) {
  const isMessage = n.type === 'message'

  return (
    <Link
      to={n.link}
      onClick={onRead}
      className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-2 ${
        n.is_read ? '' : 'bg-accent-tint'
      }`}
    >
      {/* Type icon */}
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border ${
          isMessage
            ? 'border-accent/20 bg-accent-tint text-accent'
            : 'border-line bg-surface-2 text-ink-soft'
        }`}
      >
        {isMessage ? (
          <MessageSquare size={16} aria-hidden="true" />
        ) : (
          <Bell size={16} aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${n.is_read ? 'font-medium text-ink' : 'font-semibold text-ink'}`}>
            {n.title}
          </span>
          <span className="shrink-0 font-mono text-[0.6rem] text-ink-soft/60">
            {formatRelativeTime(n.created_at)}
          </span>
        </div>
        <span className="truncate text-xs text-ink-soft">{n.body}</span>
      </div>

      {!n.is_read && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
      )}
    </Link>
  )
}
