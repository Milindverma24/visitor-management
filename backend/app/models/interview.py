from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    
    candidate_id = Column(
        Integer,
        ForeignKey("visitors.id"),
        nullable=False
    )
    candidate = relationship("Visitor")

    hr_host_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    hr_host = relationship("User")
    
    position = Column(String(255), nullable=False)
    round_name = Column(String(100), nullable=True)
    
    scheduled_time = Column(DateTime, nullable=False)
    
    status = Column(String(100), default="SCHEDULED")
    feedback = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
