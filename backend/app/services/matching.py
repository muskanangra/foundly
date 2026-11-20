"""
Alert matching service.

After an item is created, check every MatchAlert for a match.
Uses a small per-call Trie (our app/dsa/trie.py) for the keyword point.
Never raises — errors are caught and logged so item creation never fails.
"""
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session
    from app.models.item import FoundItem

logger = logging.getLogger(__name__)


def _score(item, alert) -> int:
    """
    Score an alert against a newly posted item.  Max 3 points; threshold = 2.

    keyword (1pt) – build a small Trie from item.name; every word in the alert
                     keyword must prefix-match a word in that Trie.
    category (1pt) – alert.category_id matches item.category_id.
    location (1pt) – alert.location appears in item.location (case-insensitive).
    """
    from app.dsa.trie import Trie, normalize

    score = 0

    # Keyword point
    kw_words = normalize(alert.keyword).split()
    if kw_words:
        t = Trie()
        t.insert(item.name, item.id)
        if all(t.search_prefix(word) for word in kw_words):
            score += 1

    # Category point
    if alert.category_id is not None and alert.category_id == item.category_id:
        score += 1

    # Location point
    if alert.location and alert.location.strip():
        if alert.location.strip().lower() in item.location.lower():
            score += 1

    return score


def run_matching(db: "Session", item) -> None:
    """
    Check every alert against the new item and notify matching alert owners.
    Called after item creation.  Must never raise.
    """
    try:
        from app.models.match_alert import MatchAlert
        from app.services.notifications import create_notification

        alerts = db.query(MatchAlert).all()
        notified: set[int] = set()

        for alert in alerts:
            if alert.user_id == item.owner_id:
                continue
            if alert.user_id in notified:
                continue
            if _score(item, alert) >= 2:
                create_notification(
                    db,
                    user_id=alert.user_id,
                    type_="match",
                    title="Potential match found!",
                    body=f"{item.name} was found at {item.location}",
                    link=f"/items/{item.id}",
                )
                notified.add(alert.user_id)

    except Exception as exc:
        logger.error("Matching failed for item %s: %s", getattr(item, "id", "?"), exc)
