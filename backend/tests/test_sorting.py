"""Tests for merge_sort — no database required."""

import pytest
from datetime import datetime, timezone
from app.dsa.sorting import merge_sort


def dt(year, month, day):
    return datetime(year, month, day, tzinfo=timezone.utc)


# ── Edge cases ────────────────────────────────────────────────────────────────

def test_empty_list():
    assert merge_sort([], key=lambda x: x) == []


def test_single_item():
    result = merge_sort([42], key=lambda x: x)
    assert result == [42]


def test_two_items_sorted():
    result = merge_sort([2, 1], key=lambda x: x)
    assert result == [1, 2]


def test_already_sorted():
    result = merge_sort([1, 2, 3, 4, 5], key=lambda x: x)
    assert result == [1, 2, 3, 4, 5]


def test_reverse_sorted_input():
    result = merge_sort([5, 4, 3, 2, 1], key=lambda x: x)
    assert result == [1, 2, 3, 4, 5]


# ── Duplicates ────────────────────────────────────────────────────────────────

def test_duplicates():
    result = merge_sort([3, 1, 2, 1, 3], key=lambda x: x)
    assert result == [1, 1, 2, 3, 3]


def test_all_duplicates():
    result = merge_sort([5, 5, 5], key=lambda x: x)
    assert result == [5, 5, 5]


# ── Stability ─────────────────────────────────────────────────────────────────

def test_stability():
    """Equal keys: items from the left half appear before items from the right half."""
    items = [
        {"key": 1, "order": "a"},
        {"key": 2, "order": "b"},
        {"key": 1, "order": "c"},
        {"key": 2, "order": "d"},
    ]
    result = merge_sort(items, key=lambda x: x["key"])
    # Both key=1 items come first; a before c (stable)
    key1 = [x for x in result if x["key"] == 1]
    key2 = [x for x in result if x["key"] == 2]
    assert [x["order"] for x in key1] == ["a", "c"]
    assert [x["order"] for x in key2] == ["b", "d"]


# ── Reverse ───────────────────────────────────────────────────────────────────

def test_reverse_flag():
    result = merge_sort([1, 3, 2, 5, 4], key=lambda x: x, reverse=True)
    assert result == [5, 4, 3, 2, 1]


def test_reverse_stability():
    items = [
        {"key": 2, "order": "a"},
        {"key": 1, "order": "b"},
        {"key": 2, "order": "c"},
    ]
    result = merge_sort(items, key=lambda x: x["key"], reverse=True)
    key2 = [x for x in result if x["key"] == 2]
    assert [x["order"] for x in key2] == ["a", "c"]  # original order preserved


# ── Custom key (datetime) ─────────────────────────────────────────────────────

def test_sort_by_datetime_ascending():
    items = [
        {"found_at": dt(2024, 3, 1)},
        {"found_at": dt(2024, 1, 1)},
        {"found_at": dt(2024, 2, 1)},
    ]
    result = merge_sort(items, key=lambda x: x["found_at"])
    dates = [x["found_at"] for x in result]
    assert dates == sorted(dates)


def test_sort_by_datetime_descending():
    items = [
        {"found_at": dt(2024, 1, 1)},
        {"found_at": dt(2024, 3, 1)},
        {"found_at": dt(2024, 2, 1)},
    ]
    result = merge_sort(items, key=lambda x: x["found_at"], reverse=True)
    dates = [x["found_at"] for x in result]
    assert dates == sorted(dates, reverse=True)


# ── Does not mutate original ──────────────────────────────────────────────────

def test_original_not_mutated():
    original = [3, 1, 2]
    result = merge_sort(original, key=lambda x: x)
    assert original == [3, 1, 2]  # unchanged
    assert result == [1, 2, 3]
