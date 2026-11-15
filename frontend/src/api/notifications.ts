/* Notifications endpoints */
import { apiFetch } from './client'
import type { Notification } from './types'

export async function listNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>('/notifications', { authenticated: true })
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('/notifications/unread-count', { authenticated: true })
}

export async function markNotificationRead(id: number): Promise<Notification> {
  return apiFetch<Notification>(`/notifications/${id}/read`, {
    method: 'PATCH',
    authenticated: true,
  })
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>('/notifications/read-all', {
    method: 'PATCH',
    authenticated: true,
  })
}
