"""
WebSocket connection manager.

In-memory only: single-process assumption.  A Redis-backed broadcast bus
would be needed for horizontal scaling, but that is out of scope here.
"""
import logging
from collections import defaultdict
from typing import DefaultDict, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # user_id → set of open WebSocket connections (one per browser tab)
        self._connections: DefaultDict[int, Set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        await websocket.accept()
        self._connections[user_id].add(websocket)
        logger.debug("WS connect  user=%s  total_sockets=%s", user_id, len(self._connections[user_id]))

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        self._connections[user_id].discard(websocket)
        if not self._connections[user_id]:
            del self._connections[user_id]
        logger.debug("WS disconnect user=%s", user_id)

    async def send_to_user(self, user_id: int, event: dict) -> None:
        """Send JSON event to all sockets for user_id.  Dead sockets are removed."""
        sockets = list(self._connections.get(user_id, set()))
        dead: Set[WebSocket] = set()
        for ws in sockets:
            try:
                await ws.send_json(event)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections[user_id].discard(ws)
        if user_id in self._connections and not self._connections[user_id]:
            del self._connections[user_id]


manager = ConnectionManager()
