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
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_DIMENSION = 1600               # px on the longest side
WEBP_QUALITY = 82


def save_image(upload: UploadFile) -> str:
    """
    Validate, resize, strip metadata and save an uploaded image as WebP.

    Checks:
    - Real file content (via Pillow) is JPEG, PNG, or WebP — not just the extension.
    - File size ≤ 5 MB.

    New uploads are resized to at most 1600 px on the longest side, stripped of
    metadata, and saved as WebP at ~82% quality.

    Returns:
        The stored filename (UUID-based .webp). The caller builds the full URL.

    Raises:
        HTTPException 400 on any validation failure.
    """
    raw = upload.file.read()

    if len(raw) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB.")

    # Verify real content with Pillow
    try:
        probe = Image.open(io.BytesIO(raw))
        probe.verify()  # raises on corrupt files
    except (UnidentifiedImageError, Exception):
        raise HTTPException(
            status_code=400,
            detail="File is not a valid image. Upload a JPEG, PNG, or WebP.",
        )

    # Re-open (verify() exhausts the stream)
    img = Image.open(io.BytesIO(raw))
    fmt = img.format  # "JPEG", "PNG", "WEBP"

    if fmt not in {"JPEG", "PNG", "WEBP"}:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are accepted.",
        )

    # Normalise colour mode for WebP output
    if img.mode in ("RGBA", "LA"):
        img = img.convert("RGBA")
    elif img.mode == "P":
        img = img.convert("RGBA")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Resize to at most MAX_DIMENSION px on the longest side (Lanczos for quality)
    w, h = img.size
    if max(w, h) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(w, h)
        img = img.resize((max(1, int(w * ratio)), max(1, int(h * ratio))), Image.LANCZOS)

    # Encode as WebP (strips all metadata by default)
    buf = io.BytesIO()
    save_kwargs: dict = {"format": "WEBP", "quality": WEBP_QUALITY, "method": 4}
    if img.mode == "RGBA":
        save_kwargs["lossless"] = False
    img.save(buf, **save_kwargs)
    buf.seek(0)

    filename = f"{uuid.uuid4().hex}.webp"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(buf.read())

    return filename
