/* Reports endpoint */
import { apiFetch } from './client'
import type { Report } from './types'

export type ReportReason = 'fake' | 'inappropriate' | 'duplicate' | 'spam' | 'other'

export async function createReport(
  itemId: number,
  reason: ReportReason,
  note?: string,
): Promise<Report> {
  return apiFetch<Report>('/reports', {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId, reason, note: note ?? null }),
    authenticated: true,
  })
}
