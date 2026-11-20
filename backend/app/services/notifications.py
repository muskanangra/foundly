"""
Notification service: persist to DB and push over WebSocket.
"""
import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def _serialize(notif) -> dict:
    return {
        "id": notif.id,
        "type": notif.type,
        "title": notif.title,
        "body": notif.body,
        "link": notif.link,
        "is_read": notif.is_read,
        "created_at": notif.created_at.isoformat(),
    }


def create_notification(
    db: "Session",
    user_id: int,
    type_: str,
    title: str,
    body: str,
    link: str,
    *,
    conversation_id: int | None = None,
) -> dict:
    """
    Save a notification and push it over WebSocket.

    For type_='message': if an unread message notification already exists for
    the same conversation, update it instead of creating a duplicate.
    """
    from app.models.notification import Notification

    notif = None

    if type_ == "message" and conversation_id is not None:
        notif = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.type == "message",
                Notification.is_read == False,  # noqa: E712
                Notification.link == f"/chats/{conversation_id}",
            )
            .first()
        )
        if notif is not None:
            notif.title = title
            notif.body = body
            notif.created_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(notif)

    if notif is None:
        notif = Notification(
            user_id=user_id,
            type=type_,
            title=title,
            body=body,
            link=link,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

    notif_dict = _serialize(notif)
    _push(user_id, {"type": "notification", "data": notif_dict})
    return notif_dict


def _push(user_id: int, event: dict) -> None:
    """Send event to user's WebSocket connections, called from a sync route handler."""
    try:
        import anyio.from_thread
        from app.realtime.manager import manager
        anyio.from_thread.run(manager.send_to_user, user_id, event)
    except Exception as exc:
        logger.warning("WS push to user %s failed: %s", user_id, exc)
