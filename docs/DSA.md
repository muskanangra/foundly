# Foundly — Data Structures Documentation

> **Project:** Lost-and-found platform for JUIT  
> **Team:** Muskan Angra & Mannat Marwaha  
> **Course:** Data Structures Lab

---

## Overview

Foundly uses three custom data structures — a **Trie**, a **Hash Table**, and **Merge Sort** — to power fast in-memory search and autocomplete without replacing PostgreSQL as the permanent store.

| Structure | File | Responsibility |
|-----------|------|---------------|
| Trie | `app/dsa/trie.py` | Prefix search & autocomplete for item names |
| Hash Table | `app/dsa/hash_table.py` | O(1) lookup of item summaries and user info |
| Merge Sort | `app/dsa/sorting.py` | Sort search results by found_at date |
| Search Index | `app/dsa/search_index.py` | Coordinates all three structures |

---

## 1. Hash Table (`HashTable`)

### What it is
A fixed-size array of **buckets** where each bucket is the head of a singly linked list of `_Node(key, value, next)` objects.  Python's `dict` and `set` are **not** used anywhere inside this class.

### Collision handling — Separate Chaining
When two keys hash to the same bucket index, the new node is **prepended** to that bucket's linked list (chain).  Lookup walks the chain comparing keys.

### Hash function — Polynomial Rolling Hash
```
h = 0
for ch in key:
    h = (h * 31 + ord(ch))  mod  2^32
index = h mod capacity
```
Using base 31 (a small prime) gives a good bit-avalanche across the string's characters.

### Resize trigger
When `(size + 1) / capacity > 0.75`, the capacity is **doubled** and every entry is rehashed.  After a resize the load factor drops to roughly 0.5.

### Where it is used in Foundly
| Instance | Key | Value |
|----------|-----|-------|
| `search_index.items_table` | `"F-0023"` | Full item summary dict (all fields needed to build `ItemResponse`) |
| `search_index.users_table` | `"U-0007"` | `{id, name}` — used in Contact Finder |

### Time complexity
| Operation | Average | Worst case |
|-----------|---------|------------|
| `put` | O(1) | O(n) |
| `get` | O(1) | O(n) |
| `remove` | O(1) | O(n) |
| Resize | O(n + capacity) | O(n + capacity) |

Worst case occurs when every key hashes to the same bucket (chain of length n).

### Space complexity
O(n + capacity) where n = number of entries.

---

## 2. Trie

### What it is
A **prefix tree** where each node has a fixed array of **37 child slots**:
- Slots 0–25 → letters a–z
- Slots 26–35 → digits 0–9
- Slot 36 → space

Children are stored as `list[37]` (never a dict).  Each node also carries:
- `item_ids: list[int]` — ids of items whose indexed path **ends** at this node
- `pass_count: int` — number of active path insertions passing through / ending here (used for pruning)

### Word-boundary insertion
For the item name `"Black Leather Wallet"` we insert **three** paths:
1. `"black leather wallet"` (full normalized name)
2. `"leather wallet"` (suffix from "leather")
3. `"wallet"` (suffix from "wallet")

This makes the item reachable by typing any of its words as a prefix.  Item ids are stored (without duplicates) at the terminal node of each path.

### Prefix search
Walk down the prefix character-by-character (O(L)), then **depth-first collect** all item_ids in the subtree below (O(K)).  Returns a deduplicated list.

### Autocomplete
Same walk + collect, then look up each id's original display name, deduplicate names, sort shortest-first, and return up to `limit` suggestions.

### Pruning on removal
`pass_count` is incremented on every node along a path at insertion time.  On removal it is decremented.  When `pass_count == 0` and `item_ids == []` for a node, the parent's pointer to it is set to `None` and `_node_count` is decremented.  This keeps the trie compact.

### Where it is used in Foundly
`GET /search/autocomplete` and the `q=` branch of `GET /items` both query `search_index.trie`.

### Time complexity
| Operation | Complexity |
|-----------|-----------|
| `normalize(text)` | O(len(text)) |
| `insert(name, id)` | O(W × L) — W words, L avg suffix length |
| `remove(name, id)` | O(W × L) |
| `search_prefix(prefix)` | O(L + K) — L prefix, K subtree size |
| `autocomplete(prefix, limit)` | O(L + K + R log R) — R results |

### Space complexity
O(N × 37) where N = total nodes.  In practice much less than 37N because most slots are `None`.

---

## 3. Merge Sort (`merge_sort`)

### What it is
A standard **divide-and-conquer** sort: split the list in half, recursively sort each half, then merge.

### Properties
- **Stable**: equal elements preserve their original relative order.
- **O(n log n)** time in all cases (no best-case shortcut).
- Returns a **new** list — the input is never mutated.

### Where it is used in Foundly
After `SearchIndex.search(q)` returns matching summaries and they are filtered in Python, `merge_sort(summaries, key=lambda s: s["found_at"], reverse=...)` orders them by find date before pagination.

---

## 4. Search Index (`SearchIndex`)

A singleton (`search_index`) that coordinates the Trie and both Hash Tables.

### Startup
`build_from_db(session)` runs at server startup (FastAPI lifespan), queries all ACTIVE items and all users from PostgreSQL, inserts each item into the Trie and `items_table`, and each user into `users_table`.

### Hooks (called after every DB commit)
| Hook | Called from | What it does |
|------|-------------|-------------|
| `on_item_created` | POST /items | Insert into Trie + items_table |
| `on_item_updated` | PUT /items/{id} | Re-insert in Trie if name changed; always update items_table |
| `on_item_deactivated` | PATCH /items/{id}/return, admin remove_item | Remove from Trie + items_table |
| `on_user_created` | POST /auth/register | Insert into users_table |

Writes are protected by a `threading.Lock`.

### Multi-word search (intersection)
```
words = normalize(q).split()
for word in words:
    ids = trie.search_prefix(word)   → set of ids
result = intersection of all per-word sets
```
Then each id is looked up in `items_table` for its full summary.

---

## 5. Matching (`app/services/matching.py`)

When a new item is posted (`POST /items`), Foundly automatically checks every saved `MatchAlert` for a potential match and notifies the alert owner if the score is high enough.

### Scoring (max 3 points, threshold = 2)

| Point | Condition |
|-------|-----------|
| **keyword** | Build a small Trie from the item's name; every word in the alert keyword must prefix-match a word in that Trie. |
| **category** | The alert's `category_id` equals the item's `category_id`. |
| **location** | The alert's location string appears inside the item's location (case-insensitive substring). |

A score of **2 or more** triggers a `"match"` notification to the alert owner.

### How the Trie is reused

The matching service does **not** query the global `search_index`; instead it creates a *fresh, single-item Trie* for each item being checked:

```python
t = Trie()
t.insert(item.name, item.id)          # O(W × L)
match = all(t.search_prefix(w) for w in kw_words)  # O(L + K) per word
```

This reuses the same `Trie` class (word-boundary insertion + prefix search) that powers the global search index, but scoped to the item at hand so no shared state is touched.  The Trie is discarded after scoring.

### Error safety

`run_matching` wraps everything in a broad `try/except` and only logs failures — a buggy alert or unexpected DB state can never prevent the item from being created.

---

## 6. Database vs In-Memory Division

| Concern | PostgreSQL | In-memory structures |
|---------|-----------|---------------------|
| Persistent storage | ✓ — source of truth | ✗ |
| Survive server restart | ✓ | Rebuilt from DB on startup |
| Complex joins (categories, counts) | ✓ | ✗ |
| Text prefix / multi-word search | Slow ILIKE | ✓ Trie O(L + K) |
| Item summary lookup by id | O(log n) B-tree | O(1) avg Hash Table |
| Autocomplete | Multiple ILIKE queries | O(L + K) single traversal |

---

## Viva Questions & Answers

**Q: Why a Trie instead of PostgreSQL full-text search?**  
A: PostgreSQL `ILIKE` on a text column requires a sequential or B-tree scan that degrades to O(n) for prefix queries. A Trie answers any prefix query in O(L + K) where L is the prefix length — independent of the total number of items. Additionally, our multi-word intersection (every word must match) would require multiple DB round-trips; with the Trie it is done in memory.

**Q: What is the search complexity in a Trie?**  
A: O(L) to walk to the prefix node, then O(K) to collect all item ids in the subtree, where L = length of the query prefix and K = size of the matching subtree. L is typically short (< 20 chars) so the dominant cost is K.

**Q: Why hashing? What exactly is hashed?**  
A: Hashing gives O(1) average lookup of item summaries by their id. We hash the string key (e.g. `"F-0023"`) with a polynomial rolling hash (base 31, mod 2^32) to get a bucket index. Storing summaries in a Hash Table means a search result list is resolved to full objects without touching the database.

**Q: Average lookup complexity?**  
A: O(1) average for `get`, `put`, `remove` on HashTable. This holds when the load factor is kept below 0.75 (enforced by our automatic doubling resize). Worst case O(n) if all keys hash to the same bucket.

**Q: Why a Trie instead of a BST for names?**  
A: A BST can answer exact-match queries in O(log n), but prefix queries still require O(k log n) work (visit every matching node). A Trie answers prefix queries in O(L + K) regardless of how many total items exist — it only visits the nodes that match. BSTs also don't naturally support autocomplete or word-boundary search.

**Q: The main disadvantage of a Trie?**  
A: Memory. Each node holds an array of 37 slots. With a large item set having diverse names, the Trie can consume significantly more memory than a simple sorted array or BST. We mitigate this with pruning (`pass_count` and removing dead nodes on item deletion).

**Q: What happens on a collision? Which techniques exist?**  
A: When two keys hash to the same bucket index, they are stored in the same **linked chain** (separate chaining). Lookup walks the chain comparing keys. The alternative technique is **open addressing** (linear probing, quadratic probing, double hashing), where collisions are resolved by probing other slots in the same array. We chose separate chaining because it handles high load factors gracefully and deletion is straightforward (no "deleted" tombstones needed).

**Q: Why not just a normal database query?**  
A: Every API request would hit the network-connected PostgreSQL database. For prefix search, the DB would need a full table scan or a specialised index (GIN/GiST with trigrams) — adding operational complexity. Our in-memory Trie is rebuilt once at startup and kept in sync via hooks, giving sub-millisecond response times for search and autocomplete without any network round-trip.
