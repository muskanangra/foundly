"""
DSA Demo — Foundly Data Structures

Run from the backend/ directory:
    python -m app.scripts.dsa_demo

Demonstrates the Trie and HashTable with hand-crafted examples.
Nothing is written to the database.
"""

from app.dsa.trie import Trie, normalize, _char_to_idx
from app.dsa.hash_table import HashTable


RESET = "\033[0m"
BOLD  = "\033[1m"
CYAN  = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED   = "\033[91m"


def header(title: str) -> None:
    print(f"\n{BOLD}{CYAN}{'=' * 60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'=' * 60}{RESET}")


def section(title: str) -> None:
    print(f"\n{BOLD}{YELLOW}── {title} ──{RESET}")


def ok(msg: str) -> None:
    print(f"  {GREEN}✓{RESET} {msg}")


def info(msg: str) -> None:
    print(f"    {msg}")


# ════════════════════════════════════════════════════════════════
# TRIE DEMO
# ════════════════════════════════════════════════════════════════

def demo_trie():
    header("TRIE DEMO")

    demo_items = [
        (1, "Black Leather Wallet"),
        (2, "Black Umbrella"),
        (3, "Blue Water Bottle"),
        (4, "Red Wallet"),
        (5, "Leather Belt"),
    ]

    section("Inserting items")
    trie = Trie()
    for item_id, name in demo_items:
        trie.insert(name, item_id)
        norm = normalize(name)
        words = norm.split()
        paths = [" ".join(words[i:]) for i in range(len(words))]
        ok(f'insert({name!r}, id={item_id})')
        for p in paths:
            info(f"  → path: {p!r}")

    print(f"\n  Nodes created : {trie.node_count()}")
    print(f"  Items indexed : {trie.word_count()}")

    section("Tracing path for prefix 'wal'")
    path_chars = list(normalize("wal"))
    node = trie._root
    path_display = []
    for ch in path_chars:
        idx = _char_to_idx(ch)
        child = node.children[idx] if idx is not None else None
        if child is None:
            info(f"  No child for '{ch}' — prefix not found")
            break
        path_display.append(f"'{ch}' (pass_count={child.pass_count})")
        node = child
    info("  root → " + " → ".join(path_display))

    section("Prefix search results")
    for prefix in ["wal", "black", "leather", "blu", "xyz"]:
        ids = trie.search_prefix(prefix)
        names = [n for _, n in demo_items if _ in ids]
        ok(f"search_prefix({prefix!r:10s}) → item IDs {ids}")
        if names:
            info(f"  Matching names: {names}")

    section("Autocomplete suggestions (limit=5)")
    for prefix in ["wal", "bl", "b", "leather"]:
        suggestions = trie.autocomplete(prefix, limit=5)
        ok(f"autocomplete({prefix!r:10s}) → {suggestions}")

    section("Removal and pruning")
    nodes_before = trie.node_count()
    info(f"Nodes before removing id=1 ('Black Leather Wallet'): {nodes_before}")
    trie.remove("Black Leather Wallet", 1)
    nodes_after = trie.node_count()
    info(f"Nodes after  removing id=1                          : {nodes_after}")
    info(f"Nodes pruned: {nodes_before - nodes_after}")
    ok(f"search_prefix('black') after removal → {trie.search_prefix('black')}")
    ok(f"search_prefix('wallet') after removal → {trie.search_prefix('wallet')} (id=4 still there)")


# ════════════════════════════════════════════════════════════════
# HASH TABLE DEMO
# ════════════════════════════════════════════════════════════════

def _print_buckets(ht: HashTable, label: str = "") -> None:
    if label:
        info(f"\n  {BOLD}{label}{RESET}")
    snapshot = ht.bucket_snapshot()
    for i, chain in enumerate(snapshot):
        if chain:
            chain_str = " → ".join(f"[{k}:{v!r}]" for k, v in chain)
            arrow = f"{YELLOW}●{RESET}"
        else:
            chain_str = "(empty)"
            arrow = "○"
        print(f"    Bucket {i:2d}: {arrow} {chain_str}")
    s = ht.stats()
    print(
        f"\n    size={s['size']}  capacity={s['capacity']}"
        f"  load={s['load_factor']:.2f}"
        f"  used_buckets={s['used_buckets']}"
        f"  longest_chain={s['longest_chain']}"
        f"  collisions={s['collisions']}"
    )


def demo_hash_table():
    header("HASH TABLE DEMO")

    # ── Collision demo ────────────────────────────────────────────────────────
    section("Demonstrating a collision (capacity=4, keys 'a' and 'e')")
    info("  hash('a') = ord('a') = 97;  97 mod 4 = 1")
    info("  hash('e') = ord('e') = 101; 101 mod 4 = 1  ← SAME BUCKET → collision!")
    ht_col = HashTable(capacity=4)
    ht_col.put("a", "Apple")
    ht_col.put("e", "Elderberry")  # collides with "a" in bucket 1
    ht_col.put("b", "Banana")      # bucket 1: ord('b')=98, 98%4=2
    _print_buckets(ht_col, "Bucket layout (bucket 1 has a chain of 2):")
    s = ht_col.stats()
    ok(f"stats() → {s}")

    # ── Normal usage with item keys ───────────────────────────────────────────
    section("Normal usage: item keys F-xxxx")
    ht = HashTable(capacity=4)
    items_to_insert = [
        ("F-0001", "Black Leather Wallet"),
        ("F-0002", "Red Umbrella"),
        ("F-0003", "Blue Water Bottle"),
    ]
    for key, value in items_to_insert:
        h = 0
        for ch in key:
            h = (h * 31 + ord(ch)) & ((1 << 32) - 1)
        bucket = h % ht._capacity
        ht.put(key, value)
        ok(f"put({key!r}, ...)  →  hash mod {ht._capacity} = {bucket}")
    _print_buckets(ht, "Bucket layout (3 items, no resize yet):")

    # ── Resize: before and after ──────────────────────────────────────────────
    section("Resize: before and after (capacity 4 → 8)")
    ht3 = HashTable(capacity=4)
    for key, value in items_to_insert:
        ht3.put(key, value)
    _print_buckets(ht3, f"BEFORE resize  (capacity={ht3._capacity}, load=0.75):")
    # 4th insert: (3+1)/4 = 1.0 > 0.75 → triggers resize to capacity=8
    ht3.put("F-0004", "Glasses Case")
    _print_buckets(ht3, f"AFTER  resize  (capacity={ht3._capacity}, load=0.50):")

    section("get / remove / contains")
    ok(f"get('F-0001')      → {ht.get('F-0001')!r}")
    ok(f"contains('F-0003') → {ht.contains('F-0003')}")
    ok(f"remove('F-0002')   → {ht.remove('F-0002')}")
    ok(f"get('F-0002') after remove → {ht.get('F-0002')!r}")
    ok(f"len(ht) after remove → {len(ht)}")


# ════════════════════════════════════════════════════════════════
# MERGE SORT DEMO
# ════════════════════════════════════════════════════════════════

def demo_merge_sort():
    from datetime import datetime, timezone
    from app.dsa.sorting import merge_sort

    header("MERGE SORT DEMO")

    def dt(day): return datetime(2024, 1, day, tzinfo=timezone.utc)

    items = [
        {"id": 3, "name": "Umbrella",   "found_at": dt(15)},
        {"id": 1, "name": "Wallet",     "found_at": dt(3)},
        {"id": 4, "name": "Water Bottle","found_at": dt(20)},
        {"id": 2, "name": "Keys",       "found_at": dt(10)},
    ]

    section("Input (unsorted)")
    for item in items:
        info(f"  id={item['id']}  found_at=Jan {item['found_at'].day:02d}  {item['name']}")

    section("Sorted newest first (reverse=True)")
    sorted_desc = merge_sort(items, key=lambda x: x["found_at"], reverse=True)
    for item in sorted_desc:
        info(f"  id={item['id']}  found_at=Jan {item['found_at'].day:02d}  {item['name']}")

    section("Sorted oldest first (reverse=False)")
    sorted_asc = merge_sort(items, key=lambda x: x["found_at"], reverse=False)
    for item in sorted_asc:
        info(f"  id={item['id']}  found_at=Jan {item['found_at'].day:02d}  {item['name']}")

    ok("Original list unchanged:")
    for item in items:
        info(f"  id={item['id']} (not sorted)")


# ════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    demo_trie()
    demo_hash_table()
    demo_merge_sort()
    print(f"\n{BOLD}{GREEN}Demo complete — no database writes.{RESET}\n")
