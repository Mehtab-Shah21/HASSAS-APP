from datetime import date

from pydantic import BaseModel, model_validator

from app.models.quotation import QuotationStatus
from app.schemas.invoice import InvoiceItemCreate, InvoiceItemResponse


class QuotationCreate(BaseModel):
    customer_id: int
    employee_customer_id: int | None = None
    quotation_date: date
    validity_days: int | None = None
    notes: str | None = None
    terms: str | None = None
    show_bank_details: bool = False
    coupon_code: str | None = None
    items: list[InvoiceItemCreate]

    @model_validator(mode="after")
    def check_items(self):
        if not self.items:
            raise ValueError("A quotation needs at least one line item")
        return self


class QuotationStatusUpdate(BaseModel):
    status: QuotationStatus


class QuotationResponse(BaseModel):
    id: int
    business_id: int
    number: str
    customer_id: int
    employee_customer_id: int | None
    quotation_date: date
    validity_days: int
    valid_until: date
    status: QuotationStatus
    subtotal: float
    discount_total: float
    coupon_id: int | None
    vat_total: float
    govt_fee_total: float
    grand_total: float
    notes: str | None
    terms: str | None
    show_bank_details: bool
    converted_invoice_id: int | None
    items: list[InvoiceItemResponse]

    model_config = {"from_attributes": True}


class QuotationListItem(BaseModel):
    id: int
    number: str
    customer_id: int
    quotation_date: date
    valid_until: date
    status: QuotationStatus
    grand_total: float
    converted_invoice_id: int | None

    model_config = {"from_attributes": True}


class PaginatedQuotations(BaseModel):
    items: list[QuotationListItem]
    total: int
    page: int
    page_size: int
