"""Item serialization and DB-query helpers."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.models.item import FoundItem
from app.config import settings


def image_url(image_path: str) -> str:
    """Build the absolute image URL from a stored path or Cloudinary URL."""
    if image_path.startswith("http"):
        return image_path
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


def make_item_summary(item: FoundItem) -> dict:
    """
    Build the summary dict stored in the SearchIndex items_table.
    Includes owner_id for internal is_owner resolution; never sent to clients.
    Category relationship must be loaded before calling this.
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
        "owner_id": item.owner_id,
    }


def db_list_items(
    db: Session,
    category_id: Optional[int] = None,
    location: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 12,
):
    """
    Paginated active-items query WITHOUT text search.
    Used by GET /items when no q parameter is given.
    Text search (q) is handled entirely in-memory by SearchIndex.
    """
    stmt = (
        select(FoundItem)
        .where(FoundItem.status == "active")
        .options(selectinload(FoundItem.category))
    )

    if category_id:
        stmt = stmt.where(FoundItem.category_id == category_id)

    if location:
        stmt = stmt.where(FoundItem.location.ilike(f"%{location}%"))

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            if dt_from.tzinfo is None:
                dt_from = dt_from.replace(tzinfo=timezone.utc)
            dt_from = dt_from.replace(hour=0, minute=0, second=0, microsecond=0)
            stmt = stmt.where(FoundItem.found_at >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            if dt_to.tzinfo is None:
                dt_to = dt_to.replace(tzinfo=timezone.utc)
            dt_to = dt_to.replace(hour=23, minute=59, second=59, microsecond=999999)
            stmt = stmt.where(FoundItem.found_at <= dt_to)
        except ValueError:
            pass

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar_one()

    if sort == "oldest":
        stmt = stmt.order_by(FoundItem.found_at.asc())
    else:
        stmt = stmt.order_by(FoundItem.found_at.desc())

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    items = db.execute(stmt).scalars().all()
    return items, total
