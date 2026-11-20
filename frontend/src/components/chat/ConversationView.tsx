import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Image as ImageIcon, ExternalLink, ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'
import { useRealtime } from '../../context/RealtimeProvider'
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

const NEAR_BOTTOM = 120

export function ConversationView({
  conversation,
  onResolved,
  showBackButton = false,
}: ConversationViewProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const { subscribe, refreshUnreadCount } = useRealtime()
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [pending, setPending] = useState<PendingMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [newMessagesBanner, setNewMessagesBanner] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialScrollDone = useRef(false)
  const sentIdsRef = useRef<Set<number>>(new Set())

  const isNearBottom = useCallback(() => {
    const el = scrollAreaRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollAreaRef.current
    if (!el) return
    if (behavior === 'instant') {
      el.scrollTop = el.scrollHeight
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior })
    }
  }, [])

  const loadMessages = useCallback((isInitial = false) => {
    getMessages(conversation.id)
      .then((msgs) => {
        if (isInitial) {
          setMessages(msgs)
          refreshUnreadCount()
          setTimeout(() => {
            scrollToBottom('instant')
            initialScrollDone.current = true
            setMessagesLoading(false)
          }, 0)
        } else {
          setMessages((prev) => {
            if (msgs.length > prev.length) {
              if (isNearBottom()) {
                setTimeout(() => scrollToBottom(), 50)
              } else {
                setNewMessagesBanner(true)
              }
            }
            return msgs
          })
          refreshUnreadCount()
        }
      })
      .catch(() => { if (isInitial) setMessagesLoading(false) })
  }, [conversation.id, refreshUnreadCount, scrollToBottom, isNearBottom])

  useEffect(() => {
    initialScrollDone.current = false
    setMessagesLoading(true)
    loadMessages(true)
  }, [loadMessages])

  /* Real-time: add incoming messages, dedupe by id */
  useEffect(() => {
    return subscribe('message', (data) => {
      const msg = data as Message
      if (msg.conversation_id !== conversation.id) return
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      /* Only auto-scroll if already near bottom */
      if (isNearBottom()) {
        setTimeout(() => scrollToBottom(), 50)
      } else {
        setNewMessagesBanner(true)
      }
    })
  }, [subscribe, conversation.id, isNearBottom, scrollToBottom])

  /* Poll every 10s as a fallback; never scrolls (isInitial=false) */
  useEffect(() => {
    const interval = setInterval(() => loadMessages(false), 10_000)
    return () => clearInterval(interval)
  }, [loadMessages])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    const tempId = Date.now()
    setText('')
    setPending((p) => [...p, { tempId, text: content, sending: true, failed: false }])
    setSending(true)
    setTimeout(() => scrollToBottom(), 0)
    try {
      const msg = await sendMessage(conversation.id, content)
      sentIdsRef.current.add(msg.id)
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      )
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
    setTimeout(() => scrollToBottom(), 0)
    try {
      const msg = await sendImage(conversation.id, file)
      sentIdsRef.current.add(msg.id)
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      )
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
      sentIdsRef.current.add(msg.id)
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      )
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

  const handleScrollToNew = () => {
    scrollToBottom()
    setNewMessagesBanner(false)
  }

  const isResolved = conversation.status === 'resolved'

  return (
    <div className="flex h-full flex-col bg-ivory">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-taupe/40 px-4 py-3 bg-ivory">
        {showBackButton && (
          <Link
            to="/chats"
            className="rounded-full p-1.5 text-sapphire hover:bg-champagne transition-colors"
            aria-label="Back to chats"
          >
            <ArrowLeft size={18} />
          </Link>
        )}

        {/* Item thumbnail */}
        <Link to={`/items/${conversation.item.id}`} className="shrink-0">
          <div className="h-10 w-10 overflow-hidden rounded-xl border border-taupe/30 bg-champagne">
            <img
              src={conversation.item.image_url}
              alt={conversation.item.name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </Link>

        <div className="flex flex-1 flex-col min-w-0">
          <span className="font-sans font-semibold text-sm text-navy truncate">
            {conversation.other_user.name}
          </span>
          <Link
            to={`/items/${conversation.item.id}`}
            className="font-display italic text-[15px] text-sapphire/70 hover:text-sapphire transition-colors truncate"
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
          <span className="font-sans text-xs text-success border border-success/30 bg-success/10 rounded-full px-2.5 py-1">
            Resolved
          </span>
        )}
      </div>

      {/* Messages scroll area */}
      <div
        ref={scrollAreaRef}
        className="relative flex-1 overflow-y-auto px-4 py-4 space-y-3"
        onScroll={() => {
          if (isNearBottom()) setNewMessagesBanner(false)
        }}
      >
        {messagesLoading && (
          <div className="flex flex-col gap-3">
            {[false, true, false, true, false].map((isMine, i) => (
              <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`h-10 rounded-2xl bg-champagne animate-pulse ${isMine ? 'w-40' : 'w-56'}`} />
              </div>
            ))}
          </div>
        )}
        {!messagesLoading && messages.map((msg, i) => {
          const isMine = msg.sender_id === user?.id
          const showDate =
            i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at)

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center py-2">
                  <span className="font-sans text-xs text-sapphire/50 bg-champagne border border-taupe/30 rounded-full px-3 py-0.5">
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isMine
                    ? 'bg-navy text-ivory rounded-tr-sm'
                    : 'bg-champagne border border-taupe/30 text-navy rounded-tl-sm'
                }`}>
                  {msg.text && (
                    <p className="font-sans text-sm leading-relaxed">{msg.text}</p>
                  )}
                  {msg.image_url && (
                    <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={msg.image_url}
                        alt="Shared image"
                        className="max-w-[200px] rounded-xl"
                        loading="lazy"
                      />
                    </a>
                  )}
                  <p className={`mt-0.5 text-right font-sans text-[11px] ${
                    isMine ? 'text-ivory/50' : 'text-sapphire/40'
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
            <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-navy/60 px-4 py-2.5">
              {pm.text && <p className="font-sans text-sm text-ivory leading-relaxed">{pm.text}</p>}
              {pm.imagePreview && (
                <img src={pm.imagePreview} alt="" className="max-w-[200px] rounded-xl opacity-70" />
              )}
              <div className="mt-0.5 flex items-center justify-end gap-1">
                {pm.sending && (
                  <span className="font-sans text-[11px] text-ivory/50">Sending…</span>
                )}
                {pm.failed && (
                  <button
                    onClick={() => void handleRetry(pm)}
                    className="font-sans text-[11px] text-ivory/80 underline"
                  >
                    Failed — retry
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />

        {/* New messages banner */}
        {newMessagesBanner && (
          <button
            onClick={handleScrollToNew}
            className="sticky bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 font-sans text-sm text-ivory shadow-lg hover:bg-sapphire transition-colors"
          >
            New messages
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Composer */}
      {isResolved ? (
        <div className="border-t border-taupe/40 bg-ivory px-4 py-3 text-center font-sans text-sm text-sapphire/50">
          This conversation has been resolved.
        </div>
      ) : (
        <div className="border-t border-taupe/40 bg-ivory px-4 py-3 flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Send image"
            className="h-10 w-10 flex items-center justify-center rounded-full border border-taupe/40 bg-champagne text-sapphire/60 hover:bg-champagne/80 hover:text-sapphire transition-colors shrink-0"
          >
            <ImageIcon size={15} aria-hidden="true" />
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
            className="flex-1 resize-none rounded-full border border-taupe/40 bg-ivory px-4 py-2.5 font-sans text-sm text-navy placeholder:text-taupe/80 outline-none transition-colors focus:border-sapphire focus:ring-2 focus:ring-sapphire/15 max-h-28 overflow-y-auto"
          />

          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSend()}
            disabled={!text.trim() || sending}
            aria-label="Send message"
            className="shrink-0 h-10 w-10 !p-0 !rounded-full flex items-center justify-center"
          >
            <Send size={14} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}
