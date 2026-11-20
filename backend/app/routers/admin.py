"""Admin router — /admin/* endpoints (admin role required for all)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item import FoundItem
from app.models.report import Report
from app.models.user import User
from app.schemas.stats import AdminStatsResponse
from app.schemas.report import ReportResponse, AdminReportActionRequest
from app.schemas.common import ItemSummaryResponse, PublicUserResponse
from app.core.security import require_admin
from app.dsa.search_index import search_index
from app.services.items import image_url

router = APIRouter(prefix="/admin", tags=["admin"])


def _serialize_report(report: Report) -> ReportResponse:
    item = report.item
    reporter = report.reporter
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


@router.get("/stats", response_model=AdminStatsResponse)
def admin_stats(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Return aggregate counts for the admin dashboard."""
    users = db.execute(select(func.count(User.id))).scalar_one()
    active = db.execute(
        select(func.count(FoundItem.id)).where(FoundItem.status == "active")
    ).scalar_one()
    returned = db.execute(
        select(func.count(FoundItem.id)).where(FoundItem.status == "returned")
    ).scalar_one()
    open_reports = db.execute(
        select(func.count(Report.id)).where(Report.status == "open")
    ).scalar_one()
    return AdminStatsResponse(
        users=users,
        active_items=active,
        returned_items=returned,
        open_reports=open_reports,
    )


@router.get("/reports", response_model=list[ReportResponse])
def list_reports(
    status: str = "open",
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """List reports filtered by status (open/dismissed/actioned), newest first."""
    valid = {"open", "dismissed", "actioned"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"status must be one of: {', '.join(sorted(valid))}")

    from sqlalchemy.orm import selectinload

    reports = (
        db.query(Report)
        .options(selectinload(Report.item), selectinload(Report.reporter))
        .filter(Report.status == status)
        .order_by(Report.created_at.desc())
        .all()
    )
    return [_serialize_report(r) for r in reports]


@router.patch("/reports/{report_id}", response_model=ReportResponse)
def action_report(
    report_id: int,
    body: AdminReportActionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """
    Act on a report:
      "dismiss"     → marks the report as dismissed
      "remove_item" → sets item status to 'removed', calls search index hook,
                      and marks this + all other open reports on the item as actioned
    """
    from sqlalchemy.orm import selectinload

    report = (
        db.query(Report)
        .options(selectinload(Report.item), selectinload(Report.reporter))
        .filter(Report.id == report_id)
        .first()
    )
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    if body.action == "dismiss":
        report.status = "dismissed"
        db.commit()
        # Reload with relationships (db.refresh would expire them)
        report = (
            db.query(Report)
            .options(selectinload(Report.item), selectinload(Report.reporter))
            .filter(Report.id == report_id)
            .first()
        )

    elif body.action == "remove_item":
        item = report.item
        if item.status == "active":
            item_name = item.name
            item_id = item.id
            item.status = "removed"

            # Mark this report and ALL other open reports on the same item as actioned
            open_reports = (
                db.query(Report)
                .filter(Report.item_id == item_id, Report.status == "open")
                .all()
            )
            for r in open_reports:
                r.status = "actioned"

            db.commit()

            # Remove from search index AFTER commit
            search_index.on_item_deactivated(item_id, item_name)
        else:
            # Item already inactive; just action this report
            report.status = "actioned"
            db.commit()

        # Reload for serialization
        report = (
            db.query(Report)
            .options(selectinload(Report.item), selectinload(Report.reporter))
            .filter(Report.id == report_id)
            .first()
        )

    return _serialize_report(report)
