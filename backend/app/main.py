##################################################
# IMPORTS
##################################################

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.user import User
from app.api.visitors.routes import router as visitor_router

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest
)

from app.security.password import (
    hash_password,
    verify_password
)

from app.security.auth import (
    create_access_token,
    create_refresh_token
)

from app.security.dependencies import (
    get_current_user
)

from app.security.rbac import (
    role_required
)
from app.api.ocr.routes import (
    router as ocr_router
)
from app.api.admin.routes import (
    router as admin_router
)
from app.api.departments.routes import (
    router as department_router
)
from app.api.meetings.routes import (
    router as meeting_router
)
from app.api.interviews.routes import (
    router as interview_router
)
from app.api.reports.routes import (
    router as report_router
)


##################################################
# APP
##################################################

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title="Enterprise Visitor Management System",
    version="1.0.0"
)

# Mount static files for photo uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount central static application assets
os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.on_event("startup")
def startup_event():
    dirs = [
        "uploads/visitor_photos",
        "uploads/photos",
        "uploads/aadhaar",
        "uploads/qrcodes",
        "uploads/badges"
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

app.include_router(visitor_router)
app.include_router(ocr_router)
app.include_router(admin_router)
app.include_router(department_router, prefix="/api/departments", tags=["departments"])
app.include_router(meeting_router)
app.include_router(interview_router)
app.include_router(report_router)

##################################################
# DATABASE
##################################################

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


##################################################
# ROOT
##################################################

@app.get("/")
def home():

    return {
        "message": "Visitor Management API Running"
    }


##################################################
# REGISTER USER
##################################################

@app.post("/api/auth/register")
def register_user(
    request: RegisterRequest
):

    db: Session = SessionLocal()

    ##################################################
    # CHECK EMAIL
    ##################################################

    existing_email = db.query(User).filter(
        User.email == request.email
    ).first()

    if existing_email:

        return {
            "success": False,
            "message": "Email already exists"
        }

    ##################################################
    # CHECK EMPLOYEE ID
    ##################################################

    existing_employee = db.query(User).filter(
        User.employee_id == request.employee_id
    ).first()

    if existing_employee:

        return {
            "success": False,
            "message": "Employee ID already exists"
        }

    ##################################################
    # CREATE USER
    ##################################################

    user = User(
        full_name=request.full_name,
        email=request.email,
        employee_id=request.employee_id,
        hashed_password=hash_password(
            request.password
        ),
        role=request.role.upper(),
        department_id=request.department_id
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "User registered successfully"
    }


##################################################
# LOGIN USER
##################################################

@app.post("/api/auth/login")
def login_user(
    request: LoginRequest
):

    db: Session = SessionLocal()

    ##################################################
    # FIND USER
    ##################################################

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:

        return {
            "success": False,
            "message": "Invalid credentials"
        }

    ##################################################
    # VERIFY PASSWORD
    ##################################################

    if not verify_password(
        request.password,
        user.hashed_password
    ):

        return {
            "success": False,
            "message": "Invalid credentials"
        }

    ##################################################
    # CREATE TOKENS
    ##################################################

    access_token = create_access_token(
        {
            "sub": user.email,
            "role": user.role,
            "department_id": user.department_id,
            "user_id": user.id
        }
    )

    refresh_token = create_refresh_token(
        {
            "sub": user.email
        }
    )

    ##################################################
    # RESPONSE
    ##################################################

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


##################################################
# CURRENT USER
##################################################

@app.get("/api/auth/me")
def get_me(
    user=Depends(get_current_user)
):

    return {
        "success": True,
        "user": user
    }


##################################################
# ADMIN DASHBOARD
##################################################

@app.get("/api/admin/dashboard")
def admin_dashboard(
    user=Depends(get_current_user)
):

    role_required(
        ["SUPER_ADMIN", "ADMIN"]
    )(user)

    return {
        "success": True,
        "message": "Welcome Admin",
        "user": user
    }