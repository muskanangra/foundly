import { clsx } from 'clsx'

type Status = 'active' | 'returned' | 'removed' | 'resolved'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const labels: Record<Status, string> = {
  active:   'Active',
  returned: 'Returned',
  removed:  'Removed',
  resolved: 'Resolved',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-3 py-0.5 font-sans text-sm font-medium',
        status === 'active'   && 'border-sapphire/30 text-sapphire bg-champagne',
        status === 'returned' && 'border-success/30 text-success bg-success/10',
        status === 'removed'  && 'border-danger/30 text-danger bg-danger/10',
        status === 'resolved' && 'border-taupe text-sapphire/70 bg-champagne/50',
        className,
      )}
    >
      {labels[status]}
    </span>
  )
}
