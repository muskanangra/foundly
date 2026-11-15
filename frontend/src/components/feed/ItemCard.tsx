import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { PixelImage } from '../ui/PixelImage'
import { Chip } from '../ui/Chip'
import { StatusBadge } from '../ui/StatusBadge'
import { formatRelativeTime } from '../../lib/time'
import type { Item } from '../../api/types'

interface ItemCardProps {
  item: Item
  linkState?: Record<string, unknown>
  showLink?: boolean
  showStatus?: boolean
  className?: string
}

export function ItemCard({ item, linkState, showLink = true, showStatus = false, className }: ItemCardProps) {
  const location = useLocation()
  const backState = linkState ?? { from: `${location.pathname}${location.search}` }
  const idStr = `F-${String(item.id).padStart(4, '0')}`
  const relTime = formatRelativeTime(item.created_at).toUpperCase()

  const content = (
    <div
      className={clsx(
        'relative bg-surface border border-line rounded-[10px] overflow-hidden',
        'transition-all duration-150 hover:border-accent hover:-translate-y-0.5',
        'group',
        className,
      )}
    >
      {/* Image — 4:3 */}
      <div className="aspect-[4/3] relative overflow-hidden bg-surface-2">
        <PixelImage
          src={item.image_url || undefined}
          reveal
          pixelSize={8}
          id={item.id}
          alt={item.name}
          className="w-full h-full"
        />
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2">
        {/* ID row */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-accent">
            {idStr}
          </span>
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">
            {relTime}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-sans text-base font-medium text-ink leading-snug line-clamp-2">
          {item.name}
        </h3>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5">
          <Chip>{item.category.name}</Chip>
          <Chip>{item.location}</Chip>
        </div>
      </div>

      {/* Status overlay */}
      {showStatus && item.status !== 'active' && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-[10px]"
          style={{ background: 'rgba(243,246,251,0.6)' }}
        >
          <StatusBadge status={item.status} />
        </div>
      )}
    </div>
  )

  if (showLink && item.id !== 0) {
    return (
      <Link
        to={`/items/${item.id}`}
        state={backState}
        className="block no-underline"
        aria-label={`View details for ${item.name}`}
      >
        {content}
      </Link>
    )
  }

  return content
}
