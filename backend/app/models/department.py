##################################################
# IMPORTS
##################################################

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base
from app.models.plant import Plant


##################################################
# DEPARTMENT MODEL
##################################################

class Department(Base):
    """
    Purpose:
    Represents a department within a plant.
    Departments are scoped to a plant and can be
    nested (e.g. HR → Recruitment sub-department).

    Standard IGL Departments:
    HR, IT, OPERATIONS, PRODUCTION, MAINTENANCE,
    SAFETY, FINANCE, LEGAL, SECURITY, PURCHASE,
    ENGINEERING, SALES, MARKETING, TRANSPORT, ADMIN
    """

    __tablename__ = "departments"

    ##################################################
    # PRIMARY KEY
    ##################################################

    id = Column(Integer, primary_key=True, index=True)

    ##################################################
    # IDENTITY
    ##################################################

    name = Column(
        String(100),
        nullable=False,
        index=True
    )

    code = Column(
        String(20),
        nullable=True,
        index=True
        # e.g. HR, IT, OPS, PROD, MAINT, SAFETY, FIN
    )

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
    # DEPARTMENT HIERARCHY
    ##################################################

    parent_dept_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )

    parent_department = relationship(
        "Department",
        remote_side=[id],
        foreign_keys=[parent_dept_id]
    )

    ##################################################
    # HEAD
    ##################################################

    head = Column(String(100), nullable=True)  # Legacy text field
    head_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )
    # head_user relationship defined later via backref or lazily

    ##################################################
    # CONTACT
    ##################################################

    email = Column(String(100), nullable=True)
    phone = Column(String(20),  nullable=True)

    description = Column(String(500), nullable=True)

    ##################################################
    # STATUS
    ##################################################

    is_active = Column(Boolean, default=True)

    ##################################################
    # AUDIT
    ##################################################

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
