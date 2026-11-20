"""
In-memory search index backed by a Trie (names) and two HashTables
(item summaries, user info).

One module-level singleton is shared across all requests.  Writes are
protected by a threading.Lock so the index stays consistent under
concurrent FastAPI requests.
"""

import logging
import threading
from typing import TYPE_CHECKING

from app.dsa.hash_table import HashTable
from app.dsa.trie import Trie

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class SearchIndex:
    """
    Three in-memory structures that accelerate search without replacing
    PostgreSQL as the source of truth.

    trie          – maps normalized item-name prefixes → item_ids
    items_table   – HashTable  "F-{id:04d}" → item summary dict
    users_table   – HashTable  "U-{id:04d}" → { id, name }

    The DB is the authority; these structures are populated at startup and
    kept in sync via hook methods called after every DB commit.
    """

    def __init__(self) -> None:
        self.trie = Trie()
        self.items_table: HashTable = HashTable()
        self.users_table: HashTable = HashTable()
        self._lock = threading.Lock()

    # ── Key helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def item_key(item_id: int) -> str:
        """Return the hash-table key for an item. O(1)."""
        return f"F-{item_id:04d}"

    @staticmethod
    def user_key(user_id: int) -> str:
        """Return the hash-table key for a user. O(1)."""
        return f"U-{user_id:04d}"

    # ── Startup ───────────────────────────────────────────────────────────────

    def build_from_db(self, session: "Session") -> None:
        """
        Load all ACTIVE items and ALL users from the database into the
        in-memory structures.  Called once during the FastAPI lifespan
        (before the first request is served).
        O(n) where n = number of active items + users.
        """
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.item import FoundItem
        from app.models.user import User
        from app.services.items import image_url as build_image_url

        # -- Items ------------------------------------------------------------
        stmt = (
            select(FoundItem)
            .where(FoundItem.status == "active")
            .options(selectinload(FoundItem.category))
        )
        items = session.execute(stmt).scalars().all()
        for item in items:
            summary = _make_summary(item, build_image_url)
            key = self.item_key(item.id)
            self.items_table.put(key, summary)
            self.trie.insert(item.name, item.id)

        # -- Users ------------------------------------------------------------
        users = session.execute(select(User)).scalars().all()
        for user in users:
            self.users_table.put(self.user_key(user.id), {"id": user.id, "name": user.name})

        logger.info(
            "SearchIndex built: %d active items indexed, %d users loaded. "
            "items_table %s  users_table %s",
            len(items),
            len(users),
            self.items_table.stats(),
            self.users_table.stats(),
        )

    # ── Hooks (call after every relevant DB commit) ────────────────────────────

    def on_item_created(self, item_id: int, item_name: str, summary: dict) -> None:
        """
        Add a newly created item to the index.
        Called after POST /items commits to the database.
        O(W * L) for the Trie insertion.
        """
        with self._lock:
            self.trie.insert(item_name, item_id)
            self.items_table.put(self.item_key(item_id), summary)

    def on_item_updated(
        self, old_name: str, item_id: int, new_name: str, summary: dict
    ) -> None:
        """
        Reflect a PUT /items/{id} change in the index.
        If the name changed, removes the old Trie paths and inserts new ones.
        Always overwrites the items_table entry with fresh data.
        O(W * L).
        """
        from app.dsa.trie import normalize

        with self._lock:
            if normalize(old_name) != normalize(new_name):
                self.trie.remove(old_name, item_id)
                self.trie.insert(new_name, item_id)
            self.items_table.put(self.item_key(item_id), summary)

    def on_item_deactivated(self, item_id: int, item_name: str) -> None:
        """
        Remove a returned or admin-removed item from the index.
        Called after PATCH /items/{id}/return and admin remove_item.
        O(W * L).
        """
        with self._lock:
            self.trie.remove(item_name, item_id)
            self.items_table.remove(self.item_key(item_id))

    def on_user_created(self, user_id: int, user_name: str) -> None:
        """
        Add a newly registered user to users_table.
        Called after POST /auth/register commits.
        O(1) average.
        """
        with self._lock:
            self.users_table.put(self.user_key(user_id), {"id": user_id, "name": user_name})

    # ── Search ────────────────────────────────────────────────────────────────

    def search(self, q: str) -> list[dict]:
        """
        Multi-word search: each word in q must match a prefix of some word in
        an item's name.  Returns the INTERSECTION of per-word result sets,
        looking each id up in items_table for the full summary.

        Read path — no lock (slight eventual-consistency is acceptable).
        O(W * (L + K)) where W = words in q, L = prefix length, K = subtree size.
        """
        from app.dsa.trie import normalize

        words = normalize(q).split()
        if not words:
            return []

        # Collect item_id sets for each word
        id_sets: list[set[int]] = []
        for word in words:
            ids = self.trie.search_prefix(word)
            if not ids:
                return []  # one word has no matches → intersection is empty
            id_sets.append(set(ids))

        # Intersection
        common_ids: set[int] = id_sets[0]
        for s in id_sets[1:]:
            common_ids = common_ids & s

        # Fetch summaries
        results: list[dict] = []
        for item_id in common_ids:
            summary = self.items_table.get(self.item_key(item_id))
            if summary is not None:
                results.append(summary)
        return results


# ── Helper ────────────────────────────────────────────────────────────────────

def _make_summary(item, build_image_url) -> dict:
    """
    Convert a FoundItem ORM object into the summary dict stored in items_table.
    Includes owner_id for internal is_owner checks; it is NEVER sent to clients.
    """
    return {
        "id": item.id,
        "name": item.name,
        "description": item.description or "",
        "location": item.location,
        "found_at": item.found_at,
        "category": {
            "id": item.category.id,
            "name": item.category.name,
            "slug": item.category.slug,
        },
        "image_url": build_image_url(item.image_path),
        "status": item.status,
        "created_at": item.created_at,
        "owner_id": item.owner_id,  # internal only
    }


# ── Singleton ─────────────────────────────────────────────────────────────────

search_index = SearchIndex()
