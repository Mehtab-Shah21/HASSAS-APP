from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PinLoginRequest(BaseModel):
    email: EmailStr
    pin: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUser(BaseModel):
    id: int
    first_name: str
    last_name: str | None
    display_name: str | None
    email: str
    role: UserRole
    avatar_color: str | None
    auto_lock_minutes: int

    model_config = {"from_attributes": True}


class SetPinRequest(BaseModel):
    pin: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class SetAutoLockRequest(BaseModel):
    auto_lock_minutes: int
