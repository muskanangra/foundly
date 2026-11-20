import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { getUnreadCount } from '../api/notifications'
import { API_URL } from '../lib/config'

type EventType = 'message' | 'notification'
type EventCallback = (data: unknown) => void

interface RealtimeContextValue {
  subscribe: (type: EventType, cb: EventCallback) => () => void
  unreadCount: number
  clearUnread: () => void
  refreshUnreadCount: () => void
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

interface RealtimeMessage {
  type: EventType
  data: unknown
}

const PING_INTERVAL_MS = 25_000  // keep connection alive through Render's idle timeout

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, token } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const subscribersRef = useRef<Map<EventType, Set<EventCallback>>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(1000)
  const failuresRef = useRef(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const dispatch = useCallback((type: EventType, data: unknown) => {
    subscribersRef.current.get(type)?.forEach((cb) => cb(data))
    if (type === 'notification') {
      setUnreadCount((n) => n + 1)
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollingRef.current) return
    pollingRef.current = setInterval(async () => {
      try {
        const { count } = await getUnreadCount()
        if (mountedRef.current) setUnreadCount(count)
      } catch { /* ignore */ }
    }, 30_000)
  }, [])

  const stopPing = useCallback(() => {
    if (pingRef.current) {
      clearInterval(pingRef.current)
      pingRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return

    // Build ws:// or wss:// from the API_URL (http→ws, https→wss)
    const wsUrl = `${API_URL.replace(/^https/, 'wss').replace(/^http/, 'ws')}/ws?token=${token}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        backoffRef.current = 1000
        failuresRef.current = 0
        // Stop polling fallback once WS is live
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        // Send a ping every 25 s to prevent Render from sleeping the connection
        stopPing()
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, PING_INTERVAL_MS)
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as RealtimeMessage
          if (msg.type && mountedRef.current) dispatch(msg.type, msg.data)
        } catch { /* ignore malformed */ }
      }

      ws.onclose = () => {
        stopPing()
        wsRef.current = null
        if (!mountedRef.current) return
        failuresRef.current += 1

        // Fall back to polling after repeated failures, but keep reconnecting
        if (failuresRef.current >= 3) {
          startPolling()
        }

        // Always schedule a reconnect — this handles waking from sleep
        const delay = Math.min(backoffRef.current, 30_000)
        backoffRef.current = Math.min(delay * 2, 30_000)
        setTimeout(() => { if (mountedRef.current) connect() }, delay)
      }

      ws.onerror = () => { ws.close() }
    } catch {
      startPolling()
    }
  }, [token, dispatch, startPolling, stopPing])

  /* Boot up when logged in */
  useEffect(() => {
    if (!isLoggedIn || !token) {
      wsRef.current?.close()
      wsRef.current = null
      stopPing()
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
      setUnreadCount(0)
      return
    }

    /* Fetch initial count */
    getUnreadCount().then(({ count }) => { if (mountedRef.current) setUnreadCount(count) }).catch(() => {})

    connect()

    return () => {
      wsRef.current?.close()
      wsRef.current = null
      stopPing()
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    }
  }, [isLoggedIn, token, connect, stopPing])

  const subscribe = useCallback((type: EventType, cb: EventCallback): (() => void) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set())
    }
    subscribersRef.current.get(type)!.add(cb)
    return () => { subscribersRef.current.get(type)?.delete(cb) }
  }, [])

  const clearUnread = useCallback(() => setUnreadCount(0), [])

  const refreshUnreadCount = useCallback(() => {
    getUnreadCount().then(({ count }) => { if (mountedRef.current) setUnreadCount(count) }).catch(() => {})
  }, [])

  return (
    <RealtimeContext.Provider value={{ subscribe, unreadCount, clearUnread, refreshUnreadCount }}>
      {children}
    </RealtimeContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components -- context hook always lives with its provider
export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used inside RealtimeProvider')
  return ctx
}
