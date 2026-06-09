##################################################
# VEHICLE MODEL
##################################################
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum as SAEnum
from datetime import datetime
import enum
from app.database.database import Base


class VehicleType(str, enum.Enum):
    TRUCK = "TRUCK"
    TANKER = "TANKER"
    TEMPO = "TEMPO"
    MINI_TRUCK = "MINI_TRUCK"
    TRAILER = "TRAILER"
    CONTAINER = "CONTAINER"
    VENDOR = "VENDOR"
    CONTRACTOR = "CONTRACTOR"
    GOVERNMENT = "GOVERNMENT"
    EMERGENCY = "EMERGENCY"
    PRIVATE = "PRIVATE"
    COMPANY = "COMPANY"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)

    # Identification
    vehicle_number = Column(String(50), unique=True, nullable=False, index=True)
    vehicle_type = Column(SAEnum(VehicleType), nullable=False, default=VehicleType.TRUCK)
    make_model = Column(String(255), nullable=True)

    # Driver Information
    driver_name = Column(String(255), nullable=True)
    driver_mobile = Column(String(20), nullable=True)
    driver_aadhaar = Column(String(255), nullable=True)  # stored encrypted
    transport_company = Column(String(255), nullable=True)

    # Documents (file paths)
    rc_path = Column(String(500), nullable=True)
    insurance_path = Column(String(500), nullable=True)
    pollution_cert_path = Column(String(500), nullable=True)
    driving_license_path = Column(String(500), nullable=True)
    authorization_path = Column(String(500), nullable=True)

    # Blacklist
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
