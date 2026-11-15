import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'
import { getMessages, sendMessage, sendImage, resolveConversation } from '../../api/conversations'
import { ApiError } from '../../api/client'
import { formatRelativeTime, formatDate } from '../../lib/time'
import type { Conversation, Message } from '../../api/types'

interface PendingMessage {
  tempId: number
  text?: string
  imagePreview?: string
  sending: boolean
  failed: boolean
}

interface ConversationViewProps {
  conversation: Conversation
  onResolved?: (conv: Conversation) => void
  showBackButton?: boolean
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export function ConversationView({
  conversation,
  onResolved,
  showBackButton = false,
}: ConversationViewProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [pending, setPending] = useState<PendingMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMessages = useCallback(() => {
    getMessages(conversation.id)
      .then(setMessages)
      .catch(() => {})
  }, [conversation.id])

  useEffect(() => { loadMessages() }, [loadMessages])

  /* Poll for new messages every 10s */
  useEffect(() => {
    const interval = setInterval(loadMessages, 10_000)
    return () => clearInterval(interval)
  }, [loadMessages])

  /* Scroll to bottom when messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pending])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    const tempId = Date.now()
    setText('')
    setPending((p) => [...p, { tempId, text: content, sending: true, failed: false }])
    setSending(true)
    try {
      const msg = await sendMessage(conversation.id, content)
      setMessages((prev) => [...prev, msg])
      setPending((p) => p.filter((m) => m.tempId !== tempId))
    } catch {
      setPending((p) =>
        p.map((m) => (m.tempId === tempId ? { ...m, sending: false, failed: true } : m)),
      )
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const tempId = Date.now()
    const preview = URL.createObjectURL(file)
    setPending((p) => [...p, { tempId, imagePreview: preview, sending: true, failed: false }])
    try {
      const msg = await sendImage(conversation.id, file)
      setMessages((prev) => [...prev, msg])
      setPending((p) => p.filter((m) => m.tempId !== tempId))
    } catch {
      setPending((p) =>
        p.map((m) => (m.tempId === tempId ? { ...m, sending: false, failed: true } : m)),
      )
    } finally {
      URL.revokeObjectURL(preview)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRetry = async (pm: PendingMessage) => {
    if (!pm.text) return
    setPending((p) => p.map((m) => (m.tempId === pm.tempId ? { ...m, sending: true, failed: false } : m)))
    try {
      const msg = await sendMessage(conversation.id, pm.text)
      setMessages((prev) => [...prev, msg])
      setPending((p) => p.filter((m) => m.tempId !== pm.tempId))
    } catch {
      setPending((p) => p.map((m) => (m.tempId === pm.tempId ? { ...m, sending: false, failed: true } : m)))
    }
  }

  const handleResolve = async () => {
    setResolving(true)
    try {
      const updated = await resolveConversation(conversation.id)
      onResolved?.(updated)
      addToast('success', 'Conversation resolved.')
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.detail : 'Could not resolve. Try again.')
    } finally {
      setResolving(false)
    }
  }

  const isResolved = conversation.status === 'resolved'

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 bg-surface">
        {showBackButton && (
          <Link
            to="/chats"
            className="rounded-[5px] p-1.5 text-ink-soft hover:bg-surface-2 hover:text-ink transition-colors"
            aria-label="Back to chats"
          >
            <ArrowLeft size={18} />
          </Link>
        )}

        {/* Item thumbnail */}
        <Link to={`/items/${conversation.item.id}`} className="shrink-0">
          <div className="h-10 w-10 overflow-hidden rounded-[5px] border border-line">
            <img
              src={conversation.item.image_url}
              alt={conversation.item.name}
              className="h-full w-full object-cover"
            />
          </div>
        </Link>

        <div className="flex flex-1 flex-col min-w-0">
          <span className="font-semibold text-sm text-ink truncate">
            {conversation.other_user.name}
          </span>
          <Link
            to={`/items/${conversation.item.id}`}
            className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft hover:text-accent transition-colors truncate"
          >
            {conversation.item.name}
            <ExternalLink size={10} className="inline ml-0.5" />
          </Link>
        </div>

        {!isResolved && (
          <Button variant="secondary" size="sm" loading={resolving} onClick={handleResolve}>
            Resolve
          </Button>
        )}
        {isResolved && (
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-success border border-success/30 bg-success/10 rounded-[3px] px-2.5 py-1">
            Resolved
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-bg px-4 py-4 space-y-3">
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === user?.id
          const showDate =
            i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at)

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center py-2">
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft/50 bg-surface border border-line rounded-[3px] px-3 py-0.5">
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-[10px] px-4 py-2.5 ${
                  isMine
                    ? 'bg-accent text-white rounded-tr-[3px]'
                    : 'bg-surface border border-line text-ink rounded-tl-[3px]'
                }`}>
                  {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                  {msg.image_url && (
                    <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={msg.image_url}
                        alt="Shared image"
                        className="max-w-[200px] rounded-[5px]"
                        loading="lazy"
                      />
                    </a>
                  )}
                  <p className={`mt-0.5 text-right font-mono text-[0.55rem] ${
                    isMine ? 'text-white/60' : 'text-ink-soft/50'
                  }`}>
                    {formatRelativeTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        {/* Pending messages */}
        {pending.map((pm) => (
          <div key={pm.tempId} className="flex justify-end">
            <div className="max-w-[75%] rounded-[10px] rounded-tr-[3px] bg-accent/70 px-4 py-2.5">
              {pm.text && <p className="text-sm text-white leading-relaxed">{pm.text}</p>}
              {pm.imagePreview && (
                <img src={pm.imagePreview} alt="" className="max-w-[200px] rounded-[5px] opacity-70" />
              )}
              <div className="mt-0.5 flex items-center justify-end gap-1">
                {pm.sending && (
                  <span className="font-mono text-[0.55rem] text-white/60">Sending…</span>
                )}
                {pm.failed && (
                  <button
                    onClick={() => void handleRetry(pm)}
                    className="font-mono text-[0.55rem] text-white/80 underline"
                  >
                    Failed — retry
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {isResolved ? (
        <div className="border-t border-line bg-surface px-4 py-3 text-center font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft">
          This conversation has been resolved.
        </div>
      ) : (
        <div className="border-t border-line bg-surface px-4 py-3 flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Send image"
            className="inline-flex items-stretch cursor-pointer rounded-[5px] overflow-hidden border border-line hover:border-accent transition-colors shrink-0"
          >
            <span className="flex items-center justify-center self-stretch shrink-0 w-7 bg-surface-2 text-ink-soft" aria-hidden="true">
              <ImageIcon size={14} />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void handleImageSelect(e)}
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            aria-label="Message"
            className="flex-1 resize-none rounded-[5px] border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30 max-h-28 overflow-y-auto"
          />

          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSend()}
            disabled={!text.trim() || sending}
            aria-label="Send message"
            className="shrink-0"
          >
            <Send size={14} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}
