from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    
    # Candidate details
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=True)
    candidate_mobile = Column(String(20), nullable=False)
    candidate_aadhaar = Column(String(20), nullable=False)
    candidate_address = Column(String(500), nullable=True)
    candidate_photo_path = Column(String(500), nullable=True)
    
    # Interview details
    position = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    interview_type = Column(String(100), nullable=False) # Online, Offline, Technical, HR Round, Final Round
    scheduled_time = Column(DateTime, nullable=False)
    interview_location = Column(String(255), nullable=True)
    interviewer_name = Column(String(255), nullable=False)
    interviewer_employee_id = Column(String(100), nullable=True)
    
    # Documents
    resume_path = Column(String(500), nullable=True)
    aadhaar_doc_path = Column(String(500), nullable=True)
    educational_certificates_path = Column(String(500), nullable=True)
    experience_documents_path = Column(String(500), nullable=True)
    offer_letter_path = Column(String(500), nullable=True)
    
    # Approval status & metadata
    status = Column(String(100), default="PENDING") # PENDING, HR_REVIEWED, APPROVED, REJECTED, CANCELLED
    approval_number = Column(String(100), nullable=True)
    pass_number = Column(String(100), nullable=True) # INT/000001
    
    # Host details (who created this request)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    host = relationship("User")
    
    # Gate check-in status
    inside_plant = Column(Boolean, default=False)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    entry_gate = Column(String(100), nullable=True)
    exit_gate = Column(String(100), nullable=True)
    guard_name = Column(String(255), nullable=True)
    exit_guard_name = Column(String(255), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
