# Foundly API Contract

The backend must be implemented to match this contract exactly.

---

## General

- **Base URL**: `VITE_API_URL` environment variable (default `http://localhost:8000`)
- **Data format**: JSON with `snake_case` field names
- **Authentication**: `Authorization: Bearer <token>` header on authenticated endpoints
- **Error responses**: HTTP status code + JSON body `{ "detail": string }`
- **Dates**: ISO 8601 strings (e.g. `2024-11-13T14:30:00Z`)
- **image_url**: always an absolute URL (e.g. `https://cdn.example.com/img/abc.jpg`)

---

## Types

```ts
User         { id: number, name: string, email: string, role: "user" | "admin", created_at: string }
PublicUser   { id: number, name: string }
Category     { id: number, name: string, slug: string }

Item {
  id: number, name: string, description: string, location: string,
  found_at: string,            // ISO 8601 — when the item was physically found
  category: Category,
  image_url: string,
  status: "active" | "returned" | "removed",
  created_at: string,
  is_owner: boolean            // true only for the authenticated user who posted this item
  // finder info NEVER appears in this type
}

Paginated<T> { items: T[], total: number, page: number, page_size: number }
ItemSummary  { id: number, name: string, image_url: string }

Message {
  id: number, conversation_id: number, sender_id: number,
  text: string | null, image_url: string | null, created_at: string
}

Conversation {
  id: number, item: ItemSummary, other_user: PublicUser,
  status: "open" | "resolved",
  last_message: Message | null,
  unread_count: number, created_at: string
}

Notification {
  id: number, type: "message" | "match",
  title: string, body: string,
  link: string,          // frontend path, e.g. /chats/12 or /items/5
  is_read: boolean, created_at: string
}

Report {
  id: number, item: ItemSummary, reporter: PublicUser,
  reason: "fake" | "inappropriate" | "duplicate" | "spam" | "other",
  note: string | null,
  status: "open" | "dismissed" | "actioned",
  created_at: string
}

MatchAlert {
  id: number, keyword: string,
  category: Category | null,
  location: string | null,
  created_at: string
}

Stats      { active_items: number, returned_items: number, users: number }
AdminStats { users: number, active_items: number, returned_items: number, open_reports: number }

AuthResponse { access_token: string, token_type: "bearer", user: User }
```

---

## Endpoints

### Auth

| Method | Path | Body | Auth | Response |
|--------|------|------|------|----------|
| POST | `/auth/register` | `{ name, email, password }` | — | `AuthResponse` |
| POST | `/auth/login` | `{ email, password }` | — | `AuthResponse` |
| GET | `/auth/me` | — | ✓ | `User` |

### Public Data

| Method | Path | Query | Auth | Response |
|--------|------|-------|------|----------|
| GET | `/stats` | — | — | `Stats` |
| GET | `/categories` | — | — | `Category[]` |
| GET | `/search/autocomplete` | `q=<string>` | — | `{ suggestions: string[] }` |

### Items

| Method | Path | Notes | Auth | Response |
|--------|------|-------|------|----------|
| GET | `/items` | Query: `q`, `category_id`, `location`, `date_from`, `date_to`, `sort` (`newest`\|`oldest`), `page` (default 1), `page_size` (default 12). Active items only. | — | `Paginated<Item>` |
| GET | `/items/{id}` | — | — | `Item` |
| POST | `/items` | Multipart: `image` (file), `name`, `description`, `location`, `found_at`, `category_id` | ✓ | `Item` |
| PUT | `/items/{id}` | Same as POST, `image` optional. Owner only. | ✓ | `Item` |
| GET | `/items/mine` | Includes returned items. | ✓ | `Item[]` |
| PATCH | `/items/{id}/return` | Owner only. Sets status to `returned`. | ✓ | `Item` |

### Conversations

> **Privacy rule**: the finder's identity is ONLY revealed through `POST /conversations` → `finder` field. It must never appear in any other endpoint.

| Method | Path | Body/Notes | Auth | Response |
|--------|------|-----------|------|----------|
| POST | `/conversations` | `{ item_id }` — creates or returns existing conversation | ✓ | `{ conversation: Conversation, finder: PublicUser }` |
| GET | `/conversations` | — | ✓ | `Conversation[]` |
| GET | `/conversations/{id}` | Participants only. | ✓ | `Conversation` |
| GET | `/conversations/{id}/messages` | — | ✓ | `Message[]` |
| POST | `/conversations/{id}/messages` | `{ text }` | ✓ | `Message` |
| POST | `/conversations/{id}/images` | Multipart: `image` | ✓ | `Message` |
| PATCH | `/conversations/{id}/resolve` | Either participant. | ✓ | `Conversation` |

### Real-Time (WebSocket)

```
{API_URL with http→ws}/ws?token=<access_token>
```

Server pushes two event types:
- `{ "type": "message",      "data": Message }`
- `{ "type": "notification", "data": Notification }`

### Notifications

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/notifications` | ✓ | `Notification[]` |
| GET | `/notifications/unread-count` | ✓ | `{ count: number }` |
| PATCH | `/notifications/{id}/read` | ✓ | `Notification` |
| PATCH | `/notifications/read-all` | ✓ | `{ updated: number }` |

### Reports

| Method | Path | Body | Auth | Response |
|--------|------|------|------|----------|
| POST | `/reports` | `{ item_id, reason, note? }` | ✓ | `Report` |

### Alerts

| Method | Path | Body | Auth | Response |
|--------|------|------|------|----------|
| GET | `/alerts` | — | ✓ | `MatchAlert[]` |
| POST | `/alerts` | `{ keyword, category_id?, location? }` | ✓ | `MatchAlert` |
| DELETE | `/alerts/{id}` | — | ✓ | 204 No Content |

### Admin (role `admin` required)

| Method | Path | Notes | Response |
|--------|------|-------|----------|
| GET | `/admin/stats` | — | `AdminStats` |
| GET | `/admin/reports` | Query: `status=open\|dismissed\|actioned` (optional) | `Report[]` |
| PATCH | `/admin/reports/{id}` | Body: `{ action: "dismiss" \| "remove_item" }` | `Report` |

---

## Error Codes Used

| Status | Meaning |
|--------|---------|
| 400 | Validation error (see `detail`) |
| 401 | Missing or invalid token |
| 403 | Forbidden (not owner / not admin) |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already registered) |
| 422 | Unprocessable entity |
| 500 | Server error |
