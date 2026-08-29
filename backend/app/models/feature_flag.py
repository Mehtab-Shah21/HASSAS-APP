from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.mixins import TimestampMixin


class FeatureFlag(TimestampMixin, Base):
    __tablename__ = "feature_flags"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
