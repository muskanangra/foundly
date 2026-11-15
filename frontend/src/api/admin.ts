/* Admin endpoints (admin role required) */
import { apiFetch } from './client'
import type { AdminStats, Report } from './types'

export async function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/admin/stats', { authenticated: true })
}

export type ReportStatus = 'open' | 'dismissed' | 'actioned'

export async function listReports(status?: ReportStatus): Promise<Report[]> {
  const qs = status ? `?status=${status}` : ''
  return apiFetch<Report[]>(`/admin/reports${qs}`, { authenticated: true })
}

export type ReportAction = 'dismiss' | 'remove_item'

export async function updateReport(id: number, action: ReportAction): Promise<Report> {
  return apiFetch<Report>(`/admin/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
    authenticated: true,
  })
}
