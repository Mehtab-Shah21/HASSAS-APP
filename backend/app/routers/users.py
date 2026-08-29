from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.audit import write_audit_log

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return db.query(User).order_by(User.id).all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        display_name=payload.display_name or f"{payload.first_name} {payload.last_name or ''}".strip(),
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        avatar_color=payload.avatar_color,
        phone_code=payload.phone_code,
        phone=payload.phone,
    )
    db.add(user)
    db.flush()
    write_audit_log(
        db, user_id=current_user.id, business_id=None, action="create",
        entity_type="user", entity_id=user.id, description=f"Created user {user.email} ({user.role.value})",
    )
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    write_audit_log(
        db, user_id=current_user.id, business_id=None, action="update",
        entity_type="user", entity_id=user.id, description=f"Updated user {user.email}",
    )
    db.commit()
    db.refresh(user)
    return user
