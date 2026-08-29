import os
import sys
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def is_frozen() -> bool:
    """True when running as a PyInstaller-packaged executable."""
    return bool(getattr(sys, "frozen", False))


def resource_dir() -> Path:
    """Backend root — where read-only bundled resources live (app/templates,
    alembic/, alembic.ini). Inside a PyInstaller bundle this is the
    extracted _MEIPASS temp dir (packaging/pro_invoicing.spec's `datas`
    mirrors this same app/... and alembic/... layout there); in dev it's
    just the backend/ project folder, same as always."""
    if is_frozen():
        return Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
    return Path(__file__).resolve().parent.parent.parent


def _default_data_dir() -> Path:
    """Writable, persistent data (DB, uploads, backups). A packaged Windows
    service shouldn't write next to itself (may be in Program Files, which
    needs elevation, and PyInstaller's --onefile temp dir is ephemeral
    anyway) — ProgramData is the standard writable-by-service location. In
    dev, keep using the existing backend/ project folder so nothing changes
    for local development."""
    if is_frozen():
        base = Path(os.environ.get("PROGRAMDATA", "C:/ProgramData")) / "ProInvoicing"
    else:
        base = Path(__file__).resolve().parent.parent.parent
    base.mkdir(parents=True, exist_ok=True)
    return base


def _default_database_url() -> str:
    db_path = _default_data_dir() / "pro_invoicing.db"
    return f"sqlite:///{db_path.as_posix()}"


def _default_upload_dir() -> str:
    upload_path = _default_data_dir() / "uploads"
    upload_path.mkdir(parents=True, exist_ok=True)
    return str(upload_path)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "PRO Invoicing"
    database_url: str = Field(default_factory=_default_database_url)
    upload_dir: str = Field(default_factory=_default_upload_dir)
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12
    auto_lock_minutes: int = 15
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    cors_origin_regex: str = r"^http://(localhost|127\.0\.0\.1):\d+$"
    # Admin install binds 0.0.0.0 so LAN employee PCs can reach it; dev
    # defaults to localhost-only. Overridable via env for the packaged service.
    host: str = "127.0.0.1"
    port: int = 8000


settings = Settings()
