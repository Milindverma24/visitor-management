##################################################
# QR TOKEN MODEL
##################################################
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from datetime import datetime
from app.database.database import Base


class QRToken(Base):
    __tablename__ = "qr_tokens"

    id = Column(Integer, primary_key=True, index=True)

    # Link to pass
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, unique=True)

    # QR Data
    qr_code_data = Column(Text, nullable=False)       # Full encrypted JSON payload
    token_hash = Column(String(500), unique=True, nullable=False, index=True)
    qr_image_path = Column(String(500), nullable=True) # Path to stored QR image

    # Validity
    valid_until = Column(DateTime, nullable=True)
    is_valid = Column(Boolean, default=True)

    # Scan Tracking
    last_scanned_at = Column(DateTime, nullable=True)
    scan_count = Column(Integer, default=0)
    last_scanned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_scanned_gate = Column(String(50), nullable=True)

    # Audit
    generated_at = Column(DateTime, default=datetime.utcnow)
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
