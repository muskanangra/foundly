import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
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

  const content = (
    <div
      className={clsx(
        'relative bg-champagne rounded-2xl overflow-hidden border border-taupe/30',
        'transition-all duration-200 hover:-translate-y-1 hover:shadow-md',
        'group',
        className,
      )}
    >
      {/* Image — 4:3 */}
      <div className="aspect-[4/3] overflow-hidden bg-champagne">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-[40px] italic text-taupe/60" aria-hidden="true">F</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-2">
        {/* Name */}
        <h3 className="font-sans text-[17px] font-bold text-navy leading-snug line-clamp-2">
          {item.name}
        </h3>

        {/* Category · Location */}
        <p className="font-sans text-sm text-sapphire line-clamp-1">
          {item.category.name} · {item.location}
        </p>

        {/* Time */}
        <p className="font-display italic text-[18px] text-sapphire/70 leading-tight">
          {formatRelativeTime(item.created_at)}
        </p>

        {/* Item ID */}
        <p className="font-sans text-sm text-sapphire/50">{idStr}</p>
      </div>

      {/* Status overlay */}
      {showStatus && item.status !== 'active' && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{ background: 'rgba(231,226,206,0.75)' }}
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
