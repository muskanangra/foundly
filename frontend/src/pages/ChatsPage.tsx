import { useState, useEffect, useCallback } from 'react'
import { MessageSquare } from 'lucide-react'
import { ConversationList } from '../components/chat/ConversationList'
import { ConversationView } from '../components/chat/ConversationView'
import { ErrorState } from '../components/ui/ErrorState'
import { useRealtime } from '../context/RealtimeProvider'
import { useAuth } from '../context/AuthContext'
import { listConversations } from '../api/conversations'
import type { Conversation, Message } from '../api/types'

export default function ChatsPage() {
  const { subscribe } = useRealtime()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<Conversation | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    listConversations()
      .then(setConversations)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  /* When a WS message arrives, refresh the conversation list so last_message
     and unread_count stay accurate for the sidebar. */
  useEffect(() => {
    return subscribe('message', (data) => {
      const msg = data as Message
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversation_id)
        if (idx === -1) {
          listConversations().then(setConversations).catch(() => {})
          return prev
        }
        const conv = prev[idx]
        const isOpen = selected?.id === conv.id
        const isMine = msg.sender_id === user?.id
        const updated: Conversation = {
          ...conv,
          last_message: msg,
          unread_count: isOpen || isMine ? conv.unread_count : conv.unread_count + 1,
        }
        const rest = prev.filter((_, i) => i !== idx)
        return [updated, ...rest]
      })
    })
  }, [subscribe, selected, user])

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
      <div className="flex h-[calc(100vh-4rem)] border-b border-taupe/40">
        {/* Sidebar */}
        <div
          className={`flex flex-col border-r border-taupe/40 bg-ivory ${
            selected ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 shrink-0`}
        >
          <div className="border-b border-taupe/40 px-5 py-4">
            <h1 className="font-display text-[32px] font-semibold text-navy leading-tight">Chats</h1>
            <p className="font-sans text-sm text-sapphire/60">
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
              key={selected.id}
              conversation={selected}
              onResolved={handleResolved}
            />
          ) : loading ? (
            <div className="flex flex-1 flex-col p-4 gap-4">
              <div className="h-14 w-full rounded-2xl bg-champagne animate-pulse" />
              <div className="flex flex-col gap-3 flex-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className={`h-10 rounded-2xl bg-champagne animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
              <div className="rounded-2xl border border-taupe/30 bg-champagne p-5">
                <MessageSquare size={28} className="text-sapphire/50" aria-hidden="true" />
              </div>
              <p className="font-sans text-sm font-medium text-navy">Select a conversation</p>
              <p className="font-sans text-sm text-sapphire/60">
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
        <button
          key={conv.id}
          onClick={() => onSelect(conv)}
          className={`flex w-full gap-3 p-4 text-left transition-colors hover:bg-champagne ${
            selected?.id === conv.id ? 'bg-champagne' : ''
          }`}
        >
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-champagne border border-taupe/30">
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
              {conv.unread_count > 0 && (
                <span className="shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-navy px-1 font-sans text-[11px] font-bold text-ivory">
                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                </span>
              )}
            </div>
            <span className="truncate font-display italic text-[13px] text-sapphire/70">
              {conv.item.name}
            </span>
            {conv.last_message?.text && (
              <span className="truncate font-sans text-xs text-sapphire/60">{conv.last_message.text}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
