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
      <div className="flex flex-col divide-y divide-line">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-4 animate-pulse">
            <div className="h-12 w-12 shrink-0 rounded-[5px] bg-surface-2" />
            <div className="flex flex-1 flex-col gap-2 justify-center">
              <div className="h-3 w-24 rounded bg-surface-2" />
              <div className="h-2.5 w-40 rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-medium text-ink">No conversations yet</p>
        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">
          Contact a finder from an item page to start chatting.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-line">
      {conversations.map((conv) => (
        <NavLink
          key={conv.id}
          to={`/chats/${conv.id}`}
          className={({ isActive }) =>
            clsx(
              'flex gap-3 p-4 transition-colors hover:bg-surface-2',
              isActive && 'bg-accent-tint',
            )
          }
        >
          {/* Item thumbnail */}
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[5px] border border-line bg-surface-2">
            <img
              src={conv.item.image_url}
              alt={conv.item.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-ink">
                {conv.other_user.name}
              </span>
              <span className="shrink-0 font-mono text-[0.6rem] text-ink-soft/60">
                {conv.last_message
                  ? formatRelativeTime(conv.last_message.created_at)
                  : formatRelativeTime(conv.created_at)}
              </span>
            </div>
            <span className="truncate font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">
              {conv.item.name}
            </span>
            {conv.last_message?.text && (
              <span className="truncate text-xs text-ink-soft/70">
                {conv.last_message.text}
              </span>
            )}
          </div>

          {conv.unread_count > 0 && (
            <div className="flex shrink-0 items-start pt-1">
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[0.55rem] font-black text-white">
                {conv.unread_count > 9 ? '9+' : conv.unread_count}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </div>
  )
}
