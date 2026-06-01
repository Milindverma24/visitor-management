##################################################
# IMPORTS
##################################################

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship

from datetime import datetime

from app.database.database import Base
from app.models.department import Department


##################################################
# USER MODEL
##################################################

class User(Base):
    """
    Purpose:
    System user model for authentication and RBAC.
    """

    __tablename__ = "users"

    ##################################################
    # PRIMARY KEY
    ##################################################

    id = Column(Integer, primary_key=True, index=True)

    ##################################################
    # USER INFORMATION
    ##################################################

    full_name = Column(String(255), nullable=False)

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    employee_id = Column(
        String(100),
        unique=True,
        nullable=True
    )

    ##################################################
    # AUTHENTICATION
    ##################################################

    hashed_password = Column(
        String(500),
        nullable=False
    )

    ##################################################
    # RBAC & DEPARTMENT
    ##################################################

    role = Column(
        String(100),
        default="EMPLOYEE"
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )

    department = relationship("Department")

    ##################################################
    # STATUS
    ##################################################

    is_active = Column(
        Boolean,
        default=True
    )

    is_superuser = Column(
        Boolean,
        default=False
    )

    ##################################################
    # AUDIT
    ##################################################

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )