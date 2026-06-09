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
from app.models.plant import Plant


##################################################
# USER MODEL
##################################################

class User(Base):
    """
    Purpose:
    System user model for authentication and RBAC.

    Roles (hierarchy, highest to lowest):
    CORPORATE_SUPER_ADMIN → PLANT_ADMIN → DEPARTMENT_HEAD →
    HR_MANAGER / HR_EXECUTIVE / DEPARTMENT_EXECUTIVE →
    RECEPTIONIST → SECURITY_SUPERVISOR → SECURITY_GUARD → EMPLOYEE
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

    mobile_number = Column(
        String(20),
        nullable=True
    )

    profile_photo_path = Column(
        String(500),
        nullable=True
    )

    designation = Column(
        String(255),
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
        nullable=False,
        default="EMPLOYEE"
        # Valid roles:
        # CORPORATE_SUPER_ADMIN, PLANT_ADMIN,
        # DEPARTMENT_HEAD, HR_MANAGER, HR_EXECUTIVE,
        # DEPARTMENT_EXECUTIVE, RECEPTIONIST,
        # SECURITY_SUPERVISOR, SECURITY_GUARD, EMPLOYEE
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )

    department = relationship("Department", foreign_keys=[department_id])

    ##################################################
    # PLANT ASSOCIATION
    ##################################################

    plant_id = Column(
        Integer,
        ForeignKey("plants.id"),
        nullable=True
    )

    plant = relationship("Plant", foreign_keys=[plant_id])

    ##################################################
    # REPORTING HIERARCHY
    ##################################################

    reporting_manager_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    reporting_manager = relationship(
        "User",
        remote_side=[id],
        foreign_keys=[reporting_manager_id]
    )

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
    # ACTIVITY TRACKING
    ##################################################

    last_login = Column(
        DateTime,
        nullable=True
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