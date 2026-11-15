import { clsx } from 'clsx'

type Status = 'active' | 'returned' | 'removed' | 'resolved'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const labels: Record<Status, string> = {
  active:   'ACTIVE',
  returned: 'RETURNED',
  removed:  'REMOVED',
  resolved: 'RESOLVED',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-[3px] border px-2.5 py-0.5',
        'font-mono text-[0.65rem] font-semibold uppercase tracking-widest',
        status === 'active'   && 'border-accent text-accent',
        status === 'returned' && 'border-success text-success',
        status === 'removed'  && 'border-danger text-danger',
        status === 'resolved' && 'border-line text-ink-soft',
        className,
      )}
    >
      {labels[status]}
    </span>
  )
}
