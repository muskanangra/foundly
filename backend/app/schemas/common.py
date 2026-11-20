from pydantic import BaseModel


class PublicUserResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class ItemSummaryResponse(BaseModel):
    id: int
    name: str
    image_url: str

    model_config = {"from_attributes": True}
