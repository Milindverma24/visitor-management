from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MeetingCreate(BaseModel):
    title: str
    purpose: str
    description: Optional[str] = None
    meeting_type: str
    scheduled_time: datetime
    end_time: datetime
    location: Optional[str] = None
    host_employee: str
    host_department: str
    expected_duration: Optional[str] = None
    
    visitor_name: str
    company_name: str
    visitor_email: Optional[str] = None
    visitor_mobile: str
    visitor_aadhaar: Optional[str] = ""
    visitor_photo_path: Optional[str] = None
    visitor_designation: Optional[str] = None
    number_of_attendees: int = 1
    
    aadhaar_doc_path: Optional[str] = None
    company_id_doc_path: Optional[str] = None
    authorization_letter_path: Optional[str] = None
    business_card_path: Optional[str] = None
    company_documents_path: Optional[str] = None

class MeetingResponse(BaseModel):
    id: int
    title: str
    purpose: str
    description: Optional[str] = None
    meeting_type: str
    scheduled_time: datetime
    end_time: datetime
    location: Optional[str] = None
    host_employee: str
    host_department: str
    expected_duration: Optional[str] = None
    
    visitor_name: str
    company_name: str
    visitor_email: Optional[str] = None
    visitor_mobile: str
    visitor_aadhaar: Optional[str] = None
    visitor_photo_path: Optional[str] = None
    visitor_designation: Optional[str] = None
    number_of_attendees: int
    
    aadhaar_doc_path: Optional[str] = None
    company_id_doc_path: Optional[str] = None
    authorization_letter_path: Optional[str] = None
    business_card_path: Optional[str] = None
    company_documents_path: Optional[str] = None
    
    status: str
    approval_number: Optional[str] = None
    pass_number: Optional[str] = None
    created_by_id: int
    
    inside_plant: bool
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    entry_gate: Optional[str] = None
    exit_gate: Optional[str] = None
    guard_name: Optional[str] = None
    exit_guard_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
