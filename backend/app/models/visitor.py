from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Boolean
from sqlalchemy import DateTime

from datetime import datetime

from app.database.database import Base


class Visitor(Base):

    __tablename__ = "visitors"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String(255),
        nullable=False
    )

    phone_number = Column(
        String(20),
        nullable=False,
        index=True
    )

    email = Column(
        String(255),
        nullable=True
    )

    title = Column(
        String(50),
        nullable=True
    )

    address = Column(
        String(500),
        nullable=True
    )

    category = Column(
        String(100),
        nullable=True
    )

    company = Column(
        String(255),
        nullable=True
    )

    purpose = Column(
        String(500),
        nullable=False
    )

    id_type = Column(
        String(100),
        nullable=True
    )

    id_number = Column(
        String(255),
        nullable=True
    )

    # Visitor Photo
    photo_path = Column(
        String(500),
        nullable=True
    )

    # Blacklist Feature
    is_blacklisted = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )