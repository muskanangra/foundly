/* Core fetch wrapper: adds base URL, auth header, JSON handling, and ApiError.
 * Also handles Render free-tier wake-up: shows a banner if requests hang >3 s,
 * and retries network errors for up to 60 s before giving up.
 */
import { API_URL } from '../lib/config'

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

// ── Wake-up banner signalling ─────────────────────────────────────────────────
// Components listen for 'foundly:waking' / 'foundly:awake' on window.

let _wakingCount = 0

function _incWaking() {
  _wakingCount++
  if (_wakingCount === 1) window.dispatchEvent(new CustomEvent('foundly:waking'))
}

function _decWaking() {
  _wakingCount = Math.max(0, _wakingCount - 1)
  if (_wakingCount === 0) window.dispatchEvent(new CustomEvent('foundly:awake'))
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

const SLOW_THRESHOLD_MS = 3_000   // show banner if no response within 3 s
const MAX_RETRY_MS      = 60_000  // give up retrying after 60 s
const RETRY_WAIT_MS     = 3_000   // wait between retries on network error

interface FetchOptions extends RequestInit {
  authenticated?: boolean
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { authenticated = false, ...init } = options

  const headers = new Headers(init.headers)

  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (authenticated) {
    const token = localStorage.getItem('foundly_token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const startTime = Date.now()
  let waking = false

  // Show banner if the request hangs for more than SLOW_THRESHOLD_MS
  const slowTimer = setTimeout(() => {
    waking = true
    _incWaking()
  }, SLOW_THRESHOLD_MS)

  const cleanup = () => {
    clearTimeout(slowTimer)
    if (waking) {
      _decWaking()
      waking = false
    }
  }

  let response: Response

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        response = await fetch(`${API_URL}${path}`, { ...init, headers })
        // Request succeeded — clear banner
        cleanup()
        break
      } catch {
        // Network error (server unreachable)
        clearTimeout(slowTimer)
        if (!waking) {
          waking = true
          _incWaking()
        }
        const elapsed = Date.now() - startTime
        if (elapsed + RETRY_WAIT_MS > MAX_RETRY_MS) {
          _decWaking()
          waking = false
          throw new ApiError(0, "Can't reach the server. Please try again.")
        }
        await new Promise<void>((r) => setTimeout(r, RETRY_WAIT_MS))
      }
    }
  } catch (err) {
    cleanup()
    throw err
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const json = (await response.json()) as { detail?: unknown }
      if (typeof json.detail === 'string') detail = json.detail
    } catch {
      // ignore JSON parse error
    }

    if (response.status === 401 && authenticated) {
      window.dispatchEvent(new CustomEvent('foundly:logout'))
    }

    throw new ApiError(response.status, detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
