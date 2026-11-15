"""
Search router — TEMPORARY stub for Part 1.
The /search/autocomplete endpoint will be powered by a Trie in Part 2.
"""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item import FoundItem

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/autocomplete")
def autocomplete(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    TEMPORARY: returns up to 5 item names matching q (case-insensitive ILIKE).
    Will be replaced by Trie + Hash Table in Part 2.
    """
    if not q or len(q.strip()) < 2:
        return {"suggestions": []}

    rows = (
        db.query(FoundItem.name)
        .filter(FoundItem.status == "active", FoundItem.name.ilike(f"%{q.strip()}%"))
        .distinct()
        .limit(5)
        .all()
    )
    return {"suggestions": [r[0] for r in rows]}
