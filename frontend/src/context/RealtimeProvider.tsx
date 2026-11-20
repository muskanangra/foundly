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

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, token } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const subscribersRef = useRef<Map<EventType, Set<EventCallback>>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(1000)
  const failuresRef = useRef(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
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

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return

    const wsUrl = `${API_URL.replace(/^http/, 'ws')}/ws?token=${token}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        backoffRef.current = 1000
        failuresRef.current = 0
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as RealtimeMessage
          if (msg.type && mountedRef.current) dispatch(msg.type, msg.data)
        } catch { /* ignore malformed */ }
      }

      ws.onclose = () => {
        wsRef.current = null
        if (!mountedRef.current) return
        failuresRef.current += 1
        if (failuresRef.current >= 3) {
          startPolling()
          return
        }
        const delay = Math.min(backoffRef.current, 30_000)
        backoffRef.current = delay * 2
        setTimeout(() => { if (mountedRef.current) connect() }, delay)
      }

      ws.onerror = () => { ws.close() }
    } catch {
      startPolling()
    }
  }, [token, dispatch, startPolling])

  /* Boot up when logged in */
  useEffect(() => {
    if (!isLoggedIn || !token) {
      wsRef.current?.close()
      wsRef.current = null
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
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    }
  }, [isLoggedIn, token, connect])

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
