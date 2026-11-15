/* Stats endpoint */
import { apiFetch } from './client'
import type { Stats } from './types'

export type { Stats as StatsResponse } from './types'

export async function fetchStats(): Promise<Stats> {
  return apiFetch<Stats>('/stats')
}
