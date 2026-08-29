from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def write_audit_log(
    db: Session,
    *,
    user_id: int | None,
    business_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None,
    description: str | None = None,
    source_ip: str | None = None,
) -> None:
    """Add an audit_log row to the CURRENT transaction (does not commit) —
    call this before db.commit() so the log lands atomically with the
    action it describes."""
    db.add(
        AuditLog(
            business_id=business_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            source_ip=source_ip,
        )
    )
