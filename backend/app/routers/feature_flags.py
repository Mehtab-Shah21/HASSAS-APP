from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, require_admin
from app.models.feature_flag import FeatureFlag
from app.schemas.feature_flag import FeatureFlagResponse, FeatureFlagUpdate
from app.services.audit import write_audit_log

router = APIRouter(prefix="/api/feature-flags", tags=["feature-flags"])


@router.get("", response_model=list[FeatureFlagResponse])
def list_flags(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(FeatureFlag).order_by(FeatureFlag.key).all()


@router.patch("/{key}", response_model=FeatureFlagResponse)
def update_flag(
    key: str,
    payload: FeatureFlagUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    flag = db.query(FeatureFlag).filter(FeatureFlag.key == key).first()
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature flag not found")
    flag.enabled = payload.enabled
    write_audit_log(
        db, user_id=current_user.id, business_id=None, action="update",
        entity_type="feature_flag", entity_id=flag.id,
        description=f"{'Enabled' if flag.enabled else 'Disabled'} feature flag {flag.key}",
    )
    db.commit()
    db.refresh(flag)
    return flag
