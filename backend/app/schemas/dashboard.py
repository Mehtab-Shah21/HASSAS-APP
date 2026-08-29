from pydantic import BaseModel


class RecentInvoice(BaseModel):
    id: int
    number: str
    customer_name: str
    invoice_date: str
    status: str
    grand_total: float


class TopCustomer(BaseModel):
    customer_id: int
    customer_name: str
    total_amount: float
    invoice_count: int


class DashboardSummary(BaseModel):
    period: str
    total_sales: float
    invoice_count: int
    govt_fees_paid_to_date: float
    vat_collected: float
    recent_invoices: list[RecentInvoice]
    top_customers: list[TopCustomer]
    attendance_present_today: int | None
    attendance_absent_today: int | None
