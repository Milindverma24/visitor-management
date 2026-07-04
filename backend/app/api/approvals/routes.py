from fastapi import APIRouter, Depends, Request, Query, BackgroundTasks
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
from jose import jwt, JWTError

from app.database.session import get_db
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.models.user import User
from app.core.config import settings
from app.utils.audit import create_audit_log
from app.utils.qr_generator import generate_qr
from app.utils.badge_generator import generate_badge
from app.api.websockets import sync_broadcast
from app.api.visitors.routes import bg_approval_notifications, bg_rejection_notifications
from app.utils.timezone import to_ist, get_ist_now

router = APIRouter()

def create_approval_token(visit_id: int):
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"sub": str(visit_id), "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_approval_token(token: str, request_id: int):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_visit_id = int(payload.get("sub"))
        if token_visit_id != request_id:
            return False
        return True
    except JWTError:
        return False

# Basic HTML template for response
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Visitor Request Processed</title>
    <style>
        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; text-align: center; padding: 50px; }}
        .container {{ max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        h1 {{ font-size: 24px; color: #333; }}
        .success {{ color: #10b981; }}
        .error {{ color: #ef4444; }}
        .info {{ color: #3b82f6; }}
    </style>
</head>
<body>
    <div class="container">
        <h1 class="{status_class}">{title}</h1>
        <p>{message}</p>
    </div>
</body>
</html>
"""

@router.get("/api/approve", response_class=HTMLResponse)
def approve_visit_email(
    request_id: int,
    token: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if not verify_approval_token(token, request_id):
        return HTML_TEMPLATE.format(status_class="error", title="Invalid Token", message="The approval token is invalid or expired.")

    # Atomic update with where clause
    visit = db.query(Visit).filter(Visit.id == request_id).first()
    
    if not visit:
        return HTML_TEMPLATE.format(status_class="error", title="Not Found", message="Visit request not found.")

    if visit.status != "PENDING":
        return HTML_TEMPLATE.format(status_class="info", title="Already Processed", message="This request has already been processed.")

    # Atomic Update
    visit.status = "APPROVED"
    visit.approved_by = visit.host_employee
    visit.approved_at = datetime.utcnow()
    
    # Valid up to
    if not visit.valid_up_to and visit.arrival_date:
        visit.valid_up_to = visit.arrival_date.replace(hour=23, minute=59, second=59)
    elif not visit.valid_up_to:
        visit.valid_up_to = datetime.utcnow().replace(hour=23, minute=59, second=59)

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
    qr_base64 = generate_qr(visit.id)
    badge_base64 = generate_badge(
        visit=visit,
        visitor=visitor,
        qr_path=qr_base64,
        company_logo="app/static/company_logo.png"
    )
    
    visit.qr_code_base64 = qr_base64
    visit.badge_pdf_base64 = badge_base64
    
    # Get employee ID for audit
    host_user = db.query(User).filter(User.full_name == visit.host_employee).first() # Fallback if host_employee stores name or email
    if not host_user:
         host_user = db.query(User).filter(User.email == visit.host_employee).first()
         
    emp_id = host_user.employee_id if host_user and host_user.employee_id else "SYSTEM"

    create_audit_log(
        db=db,
        user_email=visit.host_employee,
        action="EMAIL_APPROVED_VISIT",
        visitor_id=visit.visitor_id,
        employee_id=emp_id
    )

    db.commit()

    # Notifications
    dept_name = visit.department.name if visit.department else "Unknown"
    background_tasks.add_task(
        bg_approval_notifications,
        visitor_email=visitor.email if visitor else None,
        visitor_name=visitor.full_name if visitor else "Unknown",
        visit_date=to_ist(visit.created_at).strftime("%Y-%m-%d %H:%M") if (visit.created_at) else get_ist_now().strftime("%Y-%m-%d %H:%M"),
        host_name=visit.host_employee,
        badge_path=badge_base64,
        dept_name=dept_name,
        visit_id=visit.id,
        card_id=visit.card_id
    )

    sync_broadcast("VISIT_APPROVED", {"visit_id": visit.id, "status": "APPROVED"})

    return HTML_TEMPLATE.format(status_class="success", title="Request Approved", message=f"Visit request #{request_id} has been successfully approved.")


@router.get("/api/reject", response_class=HTMLResponse)
def reject_visit_email(
    request_id: int,
    token: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if not verify_approval_token(token, request_id):
        return HTML_TEMPLATE.format(status_class="error", title="Invalid Token", message="The rejection token is invalid or expired.")

    visit = db.query(Visit).filter(Visit.id == request_id).first()
        
    if not visit:
        return HTML_TEMPLATE.format(status_class="error", title="Not Found", message="Visit request not found.")

    if visit.status != "PENDING":
        return HTML_TEMPLATE.format(status_class="info", title="Already Processed", message="This request has already been processed.")

    visit.status = "REJECTED"
    visit.rejection_reason = "Rejected By Employee via Email"
    # We can store rejected_by in a generic field or audit log since visit model might not have rejected_by
    
    host_user = db.query(User).filter(User.full_name == visit.host_employee).first()
    if not host_user:
         host_user = db.query(User).filter(User.email == visit.host_employee).first()
         
    emp_id = host_user.employee_id if host_user and host_user.employee_id else "SYSTEM"

    create_audit_log(
        db=db,
        user_email=visit.host_employee,
        action="EMAIL_REJECTED_VISIT",
        visitor_id=visit.visitor_id,
        employee_id=emp_id
    )

    db.commit()

    visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
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

    return HTML_TEMPLATE.format(status_class="success", title="Request Rejected", message=f"Visit request #{request_id} has been rejected.")
