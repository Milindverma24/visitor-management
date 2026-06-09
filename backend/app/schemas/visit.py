from pydantic import BaseModel
from datetime import datetime
class VisitCreate(BaseModel):

    visitor_id: int
    department: str
    host_employee: str
    purpose: str
    
    up_to: str | None = None
    mobile_token_no: str | None = None
    arrival_date: datetime | None = None
    is_hod_approval_required: str | None = None
    accessories: str | None = None
    valid_up_to: datetime | None = None
    accompanied_by_count: int | None = 0
    pass_type: str | None = "VISITOR_PASS"