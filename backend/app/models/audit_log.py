from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)

from datetime import datetime

from app.database.database import Base


class AuditLog(Base):

    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )
    
    user_email = Column(
        String(255),
        nullable=True
    )

    action = Column(
        String(255),
        nullable=False
    )

    target_id = Column(
        Integer,
        nullable=True
    )
    
    target_type = Column(
        String(100),
        nullable=True
    )

    ip_address = Column(
        String(100),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )