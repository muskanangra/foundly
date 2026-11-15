import { useState, useEffect } from 'react'
import { Users, Package, CheckCheck, AlertTriangle, ExternalLink, Shield } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useToast } from '../components/ui/Toast'
import { getAdminStats, listReports, updateReport } from '../api/admin'
import { ApiError } from '../api/client'
import { formatDate } from '../lib/time'
import type { AdminStats, Report } from '../api/types'
import type { ReportStatus } from '../api/admin'

export default function AdminPage() {
  const { addToast } = useToast()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsError, setStatsError] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [reportsError, setReportsError] = useState(false)
  const [tab, setTab] = useState<ReportStatus>('open')
  const [actingId, setActingId] = useState<number | null>(null)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setStatsError(true))
  }, [])

  const loadReports = (status: ReportStatus) => {
    setReportsLoading(true)
    setReportsError(false)
    listReports(status)
      .then(setReports)
      .catch(() => setReportsError(true))
      .finally(() => setReportsLoading(false))
  }

  useEffect(() => { loadReports(tab) }, [tab])

  const handleAction = async (id: number, action: 'dismiss' | 'remove_item') => {
    setActingId(id)
    try {
      const updated = await updateReport(id, action)
      setReports((prev) => prev.filter((r) => r.id !== updated.id))
      addToast('success', action === 'dismiss' ? 'Report dismissed.' : 'Item removed.')
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.detail : 'Action failed. Try again.')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:py-16">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-ink-soft" aria-hidden="true" />
          <h1 className="text-2xl font-semibold text-ink md:text-3xl">Admin Dashboard</h1>
        </div>
        <p className="text-sm text-ink-soft">Manage reports and monitor campus activity.</p>
      </div>

      {/* Stats */}
      {statsError ? (
        <div className="mb-10 rounded-[10px] border border-line bg-surface p-4 font-mono text-xs uppercase tracking-widest text-ink-soft">
          Could not load stats.
        </div>
      ) : (
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Total users"
            value={stats?.users ?? null}
            icon={<Users size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Active items"
            value={stats?.active_items ?? null}
            icon={<Package size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Returned"
            value={stats?.returned_items ?? null}
            icon={<CheckCheck size={18} aria-hidden="true" />}
            accent="success"
          />
          <StatCard
            label="Open reports"
            value={stats?.open_reports ?? null}
            icon={<AlertTriangle size={18} aria-hidden="true" />}
            accent="danger"
          />
        </div>
      )}

      {/* Reports */}
      <div>
        <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-ink">
          Reports
        </h2>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-line">
          {(['open', 'dismissed', 'actioned'] as ReportStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`pb-3 px-4 font-mono text-xs font-semibold uppercase tracking-widest transition-colors ${
                tab === s
                  ? 'border-b-2 border-accent text-accent -mb-px'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {reportsLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[10px] bg-surface-2" />
            ))}
          </div>
        )}

        {reportsError && <ErrorState onRetry={() => loadReports(tab)} />}

        {!reportsLoading && !reportsError && reports.length === 0 && (
          <EmptyState
            title={`No ${tab} reports`}
            message={
              tab === 'open'
                ? 'All caught up — no reports need attention.'
                : `No ${tab} reports to show.`
            }
          />
        )}

        {!reportsLoading && !reportsError && reports.length > 0 && (
          <div className="flex flex-col gap-3">
            {reports.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                acting={actingId === report.id}
                showActions={tab === 'open'}
                onDismiss={() => void handleAction(report.id, 'dismiss')}
                onRemove={() => void handleAction(report.id, 'remove_item')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number | null
  icon: React.ReactNode
  accent?: 'success' | 'danger'
}) {
  return (
    <div className="rounded-[10px] border border-line bg-surface p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-[5px] border ${
        accent === 'success'
          ? 'border-success/20 bg-success/10 text-success'
          : accent === 'danger'
          ? 'border-danger/20 bg-danger/10 text-danger'
          : 'border-line bg-surface-2 text-ink-soft'
      }`}>
        {icon}
      </div>
      {value === null ? (
        <div className="h-7 w-16 animate-pulse rounded-[5px] bg-surface-2" />
      ) : (
        <p className="font-display text-2xl text-ink">{value.toLocaleString()}</p>
      )}
      <p className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">{label}</p>
    </div>
  )
}

function ReportRow({
  report,
  acting,
  showActions,
  onDismiss,
  onRemove,
}: {
  report: Report
  acting: boolean
  showActions: boolean
  onDismiss: () => void
  onRemove: () => void
}) {
  const reasonLabels: Record<string, string> = {
    fake: 'Fake listing',
    inappropriate: 'Inappropriate',
    duplicate: 'Duplicate',
    spam: 'Spam',
    other: 'Other',
  }

  return (
    <div className="rounded-[10px] border border-line bg-surface px-5 py-4">
      <div className="flex items-start gap-4">
        {/* Item thumbnail */}
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[5px] border border-line bg-surface-2">
          <img
            src={report.item.image_url}
            alt={report.item.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/items/${report.item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sm text-ink hover:text-accent transition-colors truncate"
            >
              {report.item.name}
              <ExternalLink size={11} className="inline ml-0.5 opacity-60" />
            </a>
            {report.status === 'actioned' && <StatusBadge status="removed" />}
            {report.status === 'dismissed' && (
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft border border-line rounded-[3px] px-2 py-0.5">
                dismissed
              </span>
            )}
            {report.status === 'open' && (
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-danger border border-danger/20 bg-danger/10 rounded-[3px] px-2 py-0.5">
                open
              </span>
            )}
          </div>
          <p className="text-xs text-ink-soft">
            <span className="font-medium">{reasonLabels[report.reason] ?? report.reason}</span>
            {report.note && ` — ${report.note}`}
          </p>
          <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft/50">
            Reported by {report.reporter.name} · {formatDate(report.created_at)}
          </p>
        </div>
      </div>

      {showActions && (
        <div className="mt-3 flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            loading={acting}
            onClick={onDismiss}
          >
            Dismiss
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={acting}
            onClick={onRemove}
          >
            Remove item
          </Button>
        </div>
      )}
    </div>
  )
}
