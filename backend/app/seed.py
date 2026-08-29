"""Seed initial data: Main + IIM businesses, one admin user, default feature flags.

Run with: python -m app.seed
Safe to re-run — skips anything that already exists.
"""

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.business import Business
from app.models.feature_flag import FeatureFlag
from app.models.user import User, UserRole

DEFAULT_FLAGS = [
    ("coupons", "Coupons"),
    ("notifications", "Notifications"),
    ("attendance", "Attendance"),
    ("iim", "IIM Business"),
    ("design_studio", "Design Studio"),
]


def seed() -> None:
    db = SessionLocal()
    try:
        if not db.query(Business).filter(Business.name == "Main").first():
            db.add(Business(name="Main", invoice_prefix="INV-", quotation_prefix="QTN-"))
        if not db.query(Business).filter(Business.name == "IIM").first():
            db.add(Business(name="IIM", invoice_prefix="IIM-INV-", quotation_prefix="IIM-QTN-"))
        db.commit()

        for key, label in DEFAULT_FLAGS:
            if not db.query(FeatureFlag).filter(FeatureFlag.key == key).first():
                db.add(FeatureFlag(key=key, enabled=True, label=label))
        db.commit()

        admin_email = "admin@example.com"
        if not db.query(User).filter(User.email == admin_email).first():
            db.add(
                User(
                    first_name="Admin",
                    last_name="User",
                    display_name="Admin",
                    email=admin_email,
                    password_hash=hash_password("admin123"),
                    role=UserRole.admin,
                    avatar_color="#4F46E5",
                )
            )
        db.commit()
        print("Seed complete.")
        print(f"  Admin login: {admin_email} / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
