from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.common import PublicUserResponse, ItemSummaryResponse


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    text: Optional[str]
    image_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: int
    item: ItemSummaryResponse
    other_user: PublicUserResponse
    status: str
    last_message: Optional[MessageResponse]
    unread_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ContactFinderResponse(BaseModel):
    conversation: ConversationResponse
    finder: PublicUserResponse


class CreateConversationRequest(BaseModel):
    item_id: int
