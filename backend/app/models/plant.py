##################################################
# IMPORTS
##################################################

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database.database import Base


##################################################
# PLANT MODEL
##################################################

class Plant(Base):
    """
    Purpose:
    Represents a physical IGL plant / station location.
    A plant is the highest scoping unit below corporate.

    Examples:
    - IGL-DEL-CNG-001  (CNG Station, New Delhi)
    - IGL-NOI-PNG-001  (PNG Station, Noida)
    - IGL-GZB-CGS-001  (City Gas Station, Ghaziabad)
    """

    __tablename__ = "plants"

    ##################################################
    # PRIMARY KEY
    ##################################################

    id = Column(Integer, primary_key=True, index=True)

    ##################################################
    # IDENTITY
    ##################################################

    plant_code = Column(
        String(30),
        unique=True,
        nullable=False,
        index=True
    )

    plant_name = Column(
        String(255),
        nullable=False
    )

    ##################################################
    # LOCATION
    ##################################################

    plant_address = Column(String(500), nullable=True)
    plant_city    = Column(String(100), nullable=True)
    plant_state   = Column(String(100), nullable=True, default="Delhi")

    ##################################################
    # CLASSIFICATION
    ##################################################

    plant_type = Column(
        String(100),
        nullable=True,
        default="CITY_GAS_STATION"
        # Options: CITY_GAS_STATION | MOTHER_STATION | DAUGHTER_STATION
        #          CNG_STATION | PNG_STATION | CORPORATE_HQ
    )

    ##################################################
    # STATUS
    ##################################################

    is_active = Column(Boolean, default=True)

    ##################################################
    # AUDIT
    ##################################################

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
