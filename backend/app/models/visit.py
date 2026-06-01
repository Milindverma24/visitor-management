from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum
)
import enum
from sqlalchemy.orm import relationship

from datetime import datetime

from app.database.database import Base
from app.models.department import Department

class PassType(str, enum.Enum):
    VISITOR_PASS = "VISITOR_PASS"
    INTERVIEW_PASS = "INTERVIEW_PASS"
    MEETING_PASS = "MEETING_PASS"
    CONTRACTOR_PASS = "CONTRACTOR_PASS"
    VENDOR_PASS = "VENDOR_PASS"
    TEMPORARY_EMPLOYEE_PASS = "TEMPORARY_EMPLOYEE_PASS"


class Visit(Base):

    __tablename__ = "visits"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    visitor_id = Column(
        Integer,
        ForeignKey("visitors.id")
    )

    host_employee = Column(
        String(255),
        nullable=False
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )
    department = relationship("Department")

    pass_type = Column(
        Enum(PassType),
        default=PassType.VISITOR_PASS,
        nullable=False
    )

    purpose = Column(
        String(500),
        nullable=False
    )

    status = Column(
        String(100),
        default="PENDING"
    )
    
    card_id = Column(
        String(100),
        nullable=True
    )
    
    up_to = Column(
        String(100),
        nullable=True
    )
    
    mobile_token_no = Column(
        String(100),
        nullable=True
    )
    
    arrival_date = Column(
        DateTime,
        nullable=True
    )
    
    is_hod_approval_required = Column(
        String(10),
        default="NO"
    )
    
    accessories = Column(
        String(500),
        nullable=True
    )
    
    valid_up_to = Column(
        DateTime,
        nullable=True
    )
    
    accompanied_by_count = Column(
        Integer,
        default=0
    )

    check_in_time = Column(
        DateTime,
        nullable=True
    )

    check_out_time = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    ##################################################
    # APPROVAL INFORMATION
    ##################################################

    approved_by = Column(
        String(255),
        nullable=True
    )

    approved_at = Column(
        DateTime,
        nullable=True
    )

    rejection_reason = Column(
        String(500),
        nullable=True
    )
    ##################################################
    # GATE ENTRY DETAILS
    ##################################################

    checked_in_by = Column(
        String(255),
        nullable=True
    )

    checked_out_by = Column(
        String(255),
        nullable=True
    )

    gate_number = Column(
        String(50),
        nullable=True
    )
