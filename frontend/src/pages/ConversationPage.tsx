import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ConversationView } from '../components/chat/ConversationView'
import { ConversationList } from '../components/chat/ConversationList'
import { ErrorState } from '../components/ui/ErrorState'
import { getConversation, listConversations } from '../api/conversations'
import type { Conversation } from '../api/types'

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const convId = Number(id)

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!convId) { setError(true); setLoading(false); return }
    setLoading(true)
    setError(false)
    Promise.all([
      getConversation(convId),
      listConversations(),
    ])
      .then(([conv, all]) => {
        setConversation(conv)
        setConversations(all)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [convId])

  const handleResolved = (updated: Conversation) => {
    setConversation(updated)
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex h-[calc(100vh-4rem)] border-b border-taupe/40">
          <div className="hidden md:flex w-80 lg:w-96 shrink-0 flex-col border-r border-taupe/40 bg-ivory">
            <div className="border-b border-taupe/40 px-5 py-4">
              <div className="h-8 w-24 animate-pulse rounded-xl bg-champagne" />
            </div>
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
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="h-5 w-32 animate-pulse rounded-xl bg-champagne" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <ErrorState onRetry={() => navigate(0)} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex h-[calc(100vh-4rem)] border-b border-taupe/40">
        {/* Sidebar — desktop only */}
        <div className="hidden md:flex w-80 lg:w-96 shrink-0 flex-col border-r border-taupe/40 bg-ivory">
          <div className="border-b border-taupe/40 px-5 py-4">
            <h1 className="font-display text-[32px] font-semibold text-navy leading-tight">Chats</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList conversations={conversations} loading={false} />
          </div>
        </div>

        {/* Conversation — full width on mobile, right panel on desktop */}
        <div className="flex flex-1 flex-col">
          <ConversationView
            key={conversation.id}
            conversation={conversation}
            onResolved={handleResolved}
            showBackButton
          />
        </div>
      </div>
    </div>
  )
}
