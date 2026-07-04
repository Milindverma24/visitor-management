from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from app.schemas.department import DepartmentResponse
from app.schemas.plant import PlantResponse


##################################################
# BASE SCHEMA
##################################################

class UserBase(BaseModel):
    full_name:     str
    email:         EmailStr
    employee_id:   Optional[str] = None
    mobile_number: Optional[str] = None
    designation:   Optional[str] = None
    role:          str = "EMPLOYEE"
    department_id: Optional[int] = None
    plant_id:      Optional[int] = None
    is_active:     bool = True
    profile_photo_path: Optional[str] = None


##################################################
# CREATE
##################################################

class UserCreate(UserBase):
    password:             str
    reporting_manager_id: Optional[int] = None


##################################################
# UPDATE
##################################################

class UserUpdate(BaseModel):
    full_name:            Optional[str]      = None
    email:                Optional[EmailStr] = None
    employee_id:          Optional[str]      = None
    mobile_number:        Optional[str]      = None
    designation:          Optional[str]      = None
    role:                 Optional[str]      = None
    department_id:        Optional[int]      = None
    plant_id:             Optional[int]      = None
    reporting_manager_id: Optional[int]      = None
    is_active:            Optional[bool]     = None
    password:             Optional[str]      = None
    profile_photo_path:   Optional[str]      = None



##################################################
# RESPONSE
##################################################

class UserResponse(UserBase):
    id:                   int
    reporting_manager_id: Optional[int] = None
    is_superuser:         bool
    last_login:           Optional[datetime] = None
    created_at:           datetime
    updated_at:           datetime
    department:           Optional[DepartmentResponse] = None
    plant:                Optional[PlantResponse] = None

    class Config:
        from_attributes = True
