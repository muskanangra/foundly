"""Tests for Trie — no database required."""

import pytest
from app.dsa.trie import Trie, TrieNode, normalize, _char_to_idx


# ── normalize ─────────────────────────────────────────────────────────────────

def test_normalize_lowercase():
    assert normalize("Black Leather Wallet") == "black leather wallet"


def test_normalize_strips_special_chars():
    assert normalize("!Hello@World#") == "hello world"


def test_normalize_collapses_spaces():
    assert normalize("  too   many   spaces  ") == "too many spaces"


def test_normalize_digits():
    assert normalize("Room 101") == "room 101"


def test_normalize_empty():
    assert normalize("") == ""


# ── _char_to_idx ──────────────────────────────────────────────────────────────

def test_char_to_idx_letters():
    assert _char_to_idx("a") == 0
    assert _char_to_idx("z") == 25


def test_char_to_idx_digits():
    assert _char_to_idx("0") == 26
    assert _char_to_idx("9") == 35


def test_char_to_idx_space():
    assert _char_to_idx(" ") == 36


def test_char_to_idx_invalid():
    assert _char_to_idx("!") is None
    assert _char_to_idx("Z") is None  # uppercase not in alphabet


# ── Basic insert / search ─────────────────────────────────────────────────────

def test_insert_and_exact_search():
    t = Trie()
    t.insert("Wallet", 1)
    result = t.search_prefix("wallet")
    assert 1 in result


def test_prefix_search_finds_item():
    t = Trie()
    t.insert("Wallet", 1)
    result = t.search_prefix("wal")
    assert 1 in result


def test_prefix_mismatch_returns_empty():
    t = Trie()
    t.insert("Wallet", 1)
    result = t.search_prefix("xyz")
    assert result == []


# ── Word-boundary search ──────────────────────────────────────────────────────

def test_word_boundary_first_word():
    t = Trie()
    t.insert("Black Leather Wallet", 1)
    # Search by first word
    assert 1 in t.search_prefix("black")


def test_word_boundary_middle_word():
    t = Trie()
    t.insert("Black Leather Wallet", 1)
    # Search by middle word
    assert 1 in t.search_prefix("leather")


def test_word_boundary_last_word():
    t = Trie()
    t.insert("Black Leather Wallet", 1)
    # Search by last word
    assert 1 in t.search_prefix("wallet")


def test_non_word_prefix_not_found():
    t = Trie()
    t.insert("Black Leather Wallet", 1)
    # "eather" is not a word-boundary start
    result = t.search_prefix("eather")
    assert 1 not in result


# ── Multiple items ────────────────────────────────────────────────────────────

def test_multiple_items_same_word():
    t = Trie()
    t.insert("Blue Wallet", 1)
    t.insert("Red Wallet", 2)
    result = t.search_prefix("wallet")
    assert 1 in result
    assert 2 in result


def test_search_returns_unique_ids():
    t = Trie()
    t.insert("Wallet Wallet", 1)  # "wallet" at two word boundaries
    result = t.search_prefix("wallet")
    assert result.count(1) == 1  # no duplicate


# ── Removal and pruning ───────────────────────────────────────────────────────

def test_remove_item():
    t = Trie()
    t.insert("Wallet", 1)
    t.remove("Wallet", 1)
    result = t.search_prefix("wal")
    assert 1 not in result


def test_remove_one_keeps_other():
    t = Trie()
    t.insert("Wallet", 1)
    t.insert("Wallet", 2)
    t.remove("Wallet", 1)
    result = t.search_prefix("wal")
    assert 1 not in result
    assert 2 in result


def test_pruning_decreases_node_count():
    t = Trie()
    t.insert("Wallet", 1)
    nodes_before = t.node_count()
    t.remove("Wallet", 1)
    nodes_after = t.node_count()
    assert nodes_after < nodes_before


def test_remove_word_boundary_path():
    t = Trie()
    t.insert("Black Wallet", 1)
    t.remove("Black Wallet", 1)
    # Neither "black" nor "wallet" should find item 1
    assert 1 not in t.search_prefix("black")
    assert 1 not in t.search_prefix("wallet")


# ── Autocomplete ──────────────────────────────────────────────────────────────

def test_autocomplete_returns_original_casing():
    t = Trie()
    t.insert("Black Leather Wallet", 1)
    suggestions = t.autocomplete("wal")
    assert "Black Leather Wallet" in suggestions


def test_autocomplete_shortest_first():
    t = Trie()
    t.insert("Blue Wallet", 1)
    t.insert("Black Leather Wallet", 2)
    t.insert("Wallet", 3)
    suggestions = t.autocomplete("wal")
    assert suggestions[0] == "Wallet"
    # Shorter names should appear first
    lengths = [len(s) for s in suggestions]
    assert lengths == sorted(lengths)


def test_autocomplete_limit():
    t = Trie()
    for i in range(20):
        t.insert(f"Item {i} Wallet", i)
    suggestions = t.autocomplete("wallet", limit=5)
    assert len(suggestions) <= 5


def test_autocomplete_empty_query():
    t = Trie()
    t.insert("Wallet", 1)
    assert t.autocomplete("") == []


def test_autocomplete_no_match():
    t = Trie()
    t.insert("Wallet", 1)
    assert t.autocomplete("xyz") == []


def test_autocomplete_deduplicates_names():
    """Two items with same name → name appears only once in autocomplete."""
    t = Trie()
    t.insert("Wallet", 1)
    t.insert("Wallet", 2)
    suggestions = t.autocomplete("wal")
    assert suggestions.count("Wallet") == 1


# ── Node count / word count ───────────────────────────────────────────────────

def test_node_count_increases_on_insert():
    t = Trie()
    assert t.node_count() == 0
    t.insert("hi", 1)
    assert t.node_count() == 2  # 'h' and 'i'


def test_word_count():
    t = Trie()
    assert t.word_count() == 0
    t.insert("Wallet", 1)
    t.insert("Umbrella", 2)
    assert t.word_count() == 2
    t.remove("Wallet", 1)
    assert t.word_count() == 1


# ── TrieNode structure ────────────────────────────────────────────────────────

def test_trie_node_uses_list_not_dict():
    """Verify that TrieNode children is a plain list of length 37."""
    node = TrieNode()
    assert isinstance(node.children, list)
    assert len(node.children) == 37
    # All slots start as None
    assert all(c is None for c in node.children)
