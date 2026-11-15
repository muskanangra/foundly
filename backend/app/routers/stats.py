from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item import FoundItem
from app.models.user import User
from app.schemas.stats import StatsResponse

router = APIRouter(tags=["public"])


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    active = db.execute(
        select(func.count(FoundItem.id)).where(FoundItem.status == "active")
    ).scalar_one()

    returned = db.execute(
        select(func.count(FoundItem.id)).where(FoundItem.status == "returned")
    ).scalar_one()

    users = db.execute(select(func.count(User.id))).scalar_one()

    return StatsResponse(active_items=active, returned_items=returned, users=users)


@router.get("/health")
def health():
    return {"status": "ok"}
