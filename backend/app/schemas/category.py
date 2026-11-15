from pydantic import BaseModel


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    active_count: int = 0

    model_config = {"from_attributes": True}
