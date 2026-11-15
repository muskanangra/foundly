from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.models.item import FoundItem
from app.schemas.category import CategoryResponse

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """
    Return all categories ordered by their seeded insertion order (by id),
    each with active_count = number of ACTIVE items in that category.
    """
    rows = (
        db.execute(
            select(
                Category,
                func.count(FoundItem.id).filter(FoundItem.status == "active").label("active_count"),
            )
            .outerjoin(FoundItem, FoundItem.category_id == Category.id)
            .group_by(Category.id)
            .order_by(Category.id)
        )
        .all()
    )

    result = []
    for category, active_count in rows:
        result.append(
            CategoryResponse(
                id=category.id,
                name=category.name,
                slug=category.slug,
                active_count=active_count,
            )
        )
    return result
