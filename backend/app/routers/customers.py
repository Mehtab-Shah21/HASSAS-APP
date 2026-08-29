from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, require_active_business_id
from app.models.customer import Customer, CustomerType
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
    PaginatedCustomers,
)
from app.services.audit import write_audit_log

router = APIRouter(prefix="/api/customers", tags=["customers"])


def _validate_parent(db: Session, business_id: int, parent_id: int | None, self_id: int | None = None):
    if parent_id is None:
        return
    if parent_id == self_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A customer cannot be its own parent")
    parent = db.get(Customer, parent_id)
    if not parent or parent.business_id != business_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent customer not found")
    if parent.type != CustomerType.company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Parent customer must be a company"
        )
    if parent.parent_customer_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Employees cannot themselves have employees"
        )


@router.get("", response_model=PaginatedCustomers)
def list_customers(
    business_id: int = Depends(require_active_business_id),
    search: str | None = Query(default=None),
    type: CustomerType | None = Query(default=None),
    parent_customer_id: int | None = Query(default=None),
    include_employees: bool = Query(default=True, description="If false, only top-level customers are returned"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Customer).filter(Customer.business_id == business_id)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Customer.name.ilike(like), Customer.phone.ilike(like), Customer.id_value.ilike(like)))
    if type:
        q = q.filter(Customer.type == type)
    if parent_customer_id is not None:
        q = q.filter(Customer.parent_customer_id == parent_customer_id)
    elif not include_employees:
        q = q.filter(Customer.parent_customer_id.is_(None))

    total = q.count()
    items = (
        q.order_by(Customer.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return PaginatedCustomers(items=items, total=total, page=page, page_size=page_size)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    business_id: int = Depends(require_active_business_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    customer = db.get(Customer, customer_id)
    if not customer or customer.business_id != business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.get("/{customer_id}/employees", response_model=list[CustomerResponse])
def list_employees(
    customer_id: int,
    business_id: int = Depends(require_active_business_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = db.get(Customer, customer_id)
    if not parent or parent.business_id != business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return (
        db.query(Customer)
        .filter(Customer.parent_customer_id == customer_id, Customer.business_id == business_id)
        .order_by(Customer.name)
        .all()
    )


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    business_id: int = Depends(require_active_business_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_parent(db, business_id, payload.parent_customer_id)
    customer = Customer(business_id=business_id, **payload.model_dump())
    db.add(customer)
    db.flush()
    write_audit_log(
        db, user_id=current_user.id, business_id=business_id, action="create",
        entity_type="customer", entity_id=customer.id, description=f"Created customer {customer.name}",
    )
    db.commit()
    db.refresh(customer)
    return customer


@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    business_id: int = Depends(require_active_business_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    customer = db.get(Customer, customer_id)
    if not customer or customer.business_id != business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    data = payload.model_dump(exclude_unset=True)
    if "parent_customer_id" in data:
        _validate_parent(db, business_id, data["parent_customer_id"], self_id=customer_id)
    for field, value in data.items():
        setattr(customer, field, value)
    write_audit_log(
        db, user_id=current_user.id, business_id=business_id, action="update",
        entity_type="customer", entity_id=customer.id, description=f"Updated customer {customer.name}",
    )
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_customer(
    customer_id: int,
    business_id: int = Depends(require_active_business_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    customer = db.get(Customer, customer_id)
    if not customer or customer.business_id != business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    customer.is_active = False
    write_audit_log(
        db, user_id=current_user.id, business_id=business_id, action="delete",
        entity_type="customer", entity_id=customer.id, description=f"Deactivated customer {customer.name}",
    )
    db.commit()
