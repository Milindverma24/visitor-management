from fastapi import APIRouter, Depends, Request
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
from fastapi import Request
from app.utils.audit import create_audit_log
from app.utils.qr_generator import generate_qr
from app.utils.badge_generator import generate_badge
from app.utils.email_service import send_email
from app.utils.email_templates import render_approval_email, render_checkin_email, render_checkout_email
from app.utils.whatsapp_service import send_whatsapp
from app.services import telegram_service

from fastapi import UploadFile
from fastapi import File
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

    os.makedirs(
        "uploads/visitor_photos",
        exist_ok=True
    )

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
        "photo_path": file_path
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
    import os
    import time
    
    photo_path = None
    if request.photo_base64:
        try:
            # Strip data url prefix if present
            base64_data = request.photo_base64
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]
            
            os.makedirs("uploads/photos", exist_ok=True)
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

##################################################
# CREATE VISIT REQUEST
##################################################

@router.post("/visit")
def create_visit(
    request: VisitCreate
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
        blacklist_msg = f"🚨 <b>SECURITY ALERT</b>\n\n<b>BLACKLISTED VISITOR DETECTED</b>\n\nVisitor: {visitor.full_name}\nPhone: {visitor.phone_number}\nDepartment: {request.department}\nTime: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}\n\nSecurity Verification Required"
        telegram_service.send_security_notification(db, blacklist_msg, visitor.id)

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
        accompanied_by_count=request.accompanied_by_count
    )

    db.add(visit)
    db.commit()
    db.refresh(visit)
    
    # Generate simple Card ID based on visit ID
    visit.card_id = f"VM/{visit.id:06d}"
    db.commit()
    db.refresh(visit)
    
    # Telegram Photo Notification (if visitor has a photo)
    if visitor.photo_path:
        # Assuming photo_path has a leading slash in DB, e.g., /uploads/photos/...
        # we need relative path for telegram_service
        local_photo_path = visitor.photo_path.lstrip("/")
        telegram_service.send_visitor_photo(
            db=db,
            department=request.department or "Unknown",
            photo_path=local_photo_path,
            name=visitor.full_name,
            purpose=visit.purpose,
            target_id=visit.id
        )

    return {
        "success": True,
        "visit_id": visit.id,
        "status": visit.status,
        "message": "Visit Request Created"
    }

##################################################

# GET ALL VISITS

##################################################

@router.get("/visits")
def get_all_visits(user: dict = Depends(get_current_user)):

    db: Session = SessionLocal()

    query = db.query(Visit)

    role = user.get("role", "EMPLOYEE")
    
    if role in ["SUPER_ADMIN", "ADMIN"]:
        # See all
        pass
    elif role == "DEPARTMENT_HEAD":
        # See only department's visits
        dept_id = user.get("department_id")
        query = query.filter(Visit.department_id == dept_id)
    elif role == "SECURITY":
        # See only today's visits
        today = datetime.utcnow().date()
        query = query.filter(func.date(Visit.created_at) == today)
    elif role == "HR_MANAGER":
        # HR sees interviews, but Visit model is separate from Interview model now.
        # Maybe they see nothing here, or only visits where pass_type == INTERVIEW_PASS.
        query = query.filter(Visit.pass_type == "INTERVIEW_PASS")
    else:
        # EMPLOYEE sees only their own hosted visitors
        query = query.filter(Visit.host_employee == user.get("sub"))

    visits = query.all()

    return visits

##################################################
# APPROVE VISIT
##################################################

@router.put("/approve/{visit_id}")
def approve_visit(
    visit_id: int,
    request: Request
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

    visit.status = "APPROVED"
    visit.approved_by = "Milind Verma"
    visit.approved_at = datetime.utcnow()

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
        company_logo="uploads/company_logo.png"
    )

    create_audit_log(
        db=db,
        user_email="milind1@example.com",
        action="APPROVED_VISIT",
        visit_id=visit.id,
        ip_address=request.client.host
    )

    ##################################################
    # SEND APPROVAL EMAIL
    ##################################################

    visitor = db.query(
        Visitor
    ).filter(
        Visitor.id == visit.visitor_id
    ).first()

    if visitor and visitor.email:
        try:
            email_body = render_approval_email(
                visitor_name=visitor.full_name,
                visit_date=visit.created_at.strftime("%Y-%m-%d %H:%M") if visit.created_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
                host_name=visit.host_employee
            )
            send_email(
                recipient_email=visitor.email,
                subject="Your Visit is Approved - IGL",
                body=email_body,
                attachment_path=badge_path,
                is_html=True
            )
        except Exception as e:
            pass

    db.refresh(visit)

    # Telegram Approval Notifications
    dept_name = visit.department.name if visit.department else "Unknown"
    approve_msg = f"✅ <b>VISITOR APPROVED</b>\n\nVisitor Name: {visitor.full_name}\nDepartment: {dept_name}\nHost Employee: {visit.host_employee}\nVisit ID: {visit.id}\nPass Type: {visit.pass_type or 'Standard'}\nDate: {datetime.utcnow().strftime('%Y-%m-%d')}\nTime: {datetime.utcnow().strftime('%H:%M:%S')}"
    
    telegram_service.send_admin_notification(db, approve_msg, visit.id)
    telegram_service.send_department_notification(db, dept_name, approve_msg, visit.id)
    
    # Telegram Pass Generation Notification
    if badge_path:
        telegram_service.send_pass_notification(
            db=db,
            department=dept_name,
            pass_path=badge_path,
            pass_number=visit.card_id or str(visit.id),
            name=visitor.full_name,
            pass_type=visit.pass_type or "Standard",
            target_id=visit.id
        )

    return {
        "success": True,
        "message": "Visit Approved",
        "qr_code": qr_path,
        "badge": badge_path
    }
##################################################
# REJECT VISIT
##################################################

@router.put("/reject/{visit_id}")
def reject_visit(
    visit_id: int,
    request: Request
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

    create_audit_log(
        db=db,
        user_email="milind1@example.com",
        action="REJECTED_VISIT",
        visit_id=visit.id,
        ip_address=request.client.host
    )

    ##################################################
    # SEND REJECTION EMAIL
    ##################################################

    visitor = db.query(
        Visitor
    ).filter(
        Visitor.id == visit.visitor_id
    ).first()

    if visitor and visitor.email:

        send_email(
            visitor.email,
            "Visit Request Rejected",
            f"""
Hello {visitor.full_name},

We regret to inform you that your visit request has been rejected.

Visit ID: {visit.id}

Host Employee:
{visit.host_employee}

Reason:
{visit.rejection_reason}

Please contact the concerned employee for more details.

Thank You,
Visitor Management Team
            """
        )

    db.commit()
    
    # Telegram Rejection Notification
    dept_name = visit.department.name if visit.department else "Unknown"
    reject_msg = f"❌ <b>VISITOR REJECTED</b>\n\nVisitor: {visitor.full_name if visitor else 'Unknown'}\nDepartment: {dept_name}\nReason: {visit.rejection_reason}"
    telegram_service.send_department_notification(db, dept_name, reject_msg, visit.id)

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
    request: Request
):

    db: Session = SessionLocal()

    visit = db.query(Visit).filter(
        Visit.id == visit_id
    ).first()

    if not visit:

        return {
            "success": False,
            "message": "Visit Not Found"
        }

    if visit.status != "APPROVED":

        return {
            "success": False,
            "message": "Visit Not Approved"
        }

    visit.check_in_time = datetime.utcnow()
    visit.checked_in_by = "Security Guard 1"
    visit.gate_number = "Gate-1"

    create_audit_log(
        db=db,
        user_email="security@company.com",
        action="CHECK_IN",
        visit_id=visit.id,
        ip_address=request.client.host
    )

    db.commit()

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    if visitor:
        time_str = visit.check_in_time.strftime('%Y-%m-%d %H:%M:%S')
        subject = f"Visitor Checked In: {visitor.full_name}"
        
        email_body = render_checkin_email(
            visitor_name=visitor.full_name,
            checkin_time=time_str,
            host_name=visit.host_employee
        )
        
        # Send to visitor
        if visitor.email:
            send_email(visitor.email, subject, email_body, is_html=True)
            
        # Send to security desk
        send_email("security@company.com", subject, email_body, is_html=True)
        
    # Telegram Check-In Alert
    dept_name = visit.department.name if visit.department else "Unknown"
    visitor_name = visitor.full_name if visitor else "Unknown"
    checkin_msg = f"🟢 <b>VISITOR CHECKED IN</b>\n\nVisitor: {visitor_name}\nDepartment: {dept_name}\nGate: {visit.gate_number}\nCheck-In Time: {visit.check_in_time.strftime('%H:%M:%S') if visit.check_in_time else 'Unknown'}"
    telegram_service.send_security_notification(db, checkin_msg, visit.id)
    telegram_service.send_department_notification(db, dept_name, checkin_msg, visit.id)

    return {
        "success": True,
        "message": "Visitor Checked In"
    }
##################################################
# CHECK OUT VISITOR
##################################################

@router.put("/checkout/{visit_id}")
def checkout_visitor(
    visit_id: int,
    request: Request
):

    db: Session = SessionLocal()

    visit = db.query(Visit).filter(
        Visit.id == visit_id
    ).first()

    if not visit:

        return {
            "success": False,
            "message": "Visit Not Found"
        }

    visit.check_out_time = datetime.utcnow()
    visit.checked_out_by = "Security Guard 1"

    create_audit_log(
        db=db,
        user_email="security@company.com",
        action="CHECK_OUT",
        visit_id=visit.id,
        ip_address=request.client.host
    )

    db.commit()

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    if visitor:
        time_str = visit.check_out_time.strftime('%Y-%m-%d %H:%M:%S')
        subject = f"Visitor Checked Out: {visitor.full_name}"
        
        email_body = render_checkout_email(
            visitor_name=visitor.full_name,
            checkout_time=time_str
        )
        
        # Send to visitor
        if visitor.email:
            send_email(visitor.email, subject, email_body, is_html=True)
            
        # Send to security desk
        send_email("security@company.com", subject, email_body, is_html=True)
        
        # WhatsApp notification
        message = f"Hello {visitor.full_name},\n\nYou have been checked out successfully at {time_str}.\n\nVisit ID: {visit.id}\nThank you for visiting!"
        if visitor.phone_number:
            send_whatsapp(visitor.phone_number, message)
            
    # Telegram Check-Out Alert
    dept_name = visit.department.name if visit.department else "Unknown"
    visitor_name = visitor.full_name if visitor else "Unknown"
    checkout_msg = f"🔴 <b>VISITOR CHECKED OUT</b>\n\nVisitor: {visitor_name}\nDepartment: {dept_name}\nGate: {visit.gate_number or 'Unknown'}\nCheck-Out Time: {visit.check_out_time.strftime('%H:%M:%S') if visit.check_out_time else 'Unknown'}"
    telegram_service.send_security_notification(db, checkout_msg, visit.id)
    telegram_service.send_department_notification(db, dept_name, checkout_msg, visit.id)

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

    db.commit()

    return {
        "success": True,
        "message": "Visitor Blacklisted"
    }