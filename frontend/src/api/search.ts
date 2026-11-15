/* Search autocomplete endpoint */
import { apiFetch } from './client'

export async function searchAutocomplete(q: string): Promise<{ suggestions: string[] }> {
  return apiFetch<{ suggestions: string[] }>(
    `/search/autocomplete?q=${encodeURIComponent(q)}`,
  )
}
