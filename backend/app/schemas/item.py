from datetime import datetime
from pydantic import BaseModel
from app.schemas.category import CategoryResponse


class ItemResponse(BaseModel):
    id: int
    name: str
    description: str          # never null in response; coerced to "" if DB is null
    location: str
    found_at: datetime
    category: CategoryResponse
    image_url: str
    status: str
    created_at: datetime
    is_owner: bool

    model_config = {"from_attributes": True}


class PaginatedItemsResponse(BaseModel):
    items: list[ItemResponse]
    total: int
    page: int
    page_size: int
