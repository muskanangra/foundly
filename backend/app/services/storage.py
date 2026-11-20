"""
Image storage service.

Supports two backends, controlled by STORAGE_BACKEND:
  - "local": saves WebP files to UPLOAD_DIR on disk.
  - "cloudinary": uploads processed WebP to Cloudinary, returns the secure https URL.

This is the ONLY place that handles file I/O for uploaded images.
"""

import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_DIMENSION = 1600               # px on the longest side
WEBP_QUALITY = 82


def _process_image(raw: bytes) -> bytes:
    """Validate, resize and re-encode image bytes to WebP. Raises HTTPException on failure."""
    if len(raw) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB.")

    try:
        probe = Image.open(io.BytesIO(raw))
        probe.verify()
    except (UnidentifiedImageError, Exception):
        raise HTTPException(
            status_code=400,
            detail="File is not a valid image. Upload a JPEG, PNG, or WebP.",
        )

    img = Image.open(io.BytesIO(raw))
    fmt = img.format

    if fmt not in {"JPEG", "PNG", "WEBP"}:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are accepted.",
        )

    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    w, h = img.size
    if max(w, h) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(w, h)
        img = img.resize((max(1, int(w * ratio)), max(1, int(h * ratio))), Image.LANCZOS)

    buf = io.BytesIO()
    save_kwargs: dict = {"format": "WEBP", "quality": WEBP_QUALITY, "method": 4}
    if img.mode == "RGBA":
        save_kwargs["lossless"] = False
    img.save(buf, **save_kwargs)
    buf.seek(0)
    return buf.read()


def save_image(upload: UploadFile) -> str:
    """
    Validate, resize, and save an uploaded image.

    Returns:
      - local backend: UUID-based filename (e.g. "abc123.webp")
      - cloudinary backend: full https:// Cloudinary URL

    Raises HTTPException 400 on validation failure.
    """
    raw = upload.file.read()
    webp_bytes = _process_image(raw)

    if settings.STORAGE_BACKEND == "cloudinary":
        return _upload_to_cloudinary(webp_bytes)

    # Local backend
    filename = f"{uuid.uuid4().hex}.webp"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(webp_bytes)
    return filename


def _upload_to_cloudinary(webp_bytes: bytes) -> str:
    """Upload processed WebP bytes to Cloudinary and return the secure URL."""
    import cloudinary
    import cloudinary.uploader

    cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)

    public_id = uuid.uuid4().hex
    result = cloudinary.uploader.upload(
        webp_bytes,
        public_id=public_id,
        folder="foundly",
        resource_type="image",
        format="webp",
    )
    return result["secure_url"]
