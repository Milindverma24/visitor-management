##################################################
# NOTIFICATION MODEL
##################################################
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from datetime import datetime
import enum
from app.database.database import Base


class NotificationChannel(str, enum.Enum):
    TELEGRAM = "TELEGRAM"
    EMAIL = "EMAIL"
    SMS = "SMS"


class NotificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    channel = Column(SAEnum(NotificationChannel), nullable=False)
    status = Column(SAEnum(NotificationStatus), default=NotificationStatus.PENDING)

    # Recipient
    recipient = Column(String(255), nullable=True)   # Email or chat ID
    subject = Column(String(500), nullable=True)
    message = Column(Text, nullable=False)

    # Reference
    event_type = Column(String(100), nullable=True)  # APPROVED, REJECTED, CHECK_IN, etc.
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)

    # Result
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
