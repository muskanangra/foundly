"""Alerts router — GET/POST/DELETE /alerts."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.match_alert import MatchAlert
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter(prefix="/alerts", tags=["alerts"])


class CreateAlertRequest(BaseModel):
    keyword: str
    category_id: Optional[int] = None
    location: Optional[str] = None

    @field_validator("keyword")
    @classmethod
    def validate_keyword(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 60:
            raise ValueError("must be between 2 and 60 characters")
        return v

    @field_validator("location")
    @classmethod
    def clean_location(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            return v or None
        return None


def _serialize(alert: MatchAlert) -> dict:
    return {
        "id": alert.id,
        "keyword": alert.keyword,
        "category": (
            {"id": alert.category.id, "name": alert.category.name, "slug": alert.category.slug}
            if alert.category else None
        ),
        "location": alert.location,
        "created_at": alert.created_at.isoformat(),
    }


@router.get("", response_model=list[dict])
def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alerts = (
        db.query(MatchAlert)
        .options(selectinload(MatchAlert.category))
        .filter(MatchAlert.user_id == current_user.id)
        .order_by(MatchAlert.created_at.desc())
        .all()
    )
    return [_serialize(a) for a in alerts]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_alert(
    body: CreateAlertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(MatchAlert).filter(MatchAlert.user_id == current_user.id).count()
    if count >= 10:
        raise HTTPException(status_code=400, detail="You can have at most 10 alerts")

    if body.category_id is not None:
        from app.models.category import Category
        if db.get(Category, body.category_id) is None:
            raise HTTPException(status_code=400, detail="Category not found")

    alert = MatchAlert(
        user_id=current_user.id,
        keyword=body.keyword,
        category_id=body.category_id,
        location=body.location,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    alert = (
        db.query(MatchAlert)
        .options(selectinload(MatchAlert.category))
        .filter(MatchAlert.id == alert.id)
        .first()
    )
    return _serialize(alert)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = (
        db.query(MatchAlert)
        .filter(MatchAlert.id == alert_id, MatchAlert.user_id == current_user.id)
        .first()
    )
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
