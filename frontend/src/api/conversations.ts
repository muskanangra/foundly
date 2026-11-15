/* Conversations endpoints */
import { apiFetch } from './client'
import type { Conversation, Message, PublicUser } from './types'

export async function startConversation(
  itemId: number,
): Promise<{ conversation: Conversation; finder: PublicUser }> {
  return apiFetch<{ conversation: Conversation; finder: PublicUser }>('/conversations', {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId }),
    authenticated: true,
  })
}

export async function listConversations(): Promise<Conversation[]> {
  return apiFetch<Conversation[]>('/conversations', { authenticated: true })
}

export async function getConversation(id: number): Promise<Conversation> {
  return apiFetch<Conversation>(`/conversations/${id}`, { authenticated: true })
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  return apiFetch<Message[]>(`/conversations/${conversationId}/messages`, { authenticated: true })
}

export async function sendMessage(conversationId: number, text: string): Promise<Message> {
  return apiFetch<Message>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
    authenticated: true,
  })
}

export async function sendImage(conversationId: number, image: File): Promise<Message> {
  const form = new FormData()
  form.append('image', image)
  return apiFetch<Message>(`/conversations/${conversationId}/images`, {
    method: 'POST',
    body: form,
    authenticated: true,
  })
}

export async function resolveConversation(id: number): Promise<Conversation> {
  return apiFetch<Conversation>(`/conversations/${id}/resolve`, {
    method: 'PATCH',
    authenticated: true,
  })
}
