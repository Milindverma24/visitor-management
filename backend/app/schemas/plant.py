from pydantic import BaseModel
from typing import Optional
from datetime import datetime


##################################################
# BASE
##################################################

class PlantBase(BaseModel):
    plant_code:   str
    plant_name:   str
    plant_address: Optional[str] = None
    plant_city:   Optional[str] = None
    plant_state:  Optional[str] = "Delhi"
    plant_type:   Optional[str] = "CITY_GAS_STATION"
    is_active:    bool = True


##################################################
# CREATE
##################################################

class PlantCreate(PlantBase):
    pass


##################################################
# UPDATE
##################################################

class PlantUpdate(BaseModel):
    plant_code:   Optional[str] = None
    plant_name:   Optional[str] = None
    plant_address: Optional[str] = None
    plant_city:   Optional[str] = None
    plant_state:  Optional[str] = None
    plant_type:   Optional[str] = None
    is_active:    Optional[bool] = None


##################################################
# RESPONSE
##################################################

class PlantResponse(PlantBase):
    id:         int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
