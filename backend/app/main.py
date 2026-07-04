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
    role_required,
    VALID_ROLES
)

from app.api.admin.routes import (
    router as admin_router
)
from app.api.departments.routes import (
    router as department_router
)

from app.api.reports.routes import (
    router as report_router
)
from app.api.users.routes import (
    router as users_router
)

from app.api.contractors.routes import (
    router as contractors_router
)
from app.api.vendors.routes import (
    router as vendors_router
)
from app.api.materials.routes import (
    router as materials_router
)
from app.api.blacklist.routes import (
    router as blacklist_router
)
from app.api.search.routes import (
    router as search_router
)
from app.api.emergency.routes import (
    router as emergency_router
)
from app.api.occupancy.routes import (
    router as occupancy_router
)
from app.api.analytics.routes import (
    router as analytics_router
)
from app.api.plants.routes import (
    router as plants_router
)
from app.api.websockets import (
    router as websockets_router
)
from app.api.approvals.routes import (
    router as approvals_router
)

##################################################
# APP
##################################################

from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="IGLGATE v3.0 — Enterprise Access Management System",
    description="Indian Glycol Limited | Real-World Industrial Security Platform",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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
        "uploads/qrcodes",
        "uploads/badges",
        "uploads/documents",

        "uploads/passes",
        "uploads/resumes",
        "uploads/certificates",
        "uploads/company_docs"
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

app.include_router(visitor_router)

app.include_router(admin_router)
app.include_router(department_router, prefix="/api/departments", tags=["departments"])

app.include_router(report_router)
app.include_router(websockets_router)
app.include_router(users_router,       prefix="/api/users",       tags=["users"])

app.include_router(contractors_router, prefix="/api/contractors", tags=["contractors"])
app.include_router(vendors_router,     prefix="/api/vendors",     tags=["vendors"])
app.include_router(materials_router,   prefix="/api/materials",   tags=["materials"])
app.include_router(blacklist_router,   prefix="/api/blacklist",   tags=["blacklist"])
app.include_router(search_router,      prefix="/api/search",      tags=["search"])
app.include_router(emergency_router,   prefix="/api/emergency",   tags=["emergency"])
app.include_router(occupancy_router,   prefix="/api/occupancy",   tags=["occupancy"])
app.include_router(analytics_router,   prefix="/api/analytics",   tags=["analytics"])
app.include_router(plants_router,      prefix="/api/plants",      tags=["plants"])
app.include_router(approvals_router,   tags=["approvals"])

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
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    ##################################################
    # VALIDATE ROLE
    ##################################################

    role_upper = request.role.upper() if request.role else "EMPLOYEE"
    if role_upper not in VALID_ROLES:
        return {
            "success": False,
            "message": f"Invalid role. Valid roles: {', '.join(VALID_ROLES)}"
        }

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

    if request.employee_id:
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
        mobile_number=request.mobile_number,
        designation=request.designation,
        hashed_password=hash_password(request.password),
        role=role_upper,
        department_id=request.department_id,
        plant_id=request.plant_id
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
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    ##################################################
    # FIND USER
    ##################################################

    user = db.query(User).filter(
        (User.email == request.email) | (User.employee_id == request.email)
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
    # UPDATE LAST LOGIN
    ##################################################

    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()

    ##################################################
    # CREATE TOKENS
    # Includes plant_id, employee_id so every route
    # can scope queries without extra DB lookups.
    ##################################################

    access_token = create_access_token(
        {
            "sub":           user.email,
            "role":          user.role,
            "department_id": user.department_id,
            "plant_id":      user.plant_id,
            "user_id":       user.id,
            "employee_id":   user.employee_id,
            "full_name":     user.full_name
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
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.schemas.user import UserResponse
    db_user = db.query(User).filter(User.id == user.get("user_id")).first()

    if db_user:
        user_data = UserResponse.model_validate(db_user).model_dump()
    else:
        user_data = user

    return {
        "success": True,
        "user": user_data
    }


##################################################
# ADMIN DASHBOARD
##################################################

@app.get("/api/admin/dashboard")
def admin_dashboard(
    user=Depends(get_current_user)
):

    role_required(
        ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"]
    )(user)

    return {
        "success": True,
        "message": "Welcome Admin",
        "user": user
    }