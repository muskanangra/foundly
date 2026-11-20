"""
Reset all user-generated data from the Foundly database.

Truncates: messages, conversations, notifications, reports,
           match_alerts, found_items, users  (RESTART IDENTITY CASCADE)

Never touches: categories, alembic_version

Usage (from backend/ with the venv active):
    python -m app.scripts.reset_data
"""

import sys
from urllib.parse import urlparse

from sqlalchemy import create_engine, text

from app.config import settings

# ── Helpers ───────────────────────────────────────────────────────────────────

TABLES_TO_RESET = [
    "messages",
    "conversations",
    "notifications",
    "reports",
    "match_alerts",
    "found_items",
    "users",
]

PRESERVED_TABLES = ["categories", "alembic_version"]

ALL_TABLES = TABLES_TO_RESET + PRESERVED_TABLES


def _host_only(database_url: str) -> str:
    """Return just the host from a DATABASE_URL, never the password."""
    parsed = urlparse(database_url)
    return parsed.hostname or "(unknown host)"


def _row_counts(conn) -> dict[str, int]:
    counts = {}
    for table in ALL_TABLES:
        row = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).fetchone()  # noqa: S608
        counts[table] = row[0]
    return counts


def _print_counts(counts: dict[str, int], label: str) -> None:
    print(f"\n{label}")
    max_len = max(len(t) for t in counts)
    for table in ALL_TABLES:
        marker = "  (preserved)" if table in PRESERVED_TABLES else ""
        print(f"  {table:<{max_len}}  {counts[table]:>6} rows{marker}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    host = _host_only(settings.DATABASE_URL)
    print(f"\nConnected to: {host}")
    print(f"Database URL prefix: {settings.DATABASE_URL.split('@')[1].split('/')[0] if '@' in settings.DATABASE_URL else '(parsed above)'}")

    engine = create_engine(settings.db_url, pool_pre_ping=True)

    with engine.connect() as conn:
        before = _row_counts(conn)

    _print_counts(before, "Current row counts:")

    print("\n" + "=" * 55)
    print("  WARNING: This will permanently delete ALL user data,")
    print("  items, messages and notifications in this database.")
    print("  Categories and migration history will be preserved.")
    print("=" * 55)
    print('\nType exactly  RESET FOUNDLY  to confirm, or anything else to abort.')
    print()

    try:
        answer = input("> ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\nAborted.")
        sys.exit(0)

    if answer != "RESET FOUNDLY":
        print("Aborted — no changes made.")
        sys.exit(0)

    print("\nResetting…")

    # ONE transaction: truncate all 7 tables, restart sequences, cascade FKs
    tables_sql = ", ".join(TABLES_TO_RESET)
    with engine.begin() as conn:
        conn.execute(text(
            f"TRUNCATE {tables_sql} RESTART IDENTITY CASCADE"  # noqa: S608
        ))

    print("Truncate committed.")

    with engine.connect() as conn:
        after = _row_counts(conn)

    _print_counts(after, "Row counts after reset:")

    # Sanity checks
    errors = []
    for table in TABLES_TO_RESET:
        if after[table] != 0:
            errors.append(f"  {table} still has {after[table]} rows — truncate may have failed!")
    if after["categories"] != 8:
        errors.append(
            f"  categories has {after['categories']} rows (expected 8) — something went wrong!"
        )
    if after["alembic_version"] == 0:
        errors.append("  alembic_version is empty — migration history was lost!")

    if errors:
        print("\nERROR — unexpected state after reset:")
        for e in errors:
            print(e)
        sys.exit(1)

    print("\n✓ All 7 data tables are empty.")
    print("✓ categories: 8 rows intact.")
    print("✓ alembic_version intact.")
    print(
        "\nNow restart the Render service so the Trie and Hash Table "
        "rebuild from the empty database."
    )


if __name__ == "__main__":
    main()
