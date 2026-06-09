from fastapi import APIRouter, Depends, Request, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import SessionLocal
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
from app.services import telegram_service
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



    file_path = os.path.join(
        "uploads",
        "visitor_photos",
        file.filename
    )

    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    return {
        "success": True,
        "photo_path": f"/{file_path}"
    }

##################################################
# UPLOAD VISITOR/CANDIDATE DOCUMENT
##################################################

@router.post("/upload-doc")
async def upload_document(
    file: UploadFile = File(...)
):
    import time
    ext = os.path.splitext(file.filename)[1].lower()
    if ext in [".jpg", ".jpeg", ".png"]:
        folder = "uploads/photos"
    else:
        folder = "uploads/documents"
        
    os.makedirs(folder, exist_ok=True)
    safe_filename = f"{int(time.time())}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(folder, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {
        "success": True,
        "file_path": f"/{file_path}"
    }
##################################################
# REGISTER VISITOR
##################################################

@router.post("/")
def create_visitor(
    request: VisitorCreate
):

    db: Session = SessionLocal()

    import base64
    import time
    
    photo_path = None
    if request.photo_base64:
        try:
            # Strip data url prefix if present
            base64_data = request.photo_base64
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]
            

            photo_filename = f"visitor_{int(time.time())}.jpg"
            photo_path = os.path.join("uploads/photos", photo_filename)
            
            with open(photo_path, "wb") as f:
                f.write(base64.b64decode(base64_data))
                
            photo_path = f"/{photo_path}" # Add leading slash for frontend
        except Exception as e:
            print(f"Failed to save photo: {e}")

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
def get_visitors():

    db: Session = SessionLocal()

    visitors = db.query(
        Visitor
    ).all()

    return visitors

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

    return {
        "success": True,
        "visitor": {
            "id": visitor.id,
            "full_name": visitor.full_name,
            "phone_number": visitor.phone_number,
            "email": visitor.email,
            "company": visitor.company,
            "purpose": visitor.purpose,
            "id_type": visitor.id_type,
            "id_number": visitor.id_number
        }
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
    background_tasks: BackgroundTasks
):

    db: Session = SessionLocal()

    visitor = db.query(Visitor).filter(
        Visitor.id == request.visitor_id
    ).first()

    if not visitor:

        return {
            "success": False,
            "message": "Visitor Not Found"
        }
    if visitor.is_blacklisted:
        
        # Telegram Blacklist Alert
        blacklist_msg = f"🚨 <b>SECURITY ALERT</b>\n\n<b>BLACKLISTED VISITOR DETECTED</b>\n\nVisitor: {visitor.full_name}\nPhone: {visitor.phone_number}\nDepartment: {request.department}\nTime: {get_ist_now().strftime('%Y-%m-%d %H:%M:%S')}\n\nSecurity Verification Required"
        background_tasks.add_task(bg_blacklist_alert, blacklist_msg, visitor.id)

        return {
            "success": False,
            "message": "Visitor is Blacklisted"
        }
    # Look up department by name to get the ID
    dept = None
    if request.department:
        dept = db.query(Department).filter(Department.name == request.department).first()

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
        pass_type=request.pass_type or "VISITOR_PASS"
    )

    db.add(visit)
    db.commit()
    db.refresh(visit)
    
    # Generate simple Card ID based on visit ID
    if visit.pass_type == "VENDOR_PASS":
        visit.card_id = f"TRP/{visit.id:06d}"
    else:
        visit.card_id = f"VM/{visit.id:06d}"
    db.commit()
    db.refresh(visit)
    
    # Telegram Photo Notification (if visitor has a photo)
    if visitor.photo_path:
        local_photo_path = visitor.photo_path.lstrip("/")
        background_tasks.add_task(
            bg_visitor_photo,
            department=request.department or "Unknown",
            photo_path=local_photo_path,
            name=visitor.full_name,
            purpose=visit.purpose,
            target_id=visit.id
        )
        
    def bg_visit_request_alert(visitor_name, host_employee, purpose, dept_name, visit_id):
        from app.database.session import SessionLocal
        from app.services import telegram_service
        from app.utils.timezone import get_ist_now
        db_session = SessionLocal()
        try:
            alert_msg = f"⏳ <b>NEW PASS REQUEST PENDING</b>\n\nVisitor: {visitor_name}\nDepartment: {dept_name}\nHost: {host_employee}\nPurpose: {purpose}\nTime: {get_ist_now().strftime('%Y-%m-%d %H:%M:%S')}\n\n<i>Please review and approve in the Admin Dashboard.</i>"
            telegram_service.send_admin_notification(db_session, alert_msg, visit_id)
            if dept_name != "Unknown":
                telegram_service.send_department_notification(db_session, dept_name, alert_msg, visit_id)
        finally:
            db_session.close()

    background_tasks.add_task(
        bg_visit_request_alert,
        visitor_name=visitor.full_name,
        host_employee=request.host_employee,
        purpose=visit.purpose,
        dept_name=request.department or "Unknown",
        visit_id=visit.id
    )

    sync_broadcast("NEW_VISIT", {
        "visit_id": visit.id,
        "visitor_name": visitor.full_name,
        "department": request.department or "Unknown"
    })

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
def get_all_visits(user: dict = Depends(get_current_user)):

    db: Session = SessionLocal()

    query = db.query(Visit)

    role = user.get("role", "EMPLOYEE")

    if role in ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"]:
        # Full visibility — no filter
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
        # HR sees interview passes only
        query = query.filter(Visit.pass_type == "INTERVIEW_PASS")
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
        # EMPLOYEE sees only their own hosted visitors
        query = query.filter(Visit.host_employee == user.get("sub"))

    visits = query.all()

    # Dynamically update status to EXPIRED if valid_up_to has passed and not checked in
    current_time = datetime.utcnow()
    for v in visits:
        if v.status == "APPROVED" and v.check_in_time is None and v.valid_up_to and current_time > v.valid_up_to:
            v.status = "EXPIRED"

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
    - Approver: DEPARTMENT_HEAD (scoped to host dept) | PLANT_ADMIN | CORPORATE_SUPER_ADMIN
    - EMPLOYEE and RECEPTIONIST cannot approve.
    - Department Head can only approve visits for their own department.
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
            "message": "Access Denied: You do not have authority to approve this visit. Only the Department Head of the host department, Plant Admin, or Corporate Super Admin can approve."
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

def bg_blacklist_alert(blacklist_msg, visitor_id):
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        telegram_service.send_security_notification(db, blacklist_msg, visitor_id)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def bg_visitor_photo(department, photo_path, name, purpose, target_id):
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        telegram_service.send_visitor_photo(db, department, photo_path, name, purpose, target_id)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


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
                    attachment_path=badge_path,
                    is_html=True
                )
            except Exception:
                pass
        
        from app.models.visit import Visit
        from app.models.visitor import Visitor
        from app.models.vehicle import Vehicle
        import re
        
        # Check if there is a vehicle associated with this visit (Transporter Pass)
        visit = db.query(Visit).filter(Visit.id == visit_id).first()
        vehicle_details = ""
        pass_type_str = "Standard"
        
        if visit and visit.pass_type == "VENDOR_PASS":
            pass_type_str = "Transporter/Vehicle"
            
            # Try to extract Vehicle Number from purpose like "[DL 1M 1234] - MATERIAL DELIVERY"
            match = re.search(r'\[(.*?)\]', visit.purpose)
            vehicle_number = match.group(1) if match else None
            
            if vehicle_number:
                vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == vehicle_number).first()
                if vehicle:
                    vehicle_details = f"\n🚚 <b>VEHICLE DETAILS</b>\nNumber: {vehicle.vehicle_number}\nType: {vehicle.vehicle_type}\nCompany: {vehicle.transport_company or 'N/A'}"
        
        approve_msg = f"✅ <b>VISITOR APPROVED</b>\n\nVisitor Name: {visitor_name}\nDepartment: {dept_name}\nHost Employee: {host_name}\nVisit ID: {visit_id}\nPass Type: {pass_type_str}\nDate: {get_ist_now().strftime('%Y-%m-%d')}\nTime: {get_ist_now().strftime('%H:%M:%S')}{vehicle_details}"
        
        telegram_service.send_admin_notification(db, approve_msg, visit_id)
        telegram_service.send_department_notification(db, dept_name, approve_msg, visit_id)
        
        if badge_path:
            telegram_service.send_pass_notification(
                db=db,
                departments=[dept_name, "SECURITY"],
                pass_path=badge_path,
                pass_number=card_id or str(visit_id),
                name=visitor_name,
                pass_type=pass_type_str,
                target_id=visit_id
            )
            
            # Email the guard
            from app.core.config import settings
            if settings.EMAIL_USER:
                try:
                    guard_email = os.getenv("GUARD_EMAIL", "guard@igl.co.in")
                    send_email(
                        recipient_email=guard_email,
                        subject=f"NEW ENTRY PASS: {visitor_name}",
                        body=email_body,
                        attachment_path=badge_path,
                        is_html=True
                    )
                except Exception as e:
                    print(f"Failed to email guard: {e}")
        db.commit()
    except Exception:
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
        reject_msg = f"❌ <b>VISITOR REJECTED</b>\n\nVisitor: {visitor_name}\nDepartment: {dept_name}\nReason: {rejection_reason}"
        telegram_service.send_department_notification(db, dept_name, reject_msg, visit_id)
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
            
        checkin_msg = f"🟢 <b>VISITOR CHECKED IN</b>\n\nVisitor: {visitor_name}\nDepartment: {dept_name}\nGate: {gate_number}\nCheck-In Time: {time_str}"
        telegram_service.send_security_notification(db, checkin_msg, visit_id)
        telegram_service.send_department_notification(db, dept_name, checkin_msg, visit_id)
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
                
        checkout_msg = f"🔴 <b>VISITOR CHECKED OUT</b>\n\nVisitor: {visitor_name}\nDepartment: {dept_name}\nGate: {gate_number or 'Unknown'}\nCheck-Out Time: {time_str}"
        telegram_service.send_security_notification(db, checkout_msg, visit_id)
        telegram_service.send_department_notification(db, dept_name, checkout_msg, visit_id)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()