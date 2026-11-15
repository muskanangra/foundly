/* Core fetch wrapper: adds base URL, auth header, JSON handling, and ApiError */
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

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, "Can't reach the server")
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
