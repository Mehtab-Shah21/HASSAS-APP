import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, require_active_business_id
from app.models.business import Business
from app.services.pdf import DEFAULT_TEMPLATE_CONFIG, render_sample_html

router = APIRouter(prefix="/api/design-studio", tags=["design-studio"])


@router.get("/defaults")
def get_defaults(current_user=Depends(get_current_user)):
    return DEFAULT_TEMPLATE_CONFIG


@router.get("/preview", response_class=HTMLResponse)
def preview(
    config: str | None = Query(default=None, description="URL-encoded JSON config override for an unsaved draft"),
    business_id: int = Depends(require_active_business_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    business = db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    override = None
    if config:
        try:
            override = json.loads(config)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid config JSON") from exc
    return HTMLResponse(render_sample_html(business, config_override=override))
