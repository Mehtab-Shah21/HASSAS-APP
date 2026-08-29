import enum
from datetime import date

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.mixins import TimestampMixin


class DiscountType(str, enum.Enum):
    percent = "percent"
    fixed = "fixed"


class Coupon(TimestampMixin, Base):
    __tablename__ = "coupons"

    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    discount_type: Mapped[DiscountType] = mapped_column(Enum(DiscountType), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    valid_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    valid_to: Mapped[date | None] = mapped_column(Date, nullable=True)
