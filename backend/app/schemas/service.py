from pydantic import BaseModel


class ServiceCategoryBase(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True


class ServiceCategoryCreate(ServiceCategoryBase):
    pass


class ServiceCategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


class ServiceCategoryResponse(ServiceCategoryBase):
    id: int
    business_id: int

    model_config = {"from_attributes": True}


class ServiceBase(BaseModel):
    code: str | None = None
    name: str
    description: str | None = None
    price: float = 0
    govt_fee: float = 0
    category_id: int | None = None
    taxable: bool = True
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    description: str | None = None
    price: float | None = None
    govt_fee: float | None = None
    category_id: int | None = None
    taxable: bool | None = None
    is_active: bool | None = None


class ServiceResponse(ServiceBase):
    id: int
    business_id: int

    model_config = {"from_attributes": True}


class PaginatedServices(BaseModel):
    items: list[ServiceResponse]
    total: int
    page: int
    page_size: int
