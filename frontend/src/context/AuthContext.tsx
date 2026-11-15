/* Auth context — token + user state, /auth/me verification on startup */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMe } from '../api/auth'
import { ApiError } from '../api/client'
import type { User, AuthResponse } from '../api/types'

export type AuthUser = User

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (response: AuthResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('foundly_token'),
  )
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('foundly_token'))

  const logout = useCallback(() => {
    localStorage.removeItem('foundly_token')
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback((response: AuthResponse) => {
    localStorage.setItem('foundly_token', response.access_token)
    setToken(response.access_token)
    setUser(response.user)
  }, [])

  /* On mount: if a token exists, verify it with /auth/me */
  useEffect(() => {
    const storedToken = localStorage.getItem('foundly_token')
    if (!storedToken) {
      setIsLoading(false)
      return
    }

    getMe()
      .then((u) => {
        setUser(u)
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
        }
        // Network error (status 0): keep the token, show as logged out until verified
      })
      .finally(() => setIsLoading(false))
  }, [logout])

  /* React to 401s from the API client */
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('foundly:logout', handler)
    return () => window.removeEventListener('foundly:logout', handler)
  }, [logout])

  /* Sync token across browser tabs */
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'foundly_token') {
        setToken(e.newValue)
        if (!e.newValue) setUser(null)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const value = useMemo(
    () => ({ user, token, isLoggedIn: !!user, isLoading, login, logout }),
    [user, token, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- context hook always lives with its provider
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
