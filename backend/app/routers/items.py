from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.item import FoundItem
from app.models.category import Category
from app.models.user import User
from app.schemas.item import ItemResponse, PaginatedItemsResponse
from app.core.security import get_current_user, get_current_user_optional
from app.services.storage import save_image
from app.services.items import serialize_item, make_item_summary, db_list_items
from app.dsa.search_index import search_index
from app.dsa.sorting import merge_sort

router = APIRouter(prefix="/items", tags=["items"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_item(db: Session, item_id: int) -> FoundItem:
    item = (
        db.query(FoundItem)
        .options(selectinload(FoundItem.category))
        .filter(FoundItem.id == item_id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


def _parse_found_at(found_at_str: str) -> datetime:
    """Parse found_at from form field (datetime-local may omit timezone)."""
    try:
        dt = datetime.fromisoformat(found_at_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="found_at: invalid date format")
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    if dt > datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="found_at: cannot be in the future")
    return dt


def _validate_category(db: Session, category_id: int) -> Category:
    cat = db.get(Category, category_id)
    if cat is None:
        raise HTTPException(status_code=400, detail="category_id: category does not exist")
    return cat


def _item_response(item: FoundItem, current_user_id: Optional[int]) -> ItemResponse:
    return ItemResponse.model_validate(serialize_item(item, current_user_id))


def _item_response_from_summary(summary: dict, current_user_id: Optional[int]) -> ItemResponse:
    """Build ItemResponse from a SearchIndex summary dict."""
    return ItemResponse.model_validate({
        **summary,
        "is_owner": current_user_id is not None and summary["owner_id"] == current_user_id,
    })


# ── IMPORTANT: /mine must be declared before /{id} ───────────────────────────

@router.get("/mine", response_model=list[ItemResponse])
def get_my_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return ALL items posted by the current user (any status), newest first."""
    items = (
        db.query(FoundItem)
        .options(selectinload(FoundItem.category))
        .filter(FoundItem.owner_id == current_user.id)
        .order_by(FoundItem.created_at.desc())
        .all()
    )
    return [_item_response(item, current_user.id) for item in items]


# ── Public list ───────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedItemsResponse)
def list_items(
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    location: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    page_size = min(page_size, 50)
    page = max(page, 1)
    current_user_id = current_user.id if current_user else None

    # ── Text search path: use SearchIndex ─────────────────────────────────────
    if q and q.strip():
        summaries = search_index.search(q.strip())

        # Apply filters in Python
        if category_id is not None:
            summaries = [s for s in summaries if s["category"]["id"] == category_id]
        if location:
            loc_lower = location.lower()
            summaries = [s for s in summaries if loc_lower in s["location"].lower()]
        if date_from:
            try:
                dt_from = datetime.fromisoformat(date_from)
                if dt_from.tzinfo is None:
                    dt_from = dt_from.replace(tzinfo=timezone.utc)
                dt_from = dt_from.replace(hour=0, minute=0, second=0, microsecond=0)
                summaries = [s for s in summaries if s["found_at"] >= dt_from]
            except ValueError:
                pass
        if date_to:
            try:
                dt_to = datetime.fromisoformat(date_to)
                if dt_to.tzinfo is None:
                    dt_to = dt_to.replace(tzinfo=timezone.utc)
                dt_to = dt_to.replace(hour=23, minute=59, second=59, microsecond=999999)
                summaries = [s for s in summaries if s["found_at"] <= dt_to]
            except ValueError:
                pass

        # Sort with merge_sort by found_at
        reverse = sort != "oldest"
        summaries = merge_sort(summaries, key=lambda s: s["found_at"], reverse=reverse)

        total = len(summaries)
        offset = (page - 1) * page_size
        page_items = summaries[offset: offset + page_size]

        return PaginatedItemsResponse(
            items=[_item_response_from_summary(s, current_user_id) for s in page_items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # ── No text search: use DB query ──────────────────────────────────────────
    items, total = db_list_items(
        db,
        category_id=category_id,
        location=location,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return PaginatedItemsResponse(
        items=[_item_response(item, current_user_id) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    name: Annotated[str, Form()],
    location: Annotated[str, Form()],
    found_at: Annotated[str, Form()],
    category_id: Annotated[int, Form()],
    image: Annotated[UploadFile, File()],
    description: Annotated[str, Form()] = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    name = name.strip()
    if len(name) < 2 or len(name) > 80:
        raise HTTPException(status_code=400, detail="name: must be between 2 and 80 characters")

    desc = description.strip()
    if desc and len(desc) < 10:
        raise HTTPException(status_code=400, detail="description: must be at least 10 characters")

    location = location.strip()
    if len(location) < 2 or len(location) > 80:
        raise HTTPException(status_code=400, detail="location: must be between 2 and 80 characters")

    found_at_dt = _parse_found_at(found_at)
    _validate_category(db, category_id)

    image_path = save_image(image)

    item = FoundItem(
        owner_id=current_user.id,
        category_id=category_id,
        name=name,
        description=desc or None,
        location=location,
        found_at=found_at_dt,
        image_path=image_path,
        status="active",
    )
    db.add(item)
    db.commit()

    item = _load_item(db, item.id)

    # Update search index
    search_index.on_item_created(item.id, item.name, make_item_summary(item))

    # Check alerts for a match (never fails item creation)
    from app.services.matching import run_matching
    run_matching(db, item)

    return _item_response(item, current_user.id)


# ── Update ────────────────────────────────────────────────────────────────────

@router.put("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    name: Annotated[Optional[str], Form()] = None,
    location: Annotated[Optional[str], Form()] = None,
    found_at: Annotated[Optional[str], Form()] = None,
    category_id: Annotated[Optional[int], Form()] = None,
    description: Annotated[Optional[str], Form()] = None,
    image: Annotated[Optional[UploadFile], File()] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = _load_item(db, item_id)

    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own posts")

    if item.status != "active":
        raise HTTPException(status_code=400, detail="Only active items can be edited")

    old_name = item.name  # capture before mutation

    if name is not None:
        name = name.strip()
        if len(name) < 2 or len(name) > 80:
            raise HTTPException(status_code=400, detail="name: must be between 2 and 80 characters")
        item.name = name

    if description is not None:
        desc = description.strip()
        if desc and len(desc) < 10:
            raise HTTPException(status_code=400, detail="description: must be at least 10 characters")
        item.description = desc or None

    if location is not None:
        location = location.strip()
        if len(location) < 2 or len(location) > 80:
            raise HTTPException(status_code=400, detail="location: must be between 2 and 80 characters")
        item.location = location

    if found_at is not None:
        item.found_at = _parse_found_at(found_at)

    if category_id is not None:
        _validate_category(db, category_id)
        item.category_id = category_id

    if image is not None and image.filename:
        item.image_path = save_image(image)

    db.commit()
    item = _load_item(db, item_id)

    # Update search index
    search_index.on_item_updated(old_name, item.id, item.name, make_item_summary(item))

    return _item_response(item, current_user.id)


# ── Get single item ───────────────────────────────────────────────────────────

@router.get("/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    item = _load_item(db, item_id)
    current_user_id = current_user.id if current_user else None

    # Active items are public; returned/removed are only visible to their owner
    if item.status != "active":
        if current_user is None or item.owner_id != current_user.id:
            raise HTTPException(status_code=404, detail="Item not found")

    return _item_response(item, current_user_id)


# ── Mark returned ─────────────────────────────────────────────────────────────

@router.patch("/{item_id}/return", response_model=ItemResponse)
def return_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = _load_item(db, item_id)

    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own posts")

    if item.status != "active":
        raise HTTPException(status_code=400, detail="Only active items can be marked as returned")

    item_name = item.name  # capture before status change
    item.status = "returned"
    db.commit()

    # Remove from search index
    search_index.on_item_deactivated(item_id, item_name)

    item = _load_item(db, item_id)
    return _item_response(item, current_user.id)
