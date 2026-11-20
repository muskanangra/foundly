from pydantic import BaseModel


class StatsResponse(BaseModel):
    active_items: int
    returned_items: int
    users: int


class AdminStatsResponse(BaseModel):
    users: int
    active_items: int
    returned_items: int
    open_reports: int
