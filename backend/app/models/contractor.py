##################################################
# CONTRACTOR & CONTRACTOR EMPLOYEE MODELS
##################################################
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base
from app.models.plant import Plant


class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(Integer, primary_key=True, index=True)

    plant_id = Column(
        Integer,
        ForeignKey("plants.id"),
        nullable=True
    )
    plant = relationship("Plant")

    # Company Info
    company_name = Column(String(255), nullable=False, index=True)
    company_code = Column(String(100), nullable=True, unique=True)
    contact_person = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)

    # Work Details
    work_order_number = Column(String(100), nullable=True)
    work_description = Column(Text, nullable=True)
    work_area = Column(String(255), nullable=True)

    # Validity
    contract_start_date = Column(DateTime, nullable=True)
    contract_end_date = Column(DateTime, nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text, nullable=True)

    # Documents
    agreement_path = Column(String(500), nullable=True)
    registration_path = Column(String(500), nullable=True)

    # Relationships
    employees = relationship("ContractorEmployee", back_populates="contractor")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ContractorEmployee(Base):
    __tablename__ = "contractor_employees"

    id = Column(Integer, primary_key=True, index=True)

    contractor_id = Column(Integer, ForeignKey("contractors.id"), nullable=False)
    contractor = relationship("Contractor", back_populates="employees")

    # Personal Info
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    designation = Column(String(255), nullable=True)

    # Photo
    photo_path = Column(String(500), nullable=True)

    # Safety / Medical
    safety_induction_done = Column(Boolean, default=False)
    safety_induction_date = Column(DateTime, nullable=True)
    medical_fitness_done = Column(Boolean, default=False)
    ppe_verified = Column(Boolean, default=False)

    # Status
    is_active = Column(Boolean, default=True)
    is_blacklisted = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
