from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.routers import auth, categories, items, stats, search

app = FastAPI(
    title="Foundly API",
    description="Lost-and-found backend for JUIT",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization"],
)

# ── Static files (uploaded images) ───────────────────────────────────────────
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(items.router)
app.include_router(stats.router)
app.include_router(search.router)


# ── Error handlers ────────────────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Flatten Pydantic/FastAPI validation errors into a single readable string.
    e.g. "description: must be at least 10 characters"
    """
    errors = exc.errors()
    if not errors:
        return JSONResponse(
            status_code=422,
            content={"detail": "Validation error"},
        )

    parts = []
    for err in errors:
        loc = " → ".join(str(l) for l in err["loc"] if l not in ("body", "query", "path"))
        msg = err["msg"].replace("Value error, ", "")
        parts.append(f"{loc}: {msg}" if loc else msg)

    detail = "; ".join(parts)
    return JSONResponse(status_code=422, content={"detail": detail})
