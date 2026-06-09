##################################################
# VENDOR MODEL
##################################################
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.database.database import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)

    # Company Info
    vendor_name = Column(String(255), nullable=False, index=True)
    vendor_code = Column(String(100), nullable=True, unique=True)
    contact_person = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)

    # Vendor Type
    vendor_type = Column(String(100), nullable=True)  # Supplier, Service, Maintenance, etc.
    gst_number = Column(String(50), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text, nullable=True)

    # Documents
    registration_path = Column(String(500), nullable=True)
    agreement_path = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
