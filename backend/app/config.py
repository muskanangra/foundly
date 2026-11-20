import sys
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_EXPIRE_MINUTES: int = 10080
    FRONTEND_ORIGINS: str = "http://localhost:5173"
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    UPLOAD_DIR: str = "uploads"
    STORAGE_BACKEND: Literal["local", "cloudinary"] = "local"
    CLOUDINARY_URL: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def _check_required(self) -> "Settings":
        missing = []
        if not self.DATABASE_URL:
            missing.append("DATABASE_URL")
        if not self.JWT_SECRET:
            missing.append("JWT_SECRET")
        if self.STORAGE_BACKEND == "cloudinary" and not self.CLOUDINARY_URL:
            missing.append("CLOUDINARY_URL (required when STORAGE_BACKEND=cloudinary)")
        if missing:
            print(
                f"FATAL: Missing required environment variable(s): {', '.join(missing)}",
                file=sys.stderr,
            )
            sys.exit(1)
        return self

    @property
    def db_url(self) -> str:
        """Convert plain postgresql:// to postgresql+psycopg:// for SQLAlchemy."""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        elif url.startswith("postgres://"):
            # Neon sometimes gives postgres:// shorthand
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        return url

    @property
    def allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.FRONTEND_ORIGINS.split(",")]


settings = Settings()
