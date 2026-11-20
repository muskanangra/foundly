"""Reports router — POST /reports."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item import FoundItem
from app.models.report import Report
from app.models.user import User
from app.schemas.report import CreateReportRequest, ReportResponse
from app.schemas.common import ItemSummaryResponse, PublicUserResponse
from app.core.security import get_current_user
from app.services.items import image_url

router = APIRouter(prefix="/reports", tags=["reports"])


def _serialize_report(report: Report, item: FoundItem, reporter: User) -> ReportResponse:
    return ReportResponse(
        id=report.id,
        item=ItemSummaryResponse(
            id=item.id,
            name=item.name,
            image_url=image_url(item.image_path),
        ),
        reporter=PublicUserResponse(id=reporter.id, name=reporter.name),
        reason=report.reason,
        note=report.note,
        status=report.status,
        created_at=report.created_at,
    )


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    body: CreateReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a content report for an active item.
    Rules:
      - Item must exist and be active (404 otherwise)
      - Owner cannot report their own item (400)
      - Only one OPEN report per user per item (409)
    """
    item = (
        db.query(FoundItem)
        .filter(FoundItem.id == body.item_id, FoundItem.status == "active")
        .first()
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot report your own item")

    existing = (
        db.query(Report)
        .filter(
            Report.item_id == body.item_id,
            Report.reporter_id == current_user.id,
            Report.status == "open",
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="You already reported this item")

    report = Report(
        item_id=body.item_id,
        reporter_id=current_user.id,
        reason=body.reason,
        note=body.note,
        status="open",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return _serialize_report(report, item, current_user)
