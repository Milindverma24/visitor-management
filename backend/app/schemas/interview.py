from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class InterviewCreate(BaseModel):
    candidate_id: int
    position: str
    round_name: Optional[str] = None
    scheduled_time: datetime

class InterviewResponse(InterviewCreate):
    id: int
    hr_host_id: int
    status: str
    feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
