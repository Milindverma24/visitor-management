##################################################
# MATERIAL MOVEMENT MODEL
##################################################
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database.database import Base
from app.models.plant import Plant


class MaterialType(str, enum.Enum):
    INCOMING = "INCOMING"
    OUTGOING = "OUTGOING"
    RETURNABLE = "RETURNABLE"
    NON_RETURNABLE = "NON_RETURNABLE"


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)

    plant_id = Column(
        Integer,
        ForeignKey("plants.id"),
        nullable=True
    )
    plant = relationship("Plant")

    # Gate Pass Number
    gate_pass_number = Column(String(100), nullable=True, index=True)

    # Material Info
    material_name = Column(String(500), nullable=False)
    material_type = Column(SAEnum(MaterialType), nullable=False, default=MaterialType.INCOMING)
    quantity = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)

    # Vendor/Supplier
    vendor_name = Column(String(255), nullable=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)

    driver_name = Column(String(255), nullable=True)

    # Department
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department = relationship("Department")

    # Documents
    invoice_number = Column(String(100), nullable=True)
    po_number = Column(String(100), nullable=True)
    delivery_challan = Column(String(100), nullable=True)
    invoice_path = Column(String(500), nullable=True)
    challan_path = Column(String(500), nullable=True)

    # Status
    status = Column(String(50), default="PENDING")  # PENDING, APPROVED, ENTERED, EXITED, RETURNED
    is_returned = Column(Boolean, default=False)
    expected_return_date = Column(DateTime, nullable=True)
    actual_return_date = Column(DateTime, nullable=True)

    # Audit
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    entry_time = Column(DateTime, nullable=True)
    exit_time = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
