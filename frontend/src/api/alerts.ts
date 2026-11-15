/* Alerts endpoints */
import { apiFetch } from './client'
import type { MatchAlert } from './types'

export async function listAlerts(): Promise<MatchAlert[]> {
  return apiFetch<MatchAlert[]>('/alerts', { authenticated: true })
}

export interface CreateAlertData {
  keyword: string
  category_id?: number
  location?: string
}

export async function createAlert(data: CreateAlertData): Promise<MatchAlert> {
  return apiFetch<MatchAlert>('/alerts', {
    method: 'POST',
    body: JSON.stringify(data),
    authenticated: true,
  })
}

export async function deleteAlert(id: number): Promise<void> {
  return apiFetch<void>(`/alerts/${id}`, {
    method: 'DELETE',
    authenticated: true,
  })
}
