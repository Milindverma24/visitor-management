##################################################
# DOCUMENT MODEL
##################################################
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SAEnum
from datetime import datetime
import enum
from app.database.database import Base


class DocumentType(str, enum.Enum):
    DRIVING_LICENSE = "DRIVING_LICENSE"

    INSURANCE = "INSURANCE"
    POLLUTION_CERT = "POLLUTION_CERT"
    AUTHORIZATION = "AUTHORIZATION"
    INVOICE = "INVOICE"
    PURCHASE_ORDER = "PURCHASE_ORDER"
    DELIVERY_CHALLAN = "DELIVERY_CHALLAN"
    VISITOR_PHOTO = "VISITOR_PHOTO"
    SAFETY_CERT = "SAFETY_CERT"
    MEDICAL_CERT = "MEDICAL_CERT"
    OTHER = "OTHER"


class EntityType(str, enum.Enum):
    VISITOR = "VISITOR"

    CONTRACTOR_EMPLOYEE = "CONTRACTOR_EMPLOYEE"
    CONTRACTOR = "CONTRACTOR"
    VENDOR = "VENDOR"
    VISIT = "VISIT"
    MATERIAL = "MATERIAL"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    entity_type = Column(SAEnum(EntityType), nullable=False)
    entity_id = Column(Integer, nullable=False, index=True)

    document_type = Column(SAEnum(DocumentType), nullable=False)
    document_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=False)
    file_size_kb = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)

    notes = Column(Text, nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
