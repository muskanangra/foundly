from contextlib import asynccontextmanager
from pathlib import Path
import time

from fastapi import FastAPI, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import SessionLocal
from app.routers import auth, categories, items, stats, search
from app.routers import conversations, reports, admin
from app.routers import notifications, alerts


# ── Lifespan ──────────────────────────────────────────────────────────────────

import asyncio
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.dsa.search_index import search_index

    async def _build():
        db = SessionLocal()
        try:
            await asyncio.to_thread(search_index.build_from_db, db)
        except Exception as exc:
            logger.error(
                "SearchIndex build_from_db failed — search/autocomplete will "
                "return empty results until restart.  Error: %s",
                exc,
            )
        finally:
            db.close()

    asyncio.create_task(_build())
    yield


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Foundly API",
    description="Lost-and-found backend for JUIT",
    version="3.0.0",
    lifespan=lifespan,
)

# ── Timing middleware ──────────────────────────────────────────────────────────

@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    if request.url.path.startswith("/ws"):
        return await call_next(request)
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s %s %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization"],
)

# ── Static files (local backend only) ────────────────────────────────────────
if settings.STORAGE_BACKEND == "local":
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(items.router)
app.include_router(stats.router)
app.include_router(search.router)
app.include_router(conversations.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(notifications.router)
app.include_router(alerts.router)


# ── WebSocket ─────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    Real-time WebSocket.  Validates the JWT before accepting.
    Closes with code 4401 if invalid.
    Client may send { "type": "ping" } → server replies { "type": "pong" }.
    Server pushes { "type": "message", "data": Message }
                 { "type": "notification", "data": Notification }
    """
    from app.core.security import _decode_token
    from app.realtime.manager import manager

    user_id = _decode_token(token)
    if user_id is None:
        await websocket.close(code=4401)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            try:
                data = await websocket.receive_json()
                if isinstance(data, dict) and data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except WebSocketDisconnect:
                break
            except Exception:
                break
    finally:
        manager.disconnect(websocket, user_id)


# ── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


# ── Error handlers ────────────────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    if not errors:
        return JSONResponse(status_code=422, content={"detail": "Validation error"})

    parts = []
    for err in errors:
        loc = " → ".join(str(l) for l in err["loc"] if l not in ("body", "query", "path"))
        msg = err["msg"].replace("Value error, ", "")
        parts.append(f"{loc}: {msg}" if loc else msg)

    return JSONResponse(status_code=422, content={"detail": "; ".join(parts)})
