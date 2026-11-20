from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.schemas.common import PublicUserResponse, ItemSummaryResponse

_VALID_REASONS = {"fake", "inappropriate", "duplicate", "spam", "other"}


class CreateReportRequest(BaseModel):
    item_id: int
    reason: str
    note: Optional[str] = None

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        if v not in _VALID_REASONS:
            raise ValueError(f"must be one of: {', '.join(sorted(_VALID_REASONS))}")
        return v

    @field_validator("note")
    @classmethod
    def validate_note(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError("must be at most 500 characters")
            return v or None
        return None


class ReportResponse(BaseModel):
    id: int
    item: ItemSummaryResponse
    reporter: PublicUserResponse
    reason: str
    note: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminReportActionRequest(BaseModel):
    action: str

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        if v not in {"dismiss", "remove_item"}:
            raise ValueError("must be 'dismiss' or 'remove_item'")
        return v
