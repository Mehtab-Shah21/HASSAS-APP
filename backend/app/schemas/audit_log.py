from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    created_at: datetime
    business_id: int | None
    user_id: int | None
    user_name: str | None
    action: str
    entity_type: str
    entity_id: int | None
    description: str | None
    source_ip: str | None

    model_config = {"from_attributes": True}


class PaginatedAuditLog(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    page_size: int
