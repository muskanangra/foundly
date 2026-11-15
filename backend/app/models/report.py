from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Text, DateTime, ForeignKey, func, String, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.item import FoundItem
    from app.models.user import User


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(
        ForeignKey("found_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reporter_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reason: Mapped[str] = mapped_column(String(20), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="open",
        server_default="open",
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (
        CheckConstraint(
            "reason IN ('fake', 'inappropriate', 'duplicate', 'spam', 'other')",
            name="reports_reason_check",
        ),
        CheckConstraint(
            "status IN ('open', 'dismissed', 'actioned')",
            name="reports_status_check",
        ),
    )

    item: Mapped["FoundItem"] = relationship(back_populates="reports")
    reporter: Mapped["User"] = relationship(
        back_populates="reports",
        foreign_keys=[reporter_id],
    )
