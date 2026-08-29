from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.mixins import TimestampMixin


class BackupSettings(TimestampMixin, Base):
    """A single global row (per-install, like feature_flags) holding where
    backups get written. Not business-scoped — one admin PC, one DB, one
    backup folder."""

    __tablename__ = "backup_settings"

    backup_folder: Mapped[str | None] = mapped_column(String(500), nullable=True)
