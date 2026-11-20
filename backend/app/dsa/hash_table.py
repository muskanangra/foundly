"""
Separate-chaining hash table with polynomial rolling hash.

Keys are strings (e.g. "F-0023" for items, "U-0007" for users).
Stored in a fixed-size list of buckets; each bucket is the head of a
singly linked list of _Node objects.  No Python dict or set is used
anywhere inside this class.
"""

import math


class _Node:
    """Singly linked list node.  O(1) construction."""

    __slots__ = ("key", "value", "next")

    def __init__(self, key: str, value, next: "_Node | None" = None):
        self.key = key
        self.value = value
        self.next = next


class HashTable:
    """
    Hash table with separate chaining.

    Hash function: polynomial rolling hash with base 31,
        h = (h * 31 + ord(ch)) mod 2^32
        index = h mod capacity
    Resize: doubles capacity when size/capacity > 0.75.

    Average time complexities
    -------------------------
    put(key, value)   O(1) amortised, O(n) worst case (all keys in one chain)
    get(key)          O(1) amortised, O(n) worst case
    remove(key)       O(1) amortised, O(n) worst case
    contains(key)     O(1) amortised
    keys()            O(n)
    stats()           O(capacity)
    """

    _LOAD_THRESHOLD = 0.75
    _MASK = (1 << 32) - 1  # 2^32 - 1 for fast mod-2^32

    def __init__(self, capacity: int = 16):
        """
        Initialise with the given capacity (default 16).
        A custom capacity is useful in tests and demos to force collisions.
        O(capacity).
        """
        self._capacity = max(1, capacity)
        self._buckets: list[_Node | None] = [None] * self._capacity
        self._size = 0

    # ── Hash ──────────────────────────────────────────────────────────────────

    def _hash(self, key: str) -> int:
        """
        Polynomial rolling hash, base 31, modular arithmetic.
        Maps a string key to a bucket index in [0, capacity).
        O(len(key)).
        """
        h = 0
        for ch in key:
            h = (h * 31 + ord(ch)) & self._MASK
        return h % self._capacity

    # ── Core operations ───────────────────────────────────────────────────────

    def put(self, key: str, value) -> None:
        """
        Insert a new key-value pair or update an existing key's value.
        Triggers a resize (double capacity, rehash) if inserting a new key
        would push the load factor above 0.75.
        Average O(1); O(n) worst case.
        """
        # Walk the chain: update if key already exists
        idx = self._hash(key)
        node = self._buckets[idx]
        while node is not None:
            if node.key == key:
                node.value = value
                return
            node = node.next

        # New key: check load factor first
        if (self._size + 1) / self._capacity > self._LOAD_THRESHOLD:
            self._resize()
            idx = self._hash(key)  # recalculate after resize

        self._buckets[idx] = _Node(key, value, self._buckets[idx])
        self._size += 1

    def get(self, key: str):
        """
        Return the value for key, or None if not found.
        Average O(1); O(n) worst case.
        """
        idx = self._hash(key)
        node = self._buckets[idx]
        while node is not None:
            if node.key == key:
                return node.value
            node = node.next
        return None

    def remove(self, key: str) -> bool:
        """
        Remove the entry for key.
        Returns True if the key was found and removed, False otherwise.
        Average O(1); O(n) worst case.
        """
        idx = self._hash(key)
        prev: _Node | None = None
        node = self._buckets[idx]
        while node is not None:
            if node.key == key:
                if prev is None:
                    self._buckets[idx] = node.next
                else:
                    prev.next = node.next
                self._size -= 1
                return True
            prev = node
            node = node.next
        return False

    def contains(self, key: str) -> bool:
        """Return True if key is present. O(1) average."""
        return self.get(key) is not None

    # ── Introspection ─────────────────────────────────────────────────────────

    def __len__(self) -> int:
        """Return the number of key-value pairs stored. O(1)."""
        return self._size

    def load_factor(self) -> float:
        """Return current load factor (size / capacity). O(1)."""
        return self._size / self._capacity

    def keys(self) -> list[str]:
        """Return a list of all keys in insertion order within each bucket. O(n)."""
        result: list[str] = []
        for bucket in self._buckets:
            node = bucket
            while node is not None:
                result.append(node.key)
                node = node.next
        return result

    def stats(self) -> dict:
        """
        Return a diagnostics dictionary:
          size          – number of entries
          capacity      – number of buckets
          load_factor   – size / capacity
          used_buckets  – buckets with at least one entry
          longest_chain – length of the longest chain
          collisions    – entries that share a bucket with an earlier entry
                          (sum of (chain_length - 1) for each non-empty bucket)
        O(capacity).
        """
        used_buckets = 0
        longest_chain = 0
        collisions = 0
        for bucket in self._buckets:
            if bucket is None:
                continue
            used_buckets += 1
            length = 0
            node = bucket
            while node is not None:
                length += 1
                node = node.next
            if length > longest_chain:
                longest_chain = length
            collisions += length - 1  # first entry is not a collision
        return {
            "size": self._size,
            "capacity": self._capacity,
            "load_factor": round(self._size / self._capacity, 4),
            "used_buckets": used_buckets,
            "longest_chain": longest_chain,
            "collisions": collisions,
        }

    # ── Internal ──────────────────────────────────────────────────────────────

    def _resize(self) -> None:
        """
        Double capacity and rehash all entries.
        Called automatically when load factor would exceed 0.75.
        O(n + new_capacity).
        """
        old_buckets = self._buckets
        self._capacity *= 2
        self._buckets = [None] * self._capacity
        self._size = 0
        for bucket in old_buckets:
            node = bucket
            while node is not None:
                # Direct insert — no recursion risk since load factor is ~0.5
                idx = self._hash(node.key)
                self._buckets[idx] = _Node(node.key, node.value, self._buckets[idx])
                self._size += 1
                node = node.next

    # ── Debug helper ──────────────────────────────────────────────────────────

    def bucket_snapshot(self) -> list[list[tuple]]:
        """
        Return the contents of all buckets as nested lists for display.
        bucket_snapshot()[i] = list of (key, value) in bucket i.
        O(n + capacity).
        """
        result: list[list[tuple]] = []
        for bucket in self._buckets:
            chain: list[tuple] = []
            node = bucket
            while node is not None:
                chain.append((node.key, node.value))
                node = node.next
            result.append(chain)
        return result
