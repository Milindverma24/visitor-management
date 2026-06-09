from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Meeting details
    title = Column(String(255), nullable=False)
    purpose = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    meeting_type = Column(String(100), nullable=False) # Internal, External, Vendor Meeting, Client Meeting, Government Meeting, Contractor Meeting
    scheduled_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=True)
    host_employee = Column(String(255), nullable=False)
    host_department = Column(String(100), nullable=False)
    expected_duration = Column(String(100), nullable=True)
    
    # Visitor Details
    visitor_name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    visitor_email = Column(String(255), nullable=True)
    visitor_mobile = Column(String(20), nullable=False)
    visitor_aadhaar = Column(String(20), nullable=False)
    visitor_photo_path = Column(String(500), nullable=True)
    visitor_designation = Column(String(100), nullable=True)
    number_of_attendees = Column(Integer, default=1)
    
    # Documents
    aadhaar_doc_path = Column(String(500), nullable=True)
    company_id_doc_path = Column(String(500), nullable=True)
    authorization_letter_path = Column(String(500), nullable=True)
    business_card_path = Column(String(500), nullable=True)
    company_documents_path = Column(String(500), nullable=True)
    
    # Status & Pass
    status = Column(String(100), default="PENDING") # PENDING, DEPT_REVIEWED, APPROVED, REJECTED, CANCELLED
    approval_number = Column(String(100), nullable=True)
    pass_number = Column(String(100), nullable=True) # MTG/000001
    
    # Host id (user who created it)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by = relationship("User")
    
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
