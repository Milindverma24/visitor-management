from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class InterviewCreate(BaseModel):
    candidate_name: str
    candidate_email: Optional[str] = None
    candidate_mobile: str
    candidate_aadhaar: Optional[str] = ""
    candidate_address: Optional[str] = None
    candidate_photo_path: Optional[str] = None
    
    position: str
    department: str
    interview_type: str
    scheduled_time: datetime
    interview_location: Optional[str] = None
    interviewer_name: str
    interviewer_employee_id: Optional[str] = None
    
    resume_path: Optional[str] = None
    aadhaar_doc_path: Optional[str] = None
    educational_certificates_path: Optional[str] = None
    experience_documents_path: Optional[str] = None
    offer_letter_path: Optional[str] = None

class InterviewResponse(BaseModel):
    id: int
    candidate_name: str
    candidate_email: Optional[str] = None
    candidate_mobile: str
    candidate_aadhaar: Optional[str] = None
    candidate_address: Optional[str] = None
    candidate_photo_path: Optional[str] = None
    
    position: str
    department: str
    interview_type: str
    scheduled_time: datetime
    interview_location: Optional[str] = None
    interviewer_name: str
    interviewer_employee_id: Optional[str] = None
    
    resume_path: Optional[str] = None
    aadhaar_doc_path: Optional[str] = None
    educational_certificates_path: Optional[str] = None
    experience_documents_path: Optional[str] = None
    offer_letter_path: Optional[str] = None
    
    status: str
    approval_number: Optional[str] = None
    pass_number: Optional[str] = None
    host_id: int
    
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
