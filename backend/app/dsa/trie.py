"""
Trie (prefix tree) for item-name search and autocomplete.

Character set: a-z (0–25), 0-9 (26–35), space (36)  → 37 slots per node.
Children are stored as a plain list[37], never a dict.

Insertion strategy
------------------
For a name like "Black Leather Wallet" we insert three paths:
  1. "black leather wallet"   (full normalized string)
  2. "leather wallet"         (suffix from word boundary 1)
  3. "wallet"                 (suffix from word boundary 2)

Each item_id is stored at the terminal node of each path, so a prefix
like "wal" finds items even if "wallet" is not the first word.

Time complexities
-----------------
normalize(text)       O(len(text))
insert(name, id)      O(W * L)  W=words, L=avg suffix length
remove(name, id)      O(W * L)
search_prefix(prefix) O(L + K)  L=prefix length, K=subtree size
autocomplete(prefix)  O(L + K + R log R)  R=results
node_count()          O(1)
word_count()          O(1)
"""

import re


# ── Character index ────────────────────────────────────────────────────────────

_ALPHABET_SIZE = 37


def _char_to_idx(ch: str) -> int | None:
    """
    Map a single character to its slot index [0..36], or None if not in alphabet.
    a-z → 0-25, 0-9 → 26-35, space → 36.
    O(1).
    """
    if "a" <= ch <= "z":
        return ord(ch) - ord("a")
    if "0" <= ch <= "9":
        return ord(ch) - ord("0") + 26
    if ch == " ":
        return 36
    return None


# ── Normalize ─────────────────────────────────────────────────────────────────

_KEEP_PATTERN = re.compile(r"[^a-z0-9 ]+")


def normalize(text: str) -> str:
    """
    Lowercase, keep only a-z / 0-9 / spaces, collapse repeated spaces, trim.
    O(len(text)).
    """
    lowered = text.lower()
    cleaned = _KEEP_PATTERN.sub(" ", lowered)
    return " ".join(cleaned.split())


# ── Trie node ─────────────────────────────────────────────────────────────────

class TrieNode:
    """
    One node in the Trie.

    children  – fixed list of 37 slots (a-z, 0-9, space); None = no child
    item_ids  – item ids whose indexed path ENDS at this node
    pass_count – number of active path insertions that pass through or end here;
                 used to detect dead nodes during removal/pruning
    """

    __slots__ = ("children", "item_ids", "pass_count")

    def __init__(self):
        self.children: list["TrieNode | None"] = [None] * _ALPHABET_SIZE
        self.item_ids: list[int] = []
        self.pass_count: int = 0


# ── Trie ──────────────────────────────────────────────────────────────────────

class Trie:
    """
    Prefix tree supporting multi-word item-name search.

    Internally the root node is never counted or pruned; it represents the
    empty prefix.  _node_count tracks all non-root nodes.
    _item_count tracks distinct item_ids currently indexed.
    _names maps item_id → original display name (for autocomplete).
    """

    def __init__(self):
        self._root = TrieNode()
        self._node_count: int = 0
        self._item_count: int = 0
        self._names: dict[int, str] = {}  # item_id → original casing name

    # ── Public API ────────────────────────────────────────────────────────────

    def insert(self, name: str, item_id: int) -> None:
        """
        Index an item by name.  Inserts the full normalized name AND each
        suffix that starts at a word boundary, so the item is reachable by
        any of its words as a prefix query.
        Item_id is stored without duplicates at each terminal node.
        O(W * L) where W = number of words, L = average suffix length.
        """
        normalized = normalize(name)
        if not normalized:
            return
        self._names[item_id] = name  # keep original casing
        if item_id not in self._names or self._names[item_id] != name:
            # fresh item or name updated — recount handled by caller
            pass
        words = normalized.split()
        for i in range(len(words)):
            suffix = " ".join(words[i:])
            self._insert_path(suffix, item_id)
        self._item_count = len(self._names)

    def remove(self, name: str, item_id: int) -> None:
        """
        Remove item_id from all paths indexed for name.
        Prunes nodes that are no longer reachable by any active item.
        O(W * L).
        """
        normalized = normalize(name)
        if not normalized:
            return
        words = normalized.split()
        for i in range(len(words)):
            suffix = " ".join(words[i:])
            self._remove_path(suffix, item_id)
        self._names.pop(item_id, None)
        self._item_count = len(self._names)

    def search_prefix(self, prefix: str) -> list[int]:
        """
        Return all item_ids reachable from the given prefix.
        Walks down the prefix (O(L)), then DFS-collects all ids in the subtree
        (O(K) where K = subtree size).  Returns unique ids.
        """
        norm = normalize(prefix)
        if not norm:
            return []
        node = self._root
        for ch in norm:
            idx = _char_to_idx(ch)
            if idx is None or node.children[idx] is None:
                return []
            node = node.children[idx]
        ids: list[int] = []
        seen: set[int] = set()
        self._dfs_collect(node, ids, seen)
        return ids

    def autocomplete(self, prefix: str, limit: int = 8) -> list[str]:
        """
        Return up to `limit` original item names that contain a word starting
        with prefix.  Names are unique and sorted shortest-first.
        O(L + K + R log R) where R = number of matching items.
        """
        norm = normalize(prefix)
        if not norm:
            return []
        node = self._root
        for ch in norm:
            idx = _char_to_idx(ch)
            if idx is None or node.children[idx] is None:
                return []
            node = node.children[idx]
        ids: list[int] = []
        seen_ids: set[int] = set()
        self._dfs_collect(node, ids, seen_ids)
        names: list[str] = []
        seen_names: set[str] = set()
        for item_id in ids:
            orig = self._names.get(item_id)
            if orig is not None and orig not in seen_names:
                seen_names.add(orig)
                names.append(orig)
        names.sort(key=len)
        return names[:limit]

    def node_count(self) -> int:
        """Return the total number of non-root TrieNodes in the tree. O(1)."""
        return self._node_count

    def word_count(self) -> int:
        """Return the number of distinct item_ids currently indexed. O(1)."""
        return self._item_count

    # ── Internals ─────────────────────────────────────────────────────────────

    def _insert_path(self, suffix: str, item_id: int) -> None:
        """
        Walk down (and create) nodes for each character in suffix.
        Increment pass_count at every node along the path.
        Store item_id (without duplicates) at the terminal node.
        O(len(suffix)).
        """
        node = self._root
        for ch in suffix:
            idx = _char_to_idx(ch)
            if idx is None:
                continue
            if node.children[idx] is None:
                node.children[idx] = TrieNode()
                self._node_count += 1
            node = node.children[idx]
            node.pass_count += 1
        if item_id not in node.item_ids:
            node.item_ids.append(item_id)

    def _remove_path(self, suffix: str, item_id: int) -> None:
        """
        Walk the path for suffix, decrement pass_count at every node, and
        prune any node that becomes unused (pass_count == 0 and no item_ids).
        If the path does not exist in the trie, does nothing.
        O(len(suffix)).
        """
        node = self._root
        # Build the traversal record: (parent_node, child_index, child_node)
        path: list[tuple[TrieNode, int, TrieNode]] = []
        for ch in suffix:
            idx = _char_to_idx(ch)
            if idx is None:
                continue
            if node.children[idx] is None:
                return  # path not in trie — nothing to remove
            child = node.children[idx]
            path.append((node, idx, child))
            node = child

        # Remove item_id from terminal node
        terminal = node
        if item_id in terminal.item_ids:
            terminal.item_ids.remove(item_id)

        # Prune bottom-up: always decrement pass_count; delete if unused
        for parent, idx, child in reversed(path):
            child.pass_count -= 1
            if child.pass_count == 0 and len(child.item_ids) == 0:
                parent.children[idx] = None
                self._node_count -= 1
            # Even if not prunable, continue up to decrement all ancestors

    def _dfs_collect(
        self, node: TrieNode, ids: list[int], seen: set[int]
    ) -> None:
        """
        Depth-first traversal: collect all item_ids in the subtree rooted at
        node.  seen prevents duplicates when the same id ends at multiple nodes
        (e.g. a word repeated in the name).
        O(subtree size).
        """
        for item_id in node.item_ids:
            if item_id not in seen:
                seen.add(item_id)
                ids.append(item_id)
        for child in node.children:
            if child is not None:
                self._dfs_collect(child, ids, seen)
