from fastapi import APIRouter, Depends, Request, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import SessionLocal, get_db
from app.security.dependencies import get_current_user
from app.models.visitor import Visitor
from app.schemas.visitor import VisitorCreate
from app.models.visit import Visit
from app.schemas.visit import VisitCreate
from app.models.department import Department
from datetime import datetime
from app.utils.audit import create_audit_log
from app.utils.qr_generator import generate_qr
from app.utils.badge_generator import generate_badge
from app.utils.email_service import send_email
from app.utils.email_templates import render_approval_email, render_checkin_email, render_checkout_email
from app.utils.whatsapp_service import send_whatsapp
from app.utils.timezone import to_ist, get_ist_now
from app.api.websockets import sync_broadcast

import os
import shutil

router = APIRouter(
    prefix="/api/visitors",
    tags=["Visitors"]
)

##################################################
# UPLOAD VISITOR PHOTO
##################################################

@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...)
):
    import base64
    content = await file.read()
    base64_str = base64.b64encode(content).decode('utf-8')
    mime_type = file.content_type or "image/jpeg"
    data_url = f"data:{mime_type};base64,{base64_str}"
    return {
        "success": True,
        "photo_path": data_url
    }

##################################################
# UPLOAD VISITOR/CANDIDATE DOCUMENT
##################################################

@router.post("/upload-doc")
async def upload_document(
    file: UploadFile = File(...)
):
    import base64
    content = await file.read()
    base64_str = base64.b64encode(content).decode('utf-8')
    mime_type = file.content_type or "application/octet-stream"
    data_url = f"data:{mime_type};base64,{base64_str}"
    return {
        "success": True,
        "file_path": data_url
    }
##################################################
# REGISTER VISITOR
##################################################

@router.post("/")
def create_visitor(
    request: VisitorCreate,
    db: Session = Depends(get_db)
):

    import base64
    import time
    
    photo_path = None
    if request.photo_base64:
        photo_path = request.photo_base64

    existing_visitor = db.query(Visitor).filter(Visitor.phone_number == request.phone_number).first()

    if existing_visitor:
        existing_visitor.full_name = request.full_name
        existing_visitor.email = request.email
        existing_visitor.company = request.company
        existing_visitor.purpose = request.purpose
        existing_visitor.id_type = request.id_type
        existing_visitor.id_number = request.id_number
        existing_visitor.title = request.title
        existing_visitor.address = request.address
        existing_visitor.category = request.category
        if photo_path:
            existing_visitor.photo_path = photo_path
        visitor = existing_visitor
    else:
        visitor = Visitor(
            full_name=request.full_name,
            phone_number=request.phone_number,
            email=request.email,
            company=request.company,
            purpose=request.purpose,
            id_type=request.id_type,
            id_number=request.id_number,
            title=request.title,
            address=request.address,
            category=request.category,
            photo_path=photo_path
        )
        db.add(visitor)

    db.commit()
    db.refresh(visitor)

    return {
        "success": True,
        "visitor_id": visitor.id,
        "message": "Visitor Registered Successfully"
    }


##################################################
# GET ALL VISITORS
##################################################

@router.get("/")
def get_visitors(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Visitor)
    
    if current_user.get("role") != "CORPORATE_SUPER_ADMIN":
        plant_id = current_user.get("plant_id")
        # Join with Visit to only show visitors who have visited this plant
        query = query.join(Visit).filter(Visit.plant_id == plant_id)
        
    return query.distinct().all()

##################################################
# SEARCH VISITOR BY PHONE NUMBER
##################################################

@router.get("/search/{phone_number}")
def search_visitor(phone_number: str):

    db: Session = SessionLocal()

    visitor = db.query(Visitor).filter(
        Visitor.phone_number == phone_number
    ).first()

    if not visitor:

        return {
            "success": False,
            "message": "Visitor Not Found"
        }

    # Count how many times they have visited
    visit_count = db.query(Visit).filter(
        Visit.visitor_id == visitor.id
    ).count()

    return {
        "success": True,
        "visit_count": visit_count,
        "visitor": {
            "id": visitor.id,
            "full_name": visitor.full_name,
            "phone_number": visitor.phone_number,
            "email": visitor.email,
            "company": visitor.company,
            "purpose": visitor.purpose,
            "id_type": visitor.id_type,
            "id_number": visitor.id_number,
            "address": visitor.address,
            "title": visitor.title,
            "category": visitor.category,
            "photo_path": visitor.photo_path
        }
    }

from pydantic import BaseModel
from typing import Optional

class PreRegisteredCompleteRequest(BaseModel):
    visitor_id: int
    full_name: str
    phone_number: str
    email: Optional[str] = None
    address: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    photo_base64: Optional[str] = None
    
    accessories: Optional[str] = None
    accompanied_by_count: Optional[int] = 0
    up_to: Optional[str] = None
    mobile_token_no: Optional[str] = None

@router.get("/pre-registered/{phone_number}")
def get_pre_registered_visits(phone_number: str):
    db: Session = SessionLocal()
    
    # Clean phone number (strip spaces/dashes)
    clean_phone = phone_number.strip().replace(" ", "").replace("-", "")
    
    # Search for all visitors with this phone number
    visitors = db.query(Visitor).filter(
        (Visitor.phone_number == clean_phone) |
        (Visitor.phone_number == phone_number) |
        (Visitor.phone_number.like(f"%{clean_phone}%"))
    ).all()
    
    if not visitors:
        return []
        
    visitor_ids = [v.id for v in visitors]
    current_time = datetime.utcnow()
    
    # Get all visits for these visitors ordered by newest first
    all_visits = db.query(Visit).filter(
        Visit.visitor_id.in_(visitor_ids)
    ).order_by(Visit.created_at.desc()).all()
    
    # 1. Employee-created visits (active only: PENDING or APPROVED, not checked in yet)
    employee_visits = [v for v in all_visits if v.created_by_employee is True and v.check_in_time is None and v.status in ["APPROVED", "PENDING"]]
    
    active_employee_visits = []
    for visit in employee_visits:
        # Check if valid_up_to has passed and dynamically skip if expired
        if visit.status == "APPROVED" and visit.valid_up_to and current_time > visit.valid_up_to:
            visit.status = "EXPIRED"
            db.commit()
            continue
        active_employee_visits.append(visit)
        
    # 2. Self-created visits
    self_visits = [v for v in all_visits if not v.created_by_employee]
    
    # Combine active employee visits and the single last self-created visit
    selected_visits = []
    selected_visits.extend(active_employee_visits)
    
    if self_visits:
        selected_visits.append(self_visits[0])
        
    result = []
    for visit in selected_visits:
        visitor = next((v for v in visitors if v.id == visit.visitor_id), None)
        dept_name = visit.department.name if visit.department else "Unknown"
        
        result.append({
            "visit_id": visit.id,
            "visitor_id": visit.visitor_id,
            "visitor_name": visitor.full_name if visitor else "Unknown",
            "visitor_phone": visitor.phone_number if visitor else phone_number,
            "visitor_email": visitor.email if visitor else "",
            "visitor_company": visitor.company if visitor else "",
            "visitor_address": visitor.address if visitor else "",
            "title": visitor.title if (visitor and visitor.title) else "Mr.",
            "card_id": visit.card_id,
            "status": visit.status,
            "host_employee": visit.host_employee,
            "purpose": visit.purpose,
            "arrival_date": visit.arrival_date.isoformat() if visit.arrival_date else None,
            "valid_up_to": visit.valid_up_to.isoformat() if visit.valid_up_to else None,
            "department_name": dept_name,
            "up_to": visit.up_to,
            "accompanied_by_count": visit.accompanied_by_count,
            "accessories": visit.accessories,
            "mobile_token_no": visit.mobile_token_no,
            "created_by_employee": visit.created_by_employee,
            "category": visit.pass_type.value if hasattr(visit.pass_type, "value") else str(visit.pass_type)
        })
        
    return result

@router.put("/pre-registered/{visit_id}/complete")
def complete_pre_registered_visit(
    visit_id: int,
    request: PreRegisteredCompleteRequest,
    db: Session = Depends(get_db)
):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Visit Not Found")
        
    visitor = db.query(Visitor).filter(Visitor.id == request.visitor_id).first()
    if not visitor:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Visitor Not Found")
        
    # Update visitor photo if provided
    import base64
    import time
    
    photo_path = visitor.photo_path
    if request.photo_base64:
        try:
            base64_data = request.photo_base64
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]
            
            photo_filename = f"visitor_{int(time.time())}.jpg"
            photo_path = os.path.join("uploads/photos", photo_filename)
            
            with open(photo_path, "wb") as f:
                f.write(base64.b64decode(base64_data))
                
            photo_path = f"/{photo_path}"
        except Exception as e:
            print(f"Failed to save photo: {e}")
            
    # Update visitor details
    visitor.full_name = request.full_name
    visitor.email = request.email
    visitor.address = request.address
    if request.title:
        visitor.title = request.title
    if request.category:
        visitor.category = request.category
    visitor.photo_path = photo_path
    
    # Update visit details
    if request.accessories is not None:
        visit.accessories = request.accessories
    if request.accompanied_by_count is not None:
        visit.accompanied_by_count = request.accompanied_by_count
    if request.up_to is not None:
        visit.up_to = request.up_to
    if request.mobile_token_no is not None:
        visit.mobile_token_no = request.mobile_token_no
        
    if not visit.card_id:
        visit.card_id = f"VM/{visit.id:06d}"
        
    db.commit()
    db.refresh(visit)
    db.refresh(visitor)
    
    return {
        "success": True,
        "visit_id": visit.id,
        "card_id": visit.card_id,
        "status": visit.status,
        "message": "Pre-registered visit completed successfully"
    }

@router.get("/status/{phone_number}")
def get_visitor_status(phone_number: str):
    db: Session = SessionLocal()
    
    # Clean phone number (strip spaces/dashes)
    clean_phone = phone_number.strip().replace(" ", "").replace("-", "")
    
    # Search for visitor by phone
    visitor = db.query(Visitor).filter(
        (Visitor.phone_number == clean_phone) |
        (Visitor.phone_number == phone_number) |
        (Visitor.phone_number.like(f"%{clean_phone}%"))
    ).first()
    
    if not visitor:
        return {
            "success": False,
            "message": "No visitor profile found with this phone number."
        }
        
    # Get latest visit pass for this visitor
    visit = db.query(Visit).filter(
        Visit.visitor_id == visitor.id
    ).order_by(Visit.id.desc()).first()
    
    if not visit:
        return {
            "success": True,
            "visitor_name": visitor.full_name,
            "has_visit": False,
            "message": "Profile exists, but no active visit passes were found."
        }
        
    return {
        "success": True,
        "visitor_name": visitor.full_name,
        "has_visit": True,
        "visit_id": visit.id,
        "card_id": visit.card_id,
        "status": visit.status,
        "host_employee": visit.host_employee,
        "purpose": visit.purpose,
        "arrival_date": visit.arrival_date.isoformat() if visit.arrival_date else None,
        "valid_up_to": visit.valid_up_to.isoformat() if visit.valid_up_to else None,
        "department_name": visit.department.name if visit.department else "Unknown"
    }

##################################################
# CREATE VISIT REQUEST
##################################################

@router.post("/visit")
def create_visit(
    request: VisitCreate,
    background_tasks: BackgroundTasks,
    http_request: Request,
    db: Session = Depends(get_db)
):

    visitor = db.query(Visitor).filter(
        Visitor.id == request.visitor_id
    ).first()

    if not visitor:

        return {
            "success": False,
            "message": "Visitor Not Found"
        }
    if visitor.is_blacklisted:
        return {
            "success": False,
            "message": "Visitor is Blacklisted"
        }
    # Look up department by name to get the ID
    dept = None
    if request.department:
        dept = db.query(Department).filter(Department.name == request.department).first()

    # Determine if this was created by an employee
    created_by_employee = False
    auth_header = http_request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from app.security.auth import verify_token
            token = auth_header.split(" ")[1]
            payload = verify_token(token)
            if payload:
                created_by_employee = True
        except Exception as e:
            print("Token verification failed in create_visit:", e)

    visit = Visit(
        visitor_id=request.visitor_id,
        department_id=dept.id if dept else None,
        host_employee=request.host_employee,
        purpose=request.purpose,
        status="PENDING",
        up_to=request.up_to,
        mobile_token_no=request.mobile_token_no,
        arrival_date=request.arrival_date,
        is_hod_approval_required=request.is_hod_approval_required,
        accessories=request.accessories,
        valid_up_to=request.valid_up_to,
        accompanied_by_count=request.accompanied_by_count,
        pass_type=request.pass_type or ("INTERVIEW_PASS" if request.purpose == "Interview" else "VISITOR_PASS"),
        created_by_employee=created_by_employee,
        plant_id=payload.get("plant_id") if created_by_employee and payload and payload.get("role") != "CORPORATE_SUPER_ADMIN" else request.plant_id
    )

    db.add(visit)
    db.commit()
    db.refresh(visit)
    
    # Generate Location-Specific Visitor ID
    plant_prefix = "IGL"
    if visit.plant_id:
        from app.models.plant import Plant
        plant_obj = db.query(Plant).filter(Plant.id == visit.plant_id).first()
        if plant_obj and plant_obj.plant_code:
            code = plant_obj.plant_code.upper()
            if code in ["KP", "KSP"]:
                plant_prefix = "KASP"
            else:
                plant_prefix = code

    visit.card_id = f"{plant_prefix}-{visit.id:06d}"
    db.commit()
    db.refresh(visit)
    
    sync_broadcast("NEW_VISIT", {
        "visit_id": visit.id,
        "visitor_name": visitor.full_name,
        "department": request.department or "Unknown"
    })

    from app.models.user import User
    # Find employee's email. Handle formatting from frontend like "Name (ROLE, Dept)"
    clean_host_name = visit.host_employee.split(" (")[0]
    host_user = db.query(User).filter(User.full_name == clean_host_name).first()
    if not host_user:
        host_user = db.query(User).filter(User.email == clean_host_name).first()
    if not host_user:
        host_user = db.query(User).filter(User.employee_id == clean_host_name).first()
    
    if host_user and host_user.email:
        from app.core.config import settings
        if settings.BACKEND_URL:
            base_url = settings.BACKEND_URL.rstrip("/")
        else:
            import socket
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                local_ip = s.getsockname()[0]
                s.close()
                base_url = f"http://{local_ip}:8001"
            except Exception:
                base_url = str(http_request.base_url).rstrip("/")
        background_tasks.add_task(
            bg_send_approval_request,
            visit_id=visit.id,
            host_email=host_user.email,
            host_name=host_user.full_name,
            visitor_name=visitor.full_name,
            mobile_number=visitor.phone_number,
            organization=visitor.company or "N/A",
            purpose=visit.purpose,
            visit_date=visit.arrival_date.isoformat() if visit.arrival_date else "N/A",
            department=request.department or "Unknown",
            base_url=base_url
        )

    return {
        "success": True,
        "visit_id": visit.id,
        "status": visit.status,
        "message": "Visit Request Created"
    }

##################################################
# EXPIRE VISIT
##################################################

@router.put("/expire/{visit_id}")
def expire_visit(
    visit_id: int,
    user: dict = Depends(get_current_user)
):
    db: Session = SessionLocal()
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Visit Not Found")
        
    visit.status = "EXPIRED"
    db.commit()
    
    return {"success": True, "message": "Visit marked as expired"}

##################################################
# GET ALL VISITS
##################################################

@router.get("/visits")
def get_all_visits(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    query = db.query(Visit)

    role = user.get("role", "EMPLOYEE")
    plant_id = user.get("plant_id")

    # Filter by plant for everyone except SUPER_ADMIN
    if role != "CORPORATE_SUPER_ADMIN":
        query = query.filter(Visit.plant_id == plant_id)

    if role in ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"]:
        # Full visibility within their scope
        pass
    elif role in ["DEPARTMENT_HEAD", "DEPARTMENT_EXECUTIVE"]:
        # Own department's visits only
        dept_id = user.get("department_id")
        query = query.filter(Visit.department_id == dept_id)
    elif role in ["SECURITY_GUARD", "SECURITY_SUPERVISOR"]:
        from sqlalchemy import or_
        today = datetime.utcnow().date()
        query = query.filter(
            or_(
                Visit.status == "APPROVED",
                Visit.status == "CHECKED_IN",
                func.date(Visit.created_at) == today,
                func.date(Visit.check_in_time) == today,
                func.date(Visit.check_out_time) == today
            )
        )
    elif role == "HR_MANAGER":
        # HR sees interview passes globally OR any passes where they are the host
        from sqlalchemy import or_
        query = query.filter(
            or_(
                Visit.pass_type == "INTERVIEW_PASS",
                Visit.host_employee == user.get("sub")
            )
        )
    elif role == "RECEPTIONIST":
        # Receptionist sees all pending and today's
        from sqlalchemy import or_
        today = datetime.utcnow().date()
        query = query.filter(
            or_(
                Visit.status == "PENDING",
                func.date(Visit.created_at) == today
            )
        )
    else:
        # EMPLOYEE sees all visits in their plant so they can approve any
        pass

    visits = query.all()

    # Dynamically update status to EXPIRED if valid_up_to has passed and not checked in
    current_time = datetime.utcnow()
    expired_any = False
    for v in visits:
        if v.status == "APPROVED" and v.check_in_time is None and v.valid_up_to and current_time > v.valid_up_to:
            v.status = "EXPIRED"
            expired_any = True

    if expired_any:
        db.commit()

    return visits


##################################################
# APPROVE VISIT
##################################################

@router.put("/approve/{visit_id}")
def approve_visit(
    visit_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    Approves a visitor pass request.

    IGLGATE v3.0 Approval Chain:
    - Approver: EVERYONE (EMPLOYEE, DEPARTMENT_HEAD, PLANT_ADMIN, CORPORATE_SUPER_ADMIN)
    """
    from app.security.rbac import can_approve_visit

    db: Session = SessionLocal()

    visit = db.query(
        Visit
    ).filter(
        Visit.id == visit_id
    ).first()

    if not visit:
        return {
            "success": False,
            "message": "Visit Not Found"
        }

    if not can_approve_visit(user, visit, db):
        return {
            "success": False,
            "message": "Access Denied: You do not have authority to approve this visit."
        }

    visit.status = "APPROVED"
    visit.approved_by = user.get("sub")
    visit.approved_at = datetime.utcnow()
    
    # Make pass valid only for that particular day if not explicitly set
    if not visit.valid_up_to and visit.arrival_date:
        # Set to 23:59:59 of arrival_date
        visit.valid_up_to = visit.arrival_date.replace(hour=23, minute=59, second=59)
    elif not visit.valid_up_to:
        # If no arrival date, default to end of today
        visit.valid_up_to = datetime.utcnow().replace(hour=23, minute=59, second=59)

    qr_path = generate_qr(
        visit.id
    )
    visitor = db.query(
        Visitor
    ).filter(
        Visitor.id == visit.visitor_id
    ).first()

    badge_path = generate_badge(
        visit=visit,
        visitor=visitor,
        qr_path=qr_path,
        company_logo="app/static/company_logo.png"
    )

    from app.models.user import User
    executing_user = db.query(User).filter(User.id == user.get("user_id")).first()
    emp_id = executing_user.employee_id if (executing_user and executing_user.employee_id) else "SYSTEM"
    user_email = user.get("sub")

    create_audit_log(
        db=db,
        user_email=user_email,
        action="APPROVED_VISIT",
        visitor_id=visit.visitor_id,
        employee_id=emp_id
    )

    db.commit()

    dept_name = visit.department.name if visit.department else "Unknown"

    background_tasks.add_task(
        bg_approval_notifications,
        visitor_email=visitor.email if visitor else None,
        visitor_name=visitor.full_name if visitor else "Unknown",
        visit_date=to_ist(visit.created_at).strftime("%Y-%m-%d %H:%M") if (visit.created_at and hasattr(visit.created_at, "strftime")) else get_ist_now().strftime("%Y-%m-%d %H:%M"),
        host_name=visit.host_employee,
        badge_path=badge_path,
        dept_name=dept_name,
        visit_id=visit.id,
        card_id=visit.card_id
    )

    sync_broadcast("VISIT_APPROVED", {"visit_id": visit.id, "status": "APPROVED"})

    return {
        "success": True,
        "message": "Visit Approved",
        "qr_code": qr_path,
        "badge": badge_path
    }


@router.put("/reject/{visit_id}")
def reject_visit(
    visit_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):

    db: Session = SessionLocal()

    visit = db.query(
        Visit
    ).filter(
        Visit.id == visit_id
    ).first()

    if not visit:

        return {
            "success": False,
            "message": "Visit Not Found"
        }

    visit.status = "REJECTED"
    visit.rejection_reason = "Rejected By Admin"

    from app.models.user import User
    executing_user = db.query(User).filter(User.id == user.get("user_id")).first()
    emp_id = executing_user.employee_id if (executing_user and executing_user.employee_id) else "SYSTEM"
    user_email = user.get("sub")

    create_audit_log(
        db=db,
        user_email=user_email,
        action="REJECTED_VISIT",
        visitor_id=visit.visitor_id,
        employee_id=emp_id
    )

    db.commit()

    visitor = db.query(
        Visitor
    ).filter(
        Visitor.id == visit.visitor_id
    ).first()

    dept_name = visit.department.name if visit.department else "Unknown"

    background_tasks.add_task(
        bg_rejection_notifications,
        visitor_email=visitor.email if visitor else None,
        visitor_name=visitor.full_name if visitor else "Unknown",
        visit_id=visit.id,
        host_name=visit.host_employee,
        rejection_reason=visit.rejection_reason,
        dept_name=dept_name
    )

    return {
        "success": True,
        "message": "Visit Rejected"
    }
##################################################
# CHECK IN VISITOR
##################################################

@router.put("/checkin/{visit_id}")
def checkin_visitor(
    visit_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):

    db: Session = SessionLocal()

    visit = db.query(Visit).filter(
        Visit.id == visit_id
    ).first()

    if not visit:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Visit Not Found")

    if visit.status != "APPROVED":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Visit Not Approved or Already Processed")

    if visit.check_in_time:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Already Checked-In")

    if visit.valid_up_to and datetime.utcnow() > visit.valid_up_to:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Pass Expired")

    visit.check_in_time = datetime.utcnow()
    visit.checked_in_by = "Security Guard 1"
    visit.gate_number = "Gate-1"

    from app.models.user import User
    executing_user = db.query(User).filter(User.id == user.get("user_id")).first()
    emp_id = executing_user.employee_id if (executing_user and executing_user.employee_id) else "SYSTEM"
    user_email = user.get("sub")

    create_audit_log(
        db=db,
        user_email=user_email,
        action="CHECK_IN",
        visitor_id=visit.visitor_id,
        employee_id=emp_id
    )

    db.commit()

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    visitor_name = visitor.full_name if visitor else "Unknown"
    time_str = to_ist(visit.check_in_time).strftime('%Y-%m-%d %H:%M:%S')
    dept_name = visit.department.name if visit.department else "Unknown"

    background_tasks.add_task(
        bg_checkin_notifications,
        visitor_name=visitor_name,
        time_str=time_str,
        host_name=visit.host_employee,
        visitor_email=visitor.email if visitor else None,
        visit_id=visit.id,
        gate_number=visit.gate_number,
        dept_name=dept_name
    )

    sync_broadcast("CHECK_IN", {"visit_id": visit.id, "visitor_name": visitor_name})

    return {
        "success": True,
        "message": "Visitor Checked In"
    }


@router.put("/checkout/{visit_id}")
def checkout_visitor(
    visit_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):

    db: Session = SessionLocal()

    visit = db.query(Visit).filter(
        Visit.id == visit_id
    ).first()

    if not visit:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Visit Not Found")
        
    if visit.check_out_time:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Already Checked-Out")
        
    if not visit.check_in_time:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Cannot check out: Not Checked-In yet")

    visit.check_out_time = datetime.utcnow()
    visit.checked_out_by = "Security Guard 1"

    from app.models.user import User
    executing_user = db.query(User).filter(User.id == user.get("user_id")).first()
    emp_id = executing_user.employee_id if (executing_user and executing_user.employee_id) else "SYSTEM"
    user_email = user.get("sub")

    create_audit_log(
        db=db,
        user_email=user_email,
        action="CHECK_OUT",
        visitor_id=visit.visitor_id,
        employee_id=emp_id
    )

    db.commit()

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    visitor_name = visitor.full_name if visitor else "Unknown"
    time_str = to_ist(visit.check_out_time).strftime('%Y-%m-%d %H:%M:%S')
    dept_name = visit.department.name if visit.department else "Unknown"

    background_tasks.add_task(
        bg_checkout_notifications,
        visitor_name=visitor_name,
        time_str=time_str,
        visitor_email=visitor.email if visitor else None,
        visitor_phone=visitor.phone_number if visitor else None,
        visit_id=visit.id,
        gate_number=visit.gate_number,
        dept_name=dept_name
    )

    sync_broadcast("CHECK_OUT", {"visit_id": visit.id, "visitor_name": visitor_name})

    return {
        "success": True,
        "message": "Visitor Checked Out"
    }

from app.models.audit_log import AuditLog

##################################################
# GET AUDIT LOGS
##################################################

@router.get("/audit-logs")
def get_audit_logs():

    db: Session = SessionLocal()

    logs = db.query(
        AuditLog
    ).all()

    return logs
##################################################
# BLACKLIST VISITOR
##################################################

@router.put("/blacklist/{visitor_id}")
def blacklist_visitor(visitor_id: int):

    db: Session = SessionLocal()

    visitor = db.query(
        Visitor
    ).filter(
        Visitor.id == visitor_id
    ).first()

    if not visitor:

        return {
            "success": False,
            "message": "Visitor Not Found"
        }

    visitor.is_blacklisted = True

    # Add entry to unified Blacklist table
    from app.models.blacklist import Blacklist, BlacklistType
    
    b_type = BlacklistType.DRIVER if (visitor.category and visitor.category.upper() == "DRIVER") else BlacklistType.VISITOR
    existing = db.query(Blacklist).filter(
        Blacklist.reference_identifier == visitor.phone_number,
        Blacklist.blacklist_type == b_type,
        Blacklist.is_active == True
    ).first()
    
    if not existing:
        blacklist_entry = Blacklist(
            blacklist_type=b_type,
            reference_id=visitor.id,
            reference_identifier=visitor.phone_number,
            reference_name=visitor.full_name,
            reason="Blacklisted from Visitor Directory",
            is_active=True
        )
        db.add(blacklist_entry)

    db.commit()

    return {
        "success": True,
        "message": "Visitor Blacklisted"
    }


# ---------------------------------------------------------
# BACKGROUND TASK RUNNERS FOR NON-BLOCKING ALERTS
# ---------------------------------------------------------

def bg_approval_notifications(visitor_email, visitor_name, visit_date, host_name, badge_path, dept_name, visit_id, card_id):
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        if visitor_email:
            try:
                email_body = render_approval_email(
                    visitor_name=visitor_name,
                    visit_date=visit_date,
                    host_name=host_name
                )
                send_email(
                    recipient_email=visitor_email,
                    subject="Your Visit is Approved - IGL",
                    body=email_body,
                    is_html=True,
                    attachment_base64=badge_path,
                    attachment_name=f"igl_visitor_pass_{card_id}.pdf"
                )
            except Exception as e:
                print(f"Failed to email visitor: {e}")
        
        from app.models.visit import Visit
        from app.models.visitor import Visitor
        
        visit = db.query(Visit).filter(Visit.id == visit_id).first()
        
        if badge_path:
            # Email the guard
            from app.core.config import settings
            if settings.EMAIL_USER:
                try:
                    guard_email = os.getenv("GUARD_EMAIL", "guard@igl.co.in")
                    send_email(
                        recipient_email=guard_email,
                        subject=f"NEW ENTRY PASS: {visitor_name}",
                        body=email_body,
                        is_html=True,
                        attachment_base64=badge_path,
                        attachment_name=f"igl_visitor_pass_{card_id}.pdf"
                    )
                except Exception as e:
                    print(f"Failed to email guard: {e}")
        db.commit()
    except Exception as e:
        print(f"Error in bg_approval_notifications: {e}")
        db.rollback()
    finally:
        db.close()


def bg_rejection_notifications(visitor_email, visitor_name, visit_id, host_name, rejection_reason, dept_name):
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        if visitor_email:
            try:
                send_email(
                    visitor_email,
                    "Visit Request Rejected",
                    f"Hello {visitor_name},\n\nWe regret to inform you that your visit request has been rejected.\n\nVisit ID: {visit_id}\n\nHost Employee:\n{host_name}\n\nReason:\n{rejection_reason}\n\nPlease contact the concerned employee for more details.\n\nThank You,\nVisitor Management Team"
                )
            except Exception:
                pass
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def bg_checkin_notifications(visitor_name, time_str, host_name, visitor_email, visit_id, gate_number, dept_name):
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        subject = f"Visitor Checked In: {visitor_name}"
        email_body = render_checkin_email(
            visitor_name=visitor_name,
            checkin_time=time_str,
            host_name=host_name
        )
        
        if visitor_email:
            try:
                send_email(visitor_email, subject, email_body, is_html=True)
            except Exception:
                pass
        try:
            send_email("anshverma24112005@gmail.com", subject, email_body, is_html=True)
        except Exception:
            pass
            
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def bg_checkout_notifications(visitor_name, time_str, visitor_email, visitor_phone, visit_id, gate_number, dept_name):
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        subject = f"Visitor Checked Out: {visitor_name}"
        email_body = render_checkout_email(
            visitor_name=visitor_name,
            checkout_time=time_str
        )
        
        if visitor_email:
            try:
                send_email(visitor_email, subject, email_body, is_html=True)
            except Exception:
                pass
        try:
            send_email("anshverma24112005@gmail.com", subject, email_body, is_html=True)
        except Exception:
            pass
            
        whatsapp_msg = f"Hello {visitor_name},\n\nYou have been checked out successfully at {time_str}.\n\nVisit ID: {visit_id}\nThank you for visiting!"
        if visitor_phone:
            try:
                send_whatsapp(visitor_phone, whatsapp_msg)
            except Exception:
                pass
                
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def bg_send_approval_request(visit_id, host_email, host_name, visitor_name, mobile_number, organization, purpose, visit_date, department, base_url):
    from app.database.session import SessionLocal
    from app.api.approvals.routes import create_approval_token
    from app.utils.email_templates import render_approval_request_email
    from app.utils.email_service import send_email
    db = SessionLocal()
    try:
        token = create_approval_token(visit_id)
        approve_url = f"{base_url}/api/approve?request_id={visit_id}&token={token}"
        reject_url = f"{base_url}/api/reject?request_id={visit_id}&token={token}"
        
        email_body = render_approval_request_email(
            employee_name=host_name,
            visitor_name=visitor_name,
            mobile_number=mobile_number,
            organization=organization,
            purpose=purpose,
            visit_date=visit_date,
            department=department,
            approve_url=approve_url,
            reject_url=reject_url
        )
        
        send_email(
            recipient_email=host_email,
            subject="Visitor Approval Request",
            body=email_body,
            is_html=True
        )
    except Exception as e:
        print(f"Failed to send approval request: {e}")
    finally:
        db.close()