import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { formatRelativeTime } from '../../lib/time'
import type { Conversation } from '../../api/types'

interface ConversationListProps {
  conversations: Conversation[]
  loading: boolean
}

export function ConversationList({ conversations, loading }: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex flex-col divide-y divide-taupe/30">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-4 animate-pulse">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-champagne" />
            <div className="flex flex-1 flex-col gap-2 justify-center">
              <div className="h-3 w-24 rounded-lg bg-champagne" />
              <div className="h-2.5 w-40 rounded-lg bg-champagne" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="font-sans text-sm font-medium text-navy">No conversations yet</p>
        <p className="font-sans text-sm text-sapphire/60">
          Contact a finder from an item page to start chatting.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-taupe/30">
      {conversations.map((conv) => (
        <NavLink
          key={conv.id}
          to={`/chats/${conv.id}`}
          className={({ isActive }) =>
            clsx(
              'flex gap-3 p-4 transition-colors hover:bg-champagne',
              isActive && 'bg-champagne',
            )
          }
        >
          {/* Item thumbnail */}
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-taupe/30 bg-champagne">
            <img
              src={conv.item.image_url}
              alt={conv.item.name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-sans text-sm font-semibold text-navy">
                {conv.other_user.name}
              </span>
              <span className="shrink-0 font-sans text-xs text-sapphire/50">
                {conv.last_message
                  ? formatRelativeTime(conv.last_message.created_at)
                  : formatRelativeTime(conv.created_at)}
              </span>
            </div>
            <span className="truncate font-display italic text-[13px] text-sapphire/70">
              {conv.item.name}
            </span>
            {conv.last_message?.text && (
              <span className="truncate font-sans text-xs text-sapphire/60">
                {conv.last_message.text}
              </span>
            )}
          </div>

          {conv.unread_count > 0 && (
            <div className="flex shrink-0 items-start pt-1">
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-navy px-1 font-sans text-[11px] font-bold text-ivory">
                {conv.unread_count > 9 ? '9+' : conv.unread_count}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </div>
  )
}
