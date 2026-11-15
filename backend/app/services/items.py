"""
Item query service.

The search function is TEMPORARY: replaced by Trie + Hash Table in Part 2.
"""

from datetime import datetime, timezone, date
from typing import Optional

from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session, selectinload

from app.models.item import FoundItem
from app.models.category import Category
from app.config import settings


def image_url(image_path: str) -> str:
    """Build the absolute image URL from a stored filename."""
    return f"{settings.PUBLIC_BASE_URL}/uploads/{image_path}"


def serialize_item(item: FoundItem, current_user_id: Optional[int]) -> dict:
    """
    Convert a FoundItem ORM object into the dict expected by ItemResponse.
    Never includes owner details — only is_owner boolean.
    """
    return {
        "id": item.id,
        "name": item.name,
        "description": item.description or "",
        "location": item.location,
        "found_at": item.found_at,
        "category": {
            "id": item.category.id,
            "name": item.category.name,
            "slug": item.category.slug,
        },
        "image_url": image_url(item.image_path),
        "status": item.status,
        "created_at": item.created_at,
        "is_owner": current_user_id is not None and item.owner_id == current_user_id,
    }


# TEMPORARY: replaced by Trie + Hash Table in Part 2
def search_items_query(
    db: Session,
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    location: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 12,
):
    """
    Build and execute a paginated active-items query.

    Text search (q) is a TEMPORARY case-insensitive ILIKE on item name.
    This will be replaced by the Trie + Hash Table implementation in Part 2.
    """
    stmt = (
        select(FoundItem)
        .where(FoundItem.status == "active")
        .options(selectinload(FoundItem.category))
    )

    # TEMPORARY text search — will be replaced by Trie in Part 2
    if q:
        stmt = stmt.where(FoundItem.name.ilike(f"%{q}%"))

    if category_id:
        stmt = stmt.where(FoundItem.category_id == category_id)

    if location:
        stmt = stmt.where(FoundItem.location.ilike(f"%{location}%"))

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            if dt_from.tzinfo is None:
                dt_from = dt_from.replace(tzinfo=timezone.utc)
            # Inclusive: start of that day
            dt_from = dt_from.replace(hour=0, minute=0, second=0, microsecond=0)
            stmt = stmt.where(FoundItem.found_at >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            if dt_to.tzinfo is None:
                dt_to = dt_to.replace(tzinfo=timezone.utc)
            # Inclusive: end of that day
            dt_to = dt_to.replace(hour=23, minute=59, second=59, microsecond=999999)
            stmt = stmt.where(FoundItem.found_at <= dt_to)
        except ValueError:
            pass

    # Count before pagination
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar_one()

    # Ordering
    if sort == "oldest":
        stmt = stmt.order_by(FoundItem.created_at.asc())
    else:
        stmt = stmt.order_by(FoundItem.created_at.desc())

    # Pagination
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    items = db.execute(stmt).scalars().all()
    return items, total
