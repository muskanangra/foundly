"""
Tests for the alert matching scoring logic.
No database required — uses simple mock objects.
"""
import pytest
from app.services.matching import _score


class _Item:
    def __init__(self, name, category_id, location):
        self.id = 1
        self.name = name
        self.category_id = category_id
        self.location = location


class _Alert:
    def __init__(self, keyword, category_id=None, location=None):
        self.keyword = keyword
        self.category_id = category_id
        self.location = location


# ── Keyword point ─────────────────────────────────────────────────────────────

def test_keyword_exact_word():
    item = _Item("Black Leather Wallet", 1, "Library")
    alert = _Alert("wallet")
    assert _score(item, alert) >= 1


def test_keyword_prefix_match():
    item = _Item("Black Leather Wallet", 1, "Library")
    alert = _Alert("wal")
    assert _score(item, alert) >= 1


def test_keyword_multi_word_all_match():
    item = _Item("Blue Water Bottle", 1, "Canteen")
    alert = _Alert("blue bottle")
    assert _score(item, alert) >= 1


def test_keyword_multi_word_partial_no_match():
    item = _Item("Blue Water Bottle", 1, "Canteen")
    alert = _Alert("red bottle")
    assert _score(item, alert) == 0  # "red" not in name


def test_keyword_case_insensitive():
    item = _Item("LAPTOP CHARGER", 1, "Hostel")
    alert = _Alert("laptop")
    assert _score(item, alert) >= 1


# ── Category point ────────────────────────────────────────────────────────────

def test_category_match():
    item = _Item("Wallet", 3, "Block A")
    alert = _Alert("wallet", category_id=3)
    assert _score(item, alert) >= 2


def test_category_mismatch():
    item = _Item("Wallet", 3, "Block A")
    alert = _Alert("wallet", category_id=5)
    score = _score(item, alert)
    # keyword matches (+1), but category doesn't
    assert score == 1


def test_category_none_gives_no_point():
    item = _Item("Wallet", 3, "Block A")
    alert = _Alert("wallet", category_id=None)
    assert _score(item, alert) == 1  # only keyword point


# ── Location point ────────────────────────────────────────────────────────────

def test_location_match():
    item = _Item("Keys", 2, "Block B Hostel")
    alert = _Alert("keys", location="Block B")
    assert _score(item, alert) >= 2


def test_location_case_insensitive():
    item = _Item("Keys", 2, "Main Library")
    alert = _Alert("keys", location="library")
    assert _score(item, alert) >= 2


def test_location_mismatch():
    item = _Item("Keys", 2, "Main Library")
    alert = _Alert("keys", location="Hostel")
    score = _score(item, alert)
    assert score == 1  # only keyword


def test_location_none_gives_no_point():
    item = _Item("Keys", 2, "Main Library")
    alert = _Alert("keys", location=None)
    assert _score(item, alert) == 1


# ── Combined scoring ──────────────────────────────────────────────────────────

def test_all_three_points():
    item = _Item("Blue Wallet", 3, "Library")
    alert = _Alert("wallet", category_id=3, location="Library")
    assert _score(item, alert) == 3


def test_two_points_threshold():
    item = _Item("Blue Wallet", 3, "Library")
    alert = _Alert("wallet", category_id=3, location="Hostel")
    assert _score(item, alert) == 2


def test_zero_points():
    item = _Item("Blue Wallet", 3, "Library")
    alert = _Alert("laptop", category_id=5, location="Canteen")
    assert _score(item, alert) == 0


def test_one_point_no_match():
    item = _Item("Blue Wallet", 3, "Library")
    alert = _Alert("wallet", category_id=5, location="Hostel")
    assert _score(item, alert) == 1
