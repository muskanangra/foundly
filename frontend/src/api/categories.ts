/* Categories endpoint */
import { apiFetch } from './client'
import type { Category } from './types'

export async function listCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/categories')
}
