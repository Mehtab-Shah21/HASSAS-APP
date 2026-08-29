from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserCreate(BaseModel):
    first_name: str
    last_name: str | None = None
    display_name: str | None = None
    email: EmailStr
    password: str
    role: UserRole = UserRole.employee
    avatar_color: str | None = None
    phone_code: str | None = None
    phone: str | None = None


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    avatar_color: str | None = None
    phone_code: str | None = None
    phone: str | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str | None
    display_name: str | None
    email: str
    role: UserRole
    avatar_color: str | None
    phone_code: str | None
    phone: str | None
    is_active: bool

    model_config = {"from_attributes": True}
