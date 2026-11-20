"""Tests for SearchIndex — no database required."""

import pytest
from datetime import datetime, timezone
from app.dsa.search_index import SearchIndex


def _dt(year=2024, month=1, day=1):
    return datetime(year, month, day, tzinfo=timezone.utc)


def _make_summary(item_id, name, location="Library", category_id=1, owner_id=99):
    return {
        "id": item_id,
        "name": name,
        "description": "",
        "location": location,
        "found_at": _dt(),
        "category": {"id": category_id, "name": "General", "slug": "general"},
        "image_url": f"http://localhost/uploads/item{item_id}.jpg",
        "status": "active",
        "created_at": _dt(),
        "owner_id": owner_id,
    }


# ── on_item_created ───────────────────────────────────────────────────────────

def test_created_item_is_searchable():
    si = SearchIndex()
    summary = _make_summary(1, "Black Leather Wallet")
    si.on_item_created(1, "Black Leather Wallet", summary)
    results = si.search("wallet")
    ids = [r["id"] for r in results]
    assert 1 in ids


def test_created_item_searchable_by_middle_word():
    si = SearchIndex()
    summary = _make_summary(1, "Black Leather Wallet")
    si.on_item_created(1, "Black Leather Wallet", summary)
    results = si.search("leather")
    assert 1 in [r["id"] for r in results]


# ── Multi-word intersection ───────────────────────────────────────────────────

def test_multi_word_search_intersection():
    si = SearchIndex()
    si.on_item_created(1, "Black Leather Wallet", _make_summary(1, "Black Leather Wallet"))
    si.on_item_created(2, "Red Umbrella", _make_summary(2, "Red Umbrella"))
    si.on_item_created(3, "Black Umbrella", _make_summary(3, "Black Umbrella"))

    # "black leather" should only match item 1
    results = si.search("black leather")
    ids = [r["id"] for r in results]
    assert 1 in ids
    assert 2 not in ids
    assert 3 not in ids


def test_multi_word_no_match():
    si = SearchIndex()
    si.on_item_created(1, "Black Wallet", _make_summary(1, "Black Wallet"))
    results = si.search("black umbrella")
    assert results == []


def test_single_word_multiple_results():
    si = SearchIndex()
    si.on_item_created(1, "Blue Wallet", _make_summary(1, "Blue Wallet"))
    si.on_item_created(2, "Red Wallet", _make_summary(2, "Red Wallet"))
    results = si.search("wallet")
    ids = {r["id"] for r in results}
    assert ids == {1, 2}


# ── Hooks keep index in sync ──────────────────────────────────────────────────

def test_on_item_updated_name_change():
    si = SearchIndex()
    si.on_item_created(1, "Old Umbrella", _make_summary(1, "Old Umbrella"))
    # Rename
    new_summary = _make_summary(1, "New Wallet")
    si.on_item_updated("Old Umbrella", 1, "New Wallet", new_summary)

    # Old name no longer finds it
    assert si.search("umbrella") == []
    # New name does
    results = si.search("wallet")
    assert 1 in [r["id"] for r in results]


def test_on_item_updated_no_name_change():
    si = SearchIndex()
    si.on_item_created(1, "Wallet", _make_summary(1, "Wallet", location="Library"))
    new_summary = _make_summary(1, "Wallet", location="Cafeteria")
    si.on_item_updated("Wallet", 1, "Wallet", new_summary)
    results = si.search("wallet")
    assert 1 in [r["id"] for r in results]
    # Summary should reflect new location
    result = next(r for r in results if r["id"] == 1)
    assert result["location"] == "Cafeteria"


def test_on_item_deactivated_removes_from_search():
    si = SearchIndex()
    si.on_item_created(1, "Black Wallet", _make_summary(1, "Black Wallet"))
    si.on_item_deactivated(1, "Black Wallet")
    assert si.search("wallet") == []


def test_on_user_created():
    si = SearchIndex()
    si.on_user_created(42, "Alice Smith")
    key = si.user_key(42)
    data = si.users_table.get(key)
    assert data is not None
    assert data["name"] == "Alice Smith"


# ── Empty search ──────────────────────────────────────────────────────────────

def test_empty_query_returns_empty():
    si = SearchIndex()
    si.on_item_created(1, "Wallet", _make_summary(1, "Wallet"))
    assert si.search("") == []
    assert si.search("   ") == []


# ── Key format ────────────────────────────────────────────────────────────────

def test_item_key_format():
    assert SearchIndex.item_key(1) == "F-0001"
    assert SearchIndex.item_key(9999) == "F-9999"
    assert SearchIndex.item_key(10000) == "F-10000"


def test_user_key_format():
    assert SearchIndex.user_key(7) == "U-0007"


# ── Summary returned from search ─────────────────────────────────────────────

def test_search_returns_full_summary():
    si = SearchIndex()
    summary = _make_summary(5, "Glasses Case", location="Canteen")
    si.on_item_created(5, "Glasses Case", summary)
    results = si.search("glasses")
    assert len(results) == 1
    r = results[0]
    assert r["id"] == 5
    assert r["location"] == "Canteen"
    # owner_id present internally but that's OK in the summary dict
    assert "owner_id" in r
