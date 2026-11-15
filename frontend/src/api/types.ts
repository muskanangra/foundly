/* TypeScript types matching the API contract exactly */

export interface User {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

export interface PublicUser {
  id: number
  name: string
}

export interface Category {
  id: number
  name: string
  slug: string
  active_count?: number
}

export interface Item {
  id: number
  name: string
  description: string
  location: string
  found_at: string
  category: Category
  image_url: string
  status: 'active' | 'returned' | 'removed'
  created_at: string
  is_owner: boolean
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface ItemSummary {
  id: number
  name: string
  image_url: string
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  text: string | null
  image_url: string | null
  created_at: string
}

export interface Conversation {
  id: number
  item: ItemSummary
  other_user: PublicUser
  status: 'open' | 'resolved'
  last_message: Message | null
  unread_count: number
  created_at: string
}

export interface Notification {
  id: number
  type: 'message' | 'match'
  title: string
  body: string
  link: string
  is_read: boolean
  created_at: string
}

export interface Report {
  id: number
  item: ItemSummary
  reporter: PublicUser
  reason: 'fake' | 'inappropriate' | 'duplicate' | 'spam' | 'other'
  note: string | null
  status: 'open' | 'dismissed' | 'actioned'
  created_at: string
}

export interface MatchAlert {
  id: number
  keyword: string
  category: Category | null
  location: string | null
  created_at: string
}

export interface Stats {
  active_items: number
  returned_items: number
  users: number
}

export interface AdminStats {
  users: number
  active_items: number
  returned_items: number
  open_reports: number
}

export interface AuthResponse {
  access_token: string
  token_type: 'bearer'
  user: User
}
