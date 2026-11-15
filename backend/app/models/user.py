from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.item import FoundItem
    from app.models.conversation import Conversation
    from app.models.notification import Notification
    from app.models.report import Report
    from app.models.match_alert import MatchAlert


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="user",
        server_default="user",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin')", name="users_role_check"),
    )

    items: Mapped[list["FoundItem"]] = relationship(back_populates="owner")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")
    reports: Mapped[list["Report"]] = relationship(
        back_populates="reporter",
        foreign_keys="Report.reporter_id",
    )
    alerts: Mapped[list["MatchAlert"]] = relationship(back_populates="user")
