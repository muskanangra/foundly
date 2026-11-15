import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { ConversationList } from '../components/chat/ConversationList'
import { ConversationView } from '../components/chat/ConversationView'
import { ErrorState } from '../components/ui/ErrorState'
import { listConversations } from '../api/conversations'
import type { Conversation } from '../api/types'

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<Conversation | null>(null)

  const load = () => {
    setLoading(true)
    setError(false)
    listConversations()
      .then(setConversations)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleResolved = (updated: Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setSelected(updated)
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <ErrorState onRetry={load} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex h-[calc(100vh-7rem)]">
        {/* Sidebar */}
        <div
          className={`flex flex-col border-r border-line bg-surface ${
            selected ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 shrink-0`}
        >
          <div className="border-b border-line px-5 py-4">
            <h1 className="text-lg font-semibold text-ink">Chats</h1>
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationListWithSelect
              conversations={conversations}
              loading={loading}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        </div>

        {/* Detail panel (desktop) */}
        <div className={`flex-1 ${selected ? 'flex' : 'hidden md:flex'} flex-col`}>
          {selected ? (
            <ConversationView
              conversation={selected}
              onResolved={handleResolved}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
              <div className="rounded-[10px] border border-line bg-surface-2 p-5">
                <MessageSquare size={28} className="text-ink-soft" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-ink">Select a conversation</p>
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">
                Choose a conversation from the list to start reading.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConversationListWithSelect({
  conversations,
  loading,
  selected,
  onSelect,
}: {
  conversations: Conversation[]
  loading: boolean
  selected: Conversation | null
  onSelect: (c: Conversation) => void
}) {
  if (loading) return <ConversationList conversations={[]} loading />

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
        <button
          key={conv.id}
          onClick={() => onSelect(conv)}
          className={`flex w-full gap-3 p-4 text-left transition-colors hover:bg-surface-2 ${
            selected?.id === conv.id ? 'bg-accent-tint' : ''
          }`}
        >
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[5px] bg-surface-2 border border-line">
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
              {conv.unread_count > 0 && (
                <span className="shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[0.55rem] font-black text-white">
                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                </span>
              )}
            </div>
            <span className="truncate font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">
              {conv.item.name}
            </span>
            {conv.last_message?.text && (
              <span className="truncate text-xs text-ink-soft/70">{conv.last_message.text}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
