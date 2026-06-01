from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    scheduled_time: datetime
    end_time: datetime
    department_id: Optional[int] = None
    host_id: Optional[int] = None

class MeetingResponse(MeetingCreate):
    id: int
    host_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
