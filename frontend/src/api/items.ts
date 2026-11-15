/* Items endpoints */
import { apiFetch } from './client'
import type { Item, Paginated } from './types'

export interface ItemsParams {
  q?: string
  category_id?: number
  location?: string
  date_from?: string
  date_to?: string
  sort?: 'newest' | 'oldest'
  page?: number
  page_size?: number
}

export async function listItems(params: ItemsParams = {}): Promise<Paginated<Item>> {
  const q = new URLSearchParams()
  if (params.q) q.set('q', params.q)
  if (params.category_id) q.set('category_id', String(params.category_id))
  if (params.location) q.set('location', params.location)
  if (params.date_from) q.set('date_from', params.date_from)
  if (params.date_to) q.set('date_to', params.date_to)
  if (params.sort) q.set('sort', params.sort)
  if (params.page) q.set('page', String(params.page))
  if (params.page_size) q.set('page_size', String(params.page_size))
  const qs = q.toString()
  return apiFetch<Paginated<Item>>(`/items${qs ? `?${qs}` : ''}`)
}

export async function getItem(id: number): Promise<Item> {
  return apiFetch<Item>(`/items/${id}`)
}

export interface CreateItemData {
  name: string
  description: string
  location: string
  found_at: string
  category_id: number
  image: File
}

export async function createItem(data: CreateItemData): Promise<Item> {
  const form = new FormData()
  form.append('name', data.name)
  form.append('description', data.description)
  form.append('location', data.location)
  form.append('found_at', data.found_at)
  form.append('category_id', String(data.category_id))
  form.append('image', data.image)
  return apiFetch<Item>('/items', { method: 'POST', body: form, authenticated: true })
}

export interface UpdateItemData {
  name?: string
  description?: string
  location?: string
  found_at?: string
  category_id?: number
  image?: File
}

export async function updateItem(id: number, data: UpdateItemData): Promise<Item> {
  const form = new FormData()
  if (data.name !== undefined) form.append('name', data.name)
  if (data.description !== undefined) form.append('description', data.description)
  if (data.location !== undefined) form.append('location', data.location)
  if (data.found_at !== undefined) form.append('found_at', data.found_at)
  if (data.category_id !== undefined) form.append('category_id', String(data.category_id))
  if (data.image !== undefined) form.append('image', data.image)
  return apiFetch<Item>(`/items/${id}`, { method: 'PUT', body: form, authenticated: true })
}

export async function getMyItems(): Promise<Item[]> {
  return apiFetch<Item[]>('/items/mine', { authenticated: true })
}

export async function markItemReturned(id: number): Promise<Item> {
  return apiFetch<Item>(`/items/${id}/return`, { method: 'PATCH', authenticated: true })
}
