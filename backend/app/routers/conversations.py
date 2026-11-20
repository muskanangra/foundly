"""
Conversations router.

POST /conversations is the ONLY endpoint that reveals the finder's identity.
Privacy rule: no other endpoint may ever expose the finder's name, email or id.
"""
import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.conversation import Conversation
from app.models.item import FoundItem
from app.models.message import Message
from app.models.user import User
from app.schemas.conversation import (
    ContactFinderResponse,
    ConversationResponse,
    CreateConversationRequest,
    MessageResponse,
)
from app.schemas.common import ItemSummaryResponse, PublicUserResponse
from app.core.security import get_current_user
from app.dsa.search_index import search_index
from app.services.items import image_url
from app.services.storage import save_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/conversations", tags=["conversations"])


# ── Serialization helpers ─────────────────────────────────────────────────────

def _get_user_info(user_id: int, db: Session) -> dict:
    """Lookup user info from the in-memory index, DB fallback."""
    key = search_index.user_key(user_id)
    data = search_index.users_table.get(key)
    if data is None:
        user = db.get(User, user_id)
        if user is None:
            return {"id": user_id, "name": "Unknown"}
        data = {"id": user.id, "name": user.name}
        search_index.users_table.put(key, data)
    return data


def _msg_response(msg: Message) -> MessageResponse:
    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        text=msg.text,
        image_url=image_url(msg.image_path) if msg.image_path else None,
        created_at=msg.created_at,
    )


def _msg_dict(msg: Message) -> dict:
    """Serialize a message to dict for WebSocket broadcast (created_at as ISO)."""
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "text": msg.text,
        "image_url": image_url(msg.image_path) if msg.image_path else None,
        "created_at": msg.created_at.isoformat(),
    }


def _unread_count(conv: Conversation, current_user_id: int) -> int:
    if current_user_id == conv.finder_id:
        last_read = conv.finder_last_read_at
        other_id = conv.claimant_id
    else:
        last_read = conv.claimant_last_read_at
        other_id = conv.finder_id
    return sum(
        1 for m in conv.messages
        if m.sender_id == other_id and (last_read is None or m.created_at > last_read)
    )


def _build_conv_response(
    conv: Conversation,
    item: FoundItem,
    other_user_data: dict,
    current_user_id: int,
) -> ConversationResponse:
    item_summary = ItemSummaryResponse(
        id=item.id,
        name=item.name,
        image_url=image_url(item.image_path),
    )
    last_msg = _msg_response(conv.messages[-1]) if conv.messages else None
    return ConversationResponse(
        id=conv.id,
        item=item_summary,
        other_user=PublicUserResponse(**other_user_data),
        status=conv.status,
        last_message=last_msg,
        unread_count=_unread_count(conv, current_user_id),
        created_at=conv.created_at,
    )


def _load_conv(conv_id: int, current_user_id: int, db: Session) -> Conversation:
    """Load conv with messages; 404 if not found, 403 if not a participant."""
    conv = (
        db.query(Conversation)
        .options(
            selectinload(Conversation.messages),
            selectinload(Conversation.item).selectinload(FoundItem.category),
        )
        .filter(Conversation.id == conv_id)
        .first()
    )
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user_id not in (conv.finder_id, conv.claimant_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


def _broadcast_message(finder_id: int, claimant_id: int, event: dict) -> None:
    """Broadcast a message event to both participants from a sync handler."""
    import anyio.from_thread
    from app.realtime.manager import manager

    for uid in (finder_id, claimant_id):
        try:
            anyio.from_thread.run(manager.send_to_user, uid, event)
        except Exception as exc:
            logger.warning("WS message broadcast to user %s failed: %s", uid, exc)


# ── POST /conversations ───────────────────────────────────────────────────────

@router.post("", response_model=ContactFinderResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    body: CreateConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create or return the existing conversation for an item.
    The ONLY endpoint that reveals the finder's public identity.
    """
    item = (
        db.query(FoundItem)
        .options(selectinload(FoundItem.category))
        .filter(FoundItem.id == body.item_id, FoundItem.status == "active")
        .first()
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="This is your own post")

    existing = (
        db.query(Conversation)
        .options(
            selectinload(Conversation.messages),
            selectinload(Conversation.item).selectinload(FoundItem.category),
        )
        .filter(
            Conversation.item_id == body.item_id,
            Conversation.claimant_id == current_user.id,
        )
        .first()
    )

    if existing is not None:
        conv = existing
    else:
        conv = Conversation(
            item_id=body.item_id,
            finder_id=item.owner_id,
            claimant_id=current_user.id,
            status="open",
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conv = (
            db.query(Conversation)
            .options(
                selectinload(Conversation.messages),
                selectinload(Conversation.item).selectinload(FoundItem.category),
            )
            .filter(Conversation.id == conv.id)
            .first()
        )

    finder_data = _get_user_info(item.owner_id, db)
    conversation_response = _build_conv_response(conv, item, finder_data, current_user.id)

    return ContactFinderResponse(
        conversation=conversation_response,
        finder=PublicUserResponse(**finder_data),
    )


# ── GET /conversations ────────────────────────────────────────────────────────

@router.get("", response_model=list[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all conversations the current user participates in, newest activity first."""
    from sqlalchemy import or_

    convs = (
        db.query(Conversation)
        .options(
            selectinload(Conversation.messages),
            selectinload(Conversation.item).selectinload(FoundItem.category),
        )
        .filter(
            or_(
                Conversation.finder_id == current_user.id,
                Conversation.claimant_id == current_user.id,
            )
        )
        .all()
    )

    def _activity_time(c: Conversation) -> datetime:
        if c.messages:
            return c.messages[-1].created_at
        return c.created_at

    convs.sort(key=_activity_time, reverse=True)

    result = []
    for conv in convs:
        other_id = conv.claimant_id if current_user.id == conv.finder_id else conv.finder_id
        other_data = _get_user_info(other_id, db)
        result.append(_build_conv_response(conv, conv.item, other_data, current_user.id))
    return result


# ── GET /conversations/{id} ───────────────────────────────────────────────────

@router.get("/{conv_id}", response_model=ConversationResponse)
def get_conversation(
    conv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = _load_conv(conv_id, current_user.id, db)
    other_id = conv.claimant_id if current_user.id == conv.finder_id else conv.finder_id
    other_data = _get_user_info(other_id, db)
    return _build_conv_response(conv, conv.item, other_data, current_user.id)


# ── GET /conversations/{id}/messages ─────────────────────────────────────────

@router.get("/{conv_id}/messages", response_model=list[MessageResponse])
def get_messages(
    conv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return messages oldest-first and update this user's last_read_at to now."""
    from app.models.notification import Notification

    conv = _load_conv(conv_id, current_user.id, db)

    now = datetime.now(timezone.utc)
    if current_user.id == conv.finder_id:
        conv.finder_last_read_at = now
    else:
        conv.claimant_last_read_at = now

    # Mark any message notifications for this chat as read
    link = f"/chats/{conv_id}"
    (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.link == link,
            Notification.is_read == False,  # noqa: E712
        )
        .update({"is_read": True}, synchronize_session=False)
    )

    db.commit()

    return [_msg_response(m) for m in conv.messages]


# ── POST /conversations/{id}/messages ────────────────────────────────────────

class SendMessageRequest(BaseModel):
    text: str


@router.post("/{conv_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    conv_id: int,
    body: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = _load_conv(conv_id, current_user.id, db)

    if conv.status == "resolved":
        raise HTTPException(status_code=409, detail="This conversation is resolved")

    text = body.text.strip()
    if len(text) < 1 or len(text) > 2000:
        raise HTTPException(status_code=400, detail="text: must be between 1 and 2000 characters")

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        text=text,
    )
    db.add(msg)

    now = datetime.now(timezone.utc)
    if current_user.id == conv.finder_id:
        conv.finder_last_read_at = now
    else:
        conv.claimant_last_read_at = now

    db.commit()
    db.refresh(msg)

    msg_data = _msg_dict(msg)
    event = {"type": "message", "data": msg_data}
    _broadcast_message(conv.finder_id, conv.claimant_id, event)

    recipient_id = conv.claimant_id if current_user.id == conv.finder_id else conv.finder_id
    sender_info = _get_user_info(current_user.id, db)
    preview = text[:60] + ("…" if len(text) > 60 else "")
    _notify_recipient(db, recipient_id, sender_info["name"], preview, conv.id)

    return _msg_response(msg)


# ── POST /conversations/{id}/images ──────────────────────────────────────────

@router.post("/{conv_id}/images", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_image_message(
    conv_id: int,
    image: Annotated[UploadFile, File()],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = _load_conv(conv_id, current_user.id, db)

    if conv.status == "resolved":
        raise HTTPException(status_code=409, detail="This conversation is resolved")

    image_path = save_image(image)

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        image_path=image_path,
    )
    db.add(msg)

    now = datetime.now(timezone.utc)
    if current_user.id == conv.finder_id:
        conv.finder_last_read_at = now
    else:
        conv.claimant_last_read_at = now

    db.commit()
    db.refresh(msg)

    msg_data = _msg_dict(msg)
    event = {"type": "message", "data": msg_data}
    _broadcast_message(conv.finder_id, conv.claimant_id, event)

    recipient_id = conv.claimant_id if current_user.id == conv.finder_id else conv.finder_id
    sender_info = _get_user_info(current_user.id, db)
    _notify_recipient(db, recipient_id, sender_info["name"], "Sent a photo", conv.id)

    return _msg_response(msg)


# ── PATCH /conversations/{id}/resolve ────────────────────────────────────────

@router.patch("/{conv_id}/resolve", response_model=ConversationResponse)
def resolve_conversation(
    conv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = _load_conv(conv_id, current_user.id, db)
    if conv.status != "resolved":
        conv.status = "resolved"
        db.commit()
    # Re-load to avoid expired-attribute lazy-loads after commit
    conv = _load_conv(conv_id, current_user.id, db)
    other_id = conv.claimant_id if current_user.id == conv.finder_id else conv.finder_id
    other_data = _get_user_info(other_id, db)
    return _build_conv_response(conv, conv.item, other_data, current_user.id)


# ── Notification helper ───────────────────────────────────────────────────────

def _notify_recipient(
    db: Session,
    recipient_id: int,
    sender_name: str,
    preview: str,
    conv_id: int,
) -> None:
    try:
        from app.services.notifications import create_notification
        create_notification(
            db,
            user_id=recipient_id,
            type_="message",
            title=f"New message from {sender_name}",
            body=preview,
            link=f"/chats/{conv_id}",
            conversation_id=conv_id,
        )
    except Exception as exc:
        logger.warning("Failed to create message notification: %s", exc)
