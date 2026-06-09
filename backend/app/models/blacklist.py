##################################################
# BLACKLIST MODEL
##################################################
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from datetime import datetime
import enum
from app.database.database import Base


class BlacklistType(str, enum.Enum):
    VISITOR = "VISITOR"
    VEHICLE = "VEHICLE"
    COMPANY = "COMPANY"
    CONTRACTOR = "CONTRACTOR"
    VENDOR = "VENDOR"
    DRIVER = "DRIVER"


class Blacklist(Base):
    __tablename__ = "blacklist"

    id = Column(Integer, primary_key=True, index=True)

    # Type and Reference
    blacklist_type = Column(SAEnum(BlacklistType), nullable=False)
    reference_id = Column(Integer, nullable=True)           # FK to respective entity
    reference_identifier = Column(String(255), nullable=False, index=True)  # name/number for quick search
    reference_name = Column(String(255), nullable=True)

    # Reason
    reason = Column(Text, nullable=False)
    incident_date = Column(DateTime, nullable=True)
    incident_description = Column(Text, nullable=True)

    # Status
    is_active = Column(Boolean, default=True)

    # Audit
    blacklisted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    blacklisted_at = Column(DateTime, default=datetime.utcnow)
    removed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    removed_at = Column(DateTime, nullable=True)
    removal_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
