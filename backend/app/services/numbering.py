from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models.business import Business


def reserve_invoice_number(db: Session, business: Business) -> str:
    """Atomically claim the next invoice number for this business.

    Uses a single UPDATE ... RETURNING statement so the read-increment is one
    atomic DB operation — safe under concurrent LAN writers. Caller must
    commit this in the SAME transaction as the invoice insert (don't call
    db.commit() between this and the insert) so a failed insert can't leave a
    gap-causing partial commit.
    """
    result = db.execute(
        update(Business)
        .where(Business.id == business.id)
        .values(next_invoice_no=Business.next_invoice_no + 1)
        .returning(Business.next_invoice_no, Business.invoice_prefix)
    )
    new_counter, prefix = result.one()
    claimed = new_counter - 1
    return f"{prefix}{claimed:05d}"


def reserve_quotation_number(db: Session, business: Business) -> str:
    result = db.execute(
        update(Business)
        .where(Business.id == business.id)
        .values(next_quotation_no=Business.next_quotation_no + 1)
        .returning(Business.next_quotation_no, Business.quotation_prefix)
    )
    new_counter, prefix = result.one()
    claimed = new_counter - 1
    return f"{prefix}{claimed:05d}"
