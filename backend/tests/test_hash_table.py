"""Tests for HashTable — no database required."""

import pytest
from app.dsa.hash_table import HashTable, _Node


# ── Basic operations ──────────────────────────────────────────────────────────

def test_put_and_get():
    ht = HashTable()
    ht.put("F-0001", {"id": 1, "name": "Wallet"})
    assert ht.get("F-0001") == {"id": 1, "name": "Wallet"}


def test_get_missing_returns_none():
    ht = HashTable()
    assert ht.get("F-9999") is None


def test_update_existing_key():
    ht = HashTable()
    ht.put("F-0001", "first")
    ht.put("F-0001", "second")
    assert ht.get("F-0001") == "second"
    assert len(ht) == 1


def test_contains():
    ht = HashTable()
    ht.put("U-0007", {"id": 7, "name": "Alice"})
    assert ht.contains("U-0007") is True
    assert ht.contains("U-9999") is False


def test_remove_existing():
    ht = HashTable()
    ht.put("F-0001", "value")
    assert ht.remove("F-0001") is True
    assert ht.get("F-0001") is None
    assert len(ht) == 0


def test_remove_missing_returns_false():
    ht = HashTable()
    assert ht.remove("F-9999") is False


def test_len():
    ht = HashTable()
    assert len(ht) == 0
    ht.put("a", 1)
    ht.put("b", 2)
    assert len(ht) == 2
    ht.remove("a")
    assert len(ht) == 1


def test_keys():
    ht = HashTable()
    ht.put("F-0001", 1)
    ht.put("F-0002", 2)
    ht.put("F-0003", 3)
    keys = set(ht.keys())
    assert keys == {"F-0001", "F-0002", "F-0003"}


# ── Collisions and chaining ───────────────────────────────────────────────────

def test_collisions_with_small_capacity():
    """Force collisions by using capacity=2; all three keys must still be accessible."""
    ht = HashTable(capacity=2)
    ht.put("F-0001", 1)
    ht.put("F-0002", 2)
    ht.put("F-0003", 3)
    assert ht.get("F-0001") == 1
    assert ht.get("F-0002") == 2
    assert ht.get("F-0003") == 3


def test_remove_from_middle_of_chain():
    """Remove a key that is not the head of its chain."""
    ht = HashTable(capacity=1)  # all keys land in bucket 0
    ht.put("x", 10)
    ht.put("y", 20)
    ht.put("z", 30)
    assert ht.remove("y") is True
    assert ht.get("y") is None
    assert ht.get("x") == 10
    assert ht.get("z") == 30


def test_stats_reports_collisions():
    # "a" hashes to 97%4=1, "e" hashes to 101%4=1 — guaranteed same bucket.
    # Neither insert triggers a resize (load factor stays ≤ 0.75).
    ht = HashTable(capacity=4)
    ht.put("a", 1)
    ht.put("e", 2)  # collision with "a" in bucket 1
    s = ht.stats()
    assert s["collisions"] == 1
    assert s["longest_chain"] == 2
    assert s["used_buckets"] == 1


# ── Resize ────────────────────────────────────────────────────────────────────

def test_resize_keeps_all_entries():
    """Insert enough entries to trigger at least one resize; all must remain accessible."""
    ht = HashTable(capacity=4)
    n = 20
    for i in range(n):
        ht.put(f"F-{i:04d}", i * 10)
    assert len(ht) == n
    for i in range(n):
        assert ht.get(f"F-{i:04d}") == i * 10


def test_resize_load_factor_stays_below_threshold():
    ht = HashTable(capacity=4)
    for i in range(10):
        ht.put(f"k{i}", i)
    # After resize(s), load factor must be <= 0.75
    assert ht.load_factor() <= 0.75


def test_capacity_doubles_on_resize():
    ht = HashTable(capacity=4)
    initial_capacity = ht._capacity
    # Trigger resize: need size > 0.75 * 4 = 3, so 4th insert triggers
    for i in range(4):
        ht.put(f"k{i}", i)
    assert ht._capacity > initial_capacity


# ── Stats ─────────────────────────────────────────────────────────────────────

def test_stats_empty():
    ht = HashTable(capacity=8)
    s = ht.stats()
    assert s["size"] == 0
    assert s["capacity"] == 8
    assert s["load_factor"] == 0.0
    assert s["used_buckets"] == 0
    assert s["longest_chain"] == 0
    assert s["collisions"] == 0


def test_stats_single_entry():
    ht = HashTable(capacity=16)
    ht.put("F-0001", "wallet")
    s = ht.stats()
    assert s["size"] == 1
    assert s["used_buckets"] == 1
    assert s["longest_chain"] == 1
    assert s["collisions"] == 0


# ── Node structure ────────────────────────────────────────────────────────────

def test_node_uses_linked_list_not_dict():
    """Verify that HashTable buckets use _Node linked list, not dicts.
    'a' hashes to 97%4=1 and 'e' hashes to 101%4=1, so both land in bucket 1
    without triggering a resize (load factor stays ≤ 0.75).
    """
    ht = HashTable(capacity=4)
    ht.put("a", 1)
    ht.put("e", 2)   # guaranteed collision in bucket 1
    head = ht._buckets[1]  # the chain bucket
    assert isinstance(head, _Node)
    assert head.next is not None
    assert isinstance(head.next, _Node)
