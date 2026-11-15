"""
Image storage service.

This is the ONLY place that handles file I/O for uploaded images.
Switching to Cloudinary in production means changing only this file.
"""

import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
PILLOW_FORMAT_TO_EXT = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def save_image(upload: UploadFile) -> str:
    """
    Validate and save an uploaded image file.

    Checks:
    - Real file content (via Pillow) is JPEG, PNG, or WebP — not just the extension.
    - File size ≤ 5 MB.

    Returns:
        The stored filename (UUID-based). The caller builds the full URL.

    Raises:
        HTTPException 400 on any validation failure.
    """
    raw = upload.file.read()

    if len(raw) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB.")

    # Verify real content with Pillow
    try:
        img = Image.open(io.BytesIO(raw))
        img.verify()  # raises on corrupt files
    except (UnidentifiedImageError, Exception):
        raise HTTPException(
            status_code=400,
            detail="File is not a valid image. Upload a JPEG, PNG, or WebP.",
        )

    # Re-open (verify() exhausts the stream)
    img = Image.open(io.BytesIO(raw))
    fmt = img.format  # "JPEG", "PNG", "WEBP"

    if fmt not in PILLOW_FORMAT_TO_EXT:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are accepted.",
        )

    ext = PILLOW_FORMAT_TO_EXT[fmt]
    filename = f"{uuid.uuid4().hex}.{ext}"

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = upload_dir / filename

    dest.write_bytes(raw)
    return filename
