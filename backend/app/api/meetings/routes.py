from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import random
import string
import os
import qrcode
from datetime import datetime

from app.database.session import get_db
from app.models.meeting import Meeting
from app.models.user import User
from app.models.department import Department
from app.schemas.meeting import MeetingCreate, MeetingResponse
from app.security.dependencies import get_current_user
from app.services import telegram_service
from app.utils.badge_generator import generate_meeting_badge
from app.utils.audit import create_audit_log
from app.utils.email_service import send_email

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])

def get_current_ist_str():
    from app.utils.timezone import get_ist_now
    return get_ist_now().strftime("%Y-%m-%d %H:%M:%S")

@router.post("/", response_model=MeetingResponse)
def create_meeting(request: MeetingCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """Creates a new meeting request in PENDING state."""
    
    meeting = Meeting(
        title=request.title,
        purpose=request.purpose,
        description=request.description,
        meeting_type=request.meeting_type,
        scheduled_time=request.scheduled_time,
        end_time=request.end_time,
        location=request.location,
        host_employee=request.host_employee,
        host_department=request.host_department,
        expected_duration=request.expected_duration,
        
        visitor_name=request.visitor_name,
        company_name=request.company_name,
        visitor_email=request.visitor_email,
        visitor_mobile=request.visitor_mobile,
        visitor_aadhaar=request.visitor_aadhaar,
        visitor_photo_path=request.visitor_photo_path,
        visitor_designation=request.visitor_designation,
        number_of_attendees=request.number_of_attendees,
        
        aadhaar_doc_path=request.aadhaar_doc_path,
        company_id_doc_path=request.company_id_doc_path,
        authorization_letter_path=request.authorization_letter_path,
        business_card_path=request.business_card_path,
        company_documents_path=request.company_documents_path,
        
        status="PENDING",
        created_by_id=user.get("user_id")
    )
    
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # Audit log
    create_audit_log(
        db=db,
        user_email=user.get("sub"),
        action="MEETING_CREATED",
        visitor_id=None,
        employee_id=user.get("employee_id") or "SYSTEM"
    )
    
    # Telegram Notification for scheduled request
    dept_head_msg = (
        f"📅 <b>NEW MEETING REQUEST</b>\n\n"
        f"Meeting: {meeting.title}\n"
        f"Visitor: {meeting.visitor_name} ({meeting.company_name})\n"
        f"Host: {meeting.host_employee} ({meeting.host_department})\n"
        f"Status: PENDING\n\n"
        f"<i>Please review and recommend inside Visit Approvals.</i>"
    )
    telegram_service.send_department_notification(db, meeting.host_department, dept_head_msg, meeting.id)
    
    return meeting

@router.get("/", response_model=list[MeetingResponse])
def get_meetings(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """Lists meetings based on user role permissions."""
    role = user.get("role", "EMPLOYEE")

    if role in ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "SECURITY_GUARD", "SECURITY_SUPERVISOR"]:
        return db.query(Meeting).all()
    elif role in ["DEPARTMENT_HEAD", "DEPARTMENT_EXECUTIVE"]:
        # Get head's department name
        dept = db.query(Department).filter(Department.id == user.get("department_id")).first()
        dept_name = dept.name if dept else ""
        return db.query(Meeting).filter(Meeting.host_department.ilike(f"%{dept_name}%")).all()
    else:
        return db.query(Meeting).filter(Meeting.created_by_id == user.get("user_id")).all()


@router.put("/approve/{meeting_id}", response_model=MeetingResponse)
def approve_meeting(
    meeting_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Approves a meeting request.

    IGLGATE v3.0 Approval Chain:
    - PENDING → APPROVED
    - Approver: DEPARTMENT_HEAD (own dept only) | PLANT_ADMIN | CORPORATE_SUPER_ADMIN
    - SUPER_ADMIN is NOT in the daily approval chain.
    """
    from app.security.rbac import can_approve_meeting

    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting request not found")

    # Authorization check
    if not can_approve_meeting(user, meeting, db):
        raise HTTPException(
            status_code=403,
            detail="Only the host Department Head, Plant Admin, or Corporate Super Admin can approve this meeting"
        )

    if meeting.status not in ["PENDING"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve meeting in status: {meeting.status}"
        )

    # ── APPROVE ──────────────────────────────────────
    meeting.status = "APPROVED"

    # Generate approval number
    digits = "".join(random.choices(string.digits, k=6))
    meeting.approval_number = f"APP-MTG-{meeting.id}-{digits}"

    # Generate pass number  MTG/2024/000001
    from datetime import datetime as _dt
    year = _dt.utcnow().year
    meeting.pass_number = f"MTG/{year}/{meeting.id:06d}"

    db.commit()
    db.refresh(meeting)

    # Generate QR code
    qr_dir = "uploads/qrcodes"
    os.makedirs(qr_dir, exist_ok=True)
    qr_path = os.path.join(qr_dir, f"meeting_{meeting.id}.png")
    qr = qrcode.make(meeting.pass_number)
    qr.save(qr_path)

    # Generate PDF Badge
    badge_dir = "uploads/badges"
    os.makedirs(badge_dir, exist_ok=True)
    badge_path = generate_meeting_badge(meeting, qr_path)

    # Audit log
    create_audit_log(
        db=db,
        user_email=user.get("sub"),
        action="MEETING_APPROVED",
        visitor_id=None,
        employee_id=user.get("employee_id") or "SYSTEM"
    )

    # Send visitor email with pass
    def notify_visitor(email, name, date_str, pass_path):
        from app.utils.email_templates import render_approval_email
        if email:
            try:
                email_body = render_approval_email(name, date_str, meeting.host_employee)
                send_email(
                    recipient_email=email,
                    subject="IGL Meeting Confirmation & Entry Pass",
                    body=email_body,
                    attachment_path=pass_path,
                    is_html=True
                )
            except Exception as e:
                print(f"Failed to send email to visitor: {e}")

    date_str = meeting.scheduled_time.strftime("%Y-%m-%d %H:%M")
    approve_msg = (
        f"✅ <b>MEETING APPROVED</b>\n\n"
        f"Meeting: {meeting.title}\n"
        f"Visitor: {meeting.visitor_name} ({meeting.company_name})\n"
        f"Host: {meeting.host_employee} ({meeting.host_department})\n"
        f"Pass Number: {meeting.pass_number}\n"
        f"Room: {meeting.location or 'N/A'}\n"
        f"Date & Time: {date_str}\n"
        f"Approved By: {user.get('sub')} [{user.get('role')}]"
    )

    background_tasks.add_task(
        notify_visitor,
        email=meeting.visitor_email,
        name=meeting.visitor_name,
        date_str=date_str,
        pass_path=badge_path
    )

    # Telegram alerts
    telegram_service.send_department_notification(db, meeting.host_department, approve_msg, meeting.id)
    telegram_service.send_pass_notification(
        db=db,
        departments=[meeting.host_department, "SECURITY"],
        pass_path=badge_path,
        pass_number=meeting.pass_number,
        name=meeting.visitor_name,
        pass_type="MEETING PASS",
        target_id=meeting.id
    )

    return meeting


@router.put("/reject/{meeting_id}", response_model=MeetingResponse)
def reject_meeting(meeting_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """Rejects meeting request."""
    from app.security.rbac import can_approve_meeting

    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting request not found")

    if not can_approve_meeting(user, meeting, db):
        raise HTTPException(status_code=403, detail="Not enough permissions to reject this meeting request")

    meeting.status = "REJECTED"
    db.commit()
    db.refresh(meeting)

    create_audit_log(
        db=db,
        user_email=user.get("sub"),
        action="MEETING_REJECTED",
        visitor_id=None,
        employee_id=user.get("employee_id") or "SYSTEM"
    )

    reject_msg = f"❌ <b>MEETING REQUEST REJECTED</b>\n\nMeeting: {meeting.title}\nVisitor: {meeting.visitor_name}\nHost: {meeting.host_employee}\nRejected By: {user.get('sub')} [{user.get('role')}]"
    telegram_service.send_department_notification(db, meeting.host_department, reject_msg, meeting.id)

    return meeting


@router.post("/{meeting_id}/checkin")
def checkin_meeting(meeting_id: int, payload: dict, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """Security check-in scan for Meeting Visitors."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting pass not found")
        
    if meeting.status != "APPROVED":
        raise HTTPException(status_code=400, detail="Meeting is not approved or already processed")
        
    if meeting.check_in_time:
        raise HTTPException(status_code=400, detail="Already Checked-In")
        
    if meeting.end_time and datetime.utcnow() > meeting.end_time:
        raise HTTPException(status_code=400, detail="Pass Expired")
        
    gate = payload.get("gate_number", "Gate 1")
    meeting.check_in_time = datetime.utcnow()
    meeting.entry_gate = gate
    meeting.guard_name = user.get("sub")
    meeting.inside_plant = True
    meeting.status = "Checked-In"
    
    db.commit()
    db.refresh(meeting)
    
    # Audit log
    create_audit_log(
        db=db,
        user_email=user.get("sub"),
        action="MEETING_CHECK_IN",
        visitor_id=None,
        employee_id=user.get("employee_id") or "SECURITY"
    )
    
    # Telegram Check-in Alert
    time_str = get_current_ist_str()
    checkin_msg = (
        f"🟢 <b>MEETING VISITOR CHECKED IN</b>\n\n"
        f"Visitor: {meeting.visitor_name} ({meeting.company_name})\n"
        f"Pass Number: {meeting.pass_number}\n"
        f"Host: {meeting.host_employee}\n"
        f"Gate: {gate}\n"
        f"Check-In Time: {time_str}"
    )
    telegram_service.send_security_notification(db, checkin_msg, meeting.id)
    telegram_service.send_department_notification(db, meeting.host_department, checkin_msg, meeting.id)
    
    return {"success": True, "message": "Visitor checked in"}

@router.post("/{meeting_id}/checkout")
def checkout_meeting(meeting_id: int, payload: dict, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """Security check-out scan for Meeting Visitors."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting pass not found")
        
    if not meeting.check_in_time:
        raise HTTPException(status_code=400, detail="Cannot check out: Not Checked-In yet")
        
    if meeting.check_out_time:
        raise HTTPException(status_code=400, detail="Already Checked-Out")
        
    gate = payload.get("gate_number", "Gate 1")
    meeting.check_out_time = datetime.utcnow()
    meeting.exit_gate = gate
    meeting.exit_guard_name = user.get("sub")
    meeting.inside_plant = False
    meeting.status = "Checked-Out"
    
    # Calculate duration
    if meeting.check_in_time:
        diff = meeting.check_out_time - meeting.check_in_time
        meeting.duration_minutes = int(diff.total_seconds() / 60)
        
    db.commit()
    db.refresh(meeting)
    
    # Audit log
    create_audit_log(
        db=db,
        user_email=user.get("sub"),
        action="MEETING_CHECK_OUT",
        visitor_id=None,
        employee_id=user.get("employee_id") or "SECURITY"
    )
    
    # Telegram Check-out Alert
    time_str = get_current_ist_str()
    checkout_msg = (
        f"🔴 <b>MEETING VISITOR CHECKED OUT</b>\n\n"
        f"Visitor: {meeting.visitor_name}\n"
        f"Pass Number: {meeting.pass_number}\n"
        f"Gate: {gate}\n"
        f"Check-Out Time: {time_str}\n"
        f"Duration: {meeting.duration_minutes} mins"
    )
    telegram_service.send_security_notification(db, checkout_msg, meeting.id)
    telegram_service.send_department_notification(db, meeting.host_department, checkout_msg, meeting.id)
    
    return {"success": True, "message": "Visitor checked out"}
