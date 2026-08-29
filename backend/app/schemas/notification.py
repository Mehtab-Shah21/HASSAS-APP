from datetime import date, datetime

from pydantic import BaseModel

from app.models.notification import ReminderUnit


class NotificationTypeCreate(BaseModel):
    name: str
    is_active: bool = True


class NotificationTypeResponse(BaseModel):
    id: int
    business_id: int
    name: str
    is_active: bool

    model_config = {"from_attributes": True}


class ReminderCreate(BaseModel):
    offset_value: int
    offset_unit: ReminderUnit


class ReminderResponse(BaseModel):
    id: int
    offset_value: int
    offset_unit: ReminderUnit

    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    customer_id: int
    type_id: int
    note: str | None = None
    target_date: date
    reminders: list[ReminderCreate] = []


class NotificationUpdate(BaseModel):
    type_id: int | None = None
    note: str | None = None
    target_date: date | None = None


class SnoozeRequest(BaseModel):
    days: int = 3


class NotificationResponse(BaseModel):
    id: int
    business_id: int
    customer_id: int
    type_id: int
    note: str | None
    target_date: date
    acknowledged_at: datetime | None
    snoozed_until: date | None
    reminders: list[ReminderResponse]

    model_config = {"from_attributes": True}


class NotificationListItem(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    type_id: int
    type_name: str
    note: str | None
    target_date: date
    acknowledged_at: datetime | None
    snoozed_until: date | None
    days_remaining: int
    triggered: bool


class BadgeResponse(BaseModel):
    count: int
