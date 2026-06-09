from pydantic import BaseModel, EmailStr
from typing import Optional


##################################################
# REGISTER REQUEST
##################################################

class RegisterRequest(BaseModel):
    full_name:     str
    email:         EmailStr
    password:      str
    employee_id:   Optional[str] = None
    mobile_number: Optional[str] = None
    designation:   Optional[str] = None
    role:          str = "EMPLOYEE"
    department_id: Optional[int] = None
    plant_id:      Optional[int] = None


##################################################
# LOGIN REQUEST
##################################################

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


##################################################
# TOKEN RESPONSE
##################################################

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"