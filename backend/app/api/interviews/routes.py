from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import random
import string
import os
import qrcode
from datetime import datetime

from app.database.session import get_db
from app.models.interview import Interview
from app.models.user import User
from app.models.department import Department
from app.schemas.interview import InterviewCreate, InterviewResponse
from app.security.dependencies import get_current_user, RoleChecker
from app.services import telegram_service
from app.utils.badge_generator import generate_interview_badge
from app.utils.audit import create_audit_log
from app.utils.email_service import send_email

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])

def get_current_ist_str():
    # Return current time for notifications
    from app.utils.timezone import get_ist_now
    return get_ist_now().strftime("%Y-%m-%d %H:%M:%S")

@router.post("/", response_model=InterviewResponse)
def create_interview(request: InterviewCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """Creates a new interview request in PENDING state."""
    
    # Authorized roles: HR_MANAGER, HR_EXECUTIVE, DEPARTMENT_HEAD, SUPER_ADMIN, ADMIN, EMPLOYEE
    # Logged-in is enough since get_current_user enforces it.
    
    interview = Interview(
        candidate_name=request.candidate_name,
        candidate_email=request.candidate_email,
        candidate_mobile=request.candidate_mobile,
        candidate_aadhaar=request.candidate_aadhaar,
        candidate_address=request.candidate_address,
        candidate_photo_path=request.candidate_photo_path,
        
        position=request.position,
        department=request.department,
        interview_type=request.interview_type,
        scheduled_time=request.scheduled_time,
        interview_location=request.interview_location,
        interviewer_name=request.interviewer_name,
        interviewer_employee_id=request.interviewer_employee_id,
        
        resume_path=request.resume_path,
        aadhaar_doc_path=request.aadhaar_doc_path,
        educational_certificates_path=request.educational_certificates_path,
        experience_documents_path=request.experience_documents_path,
        offer_letter_path=request.offer_letter_path,
        
        status="PENDING",
        host_id=user.get("user_id")
    )
    
    db.add(interview)
    db.commit()
    db.refresh(interview)
    
    # Audit log
    create_audit_log(
        db=db,
        user_email=user.get("sub"),
        action="INTERVIEW_CREATED",
        visitor_id=None,
        employee_id=user.get("employee_id") or "SYSTEM"
    )
    
    # Telegram Notification for scheduled request
    dept_head_msg = (
        f"🎯 <b>NEW INTERVIEW REQUEST</b>\n\n"
        f"Candidate: {interview.candidate_name}\n"
        f"Position: {interview.position}\n"
        f"Department: {interview.department}\n"
        f"Type: {interview.interview_type}\n"
        f"Host HR: {user.get('sub')}\n"
        f"Status: PENDING\n\n"
        f"<i>Please review and recommend inside Visit Approvals.</i>"
    )
    telegram_service.send_hr_notification(db, dept_head_msg, interview.id)
    
    return interview

@router.get("/", response_model=list[InterviewResponse])
def get_interviews(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """Lists interviews based on user role permissions."""
    role = user.get("role", "EMPLOYEE")

    if role in ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "HR_MANAGER", "HR_EXECUTIVE", "SECURITY_GUARD", "SECURITY_SUPERVISOR"]:
        # Full access to all interview records
        return db.query(Interview).all()
    elif role == "DEPARTMENT_HEAD":
        # Dept Head sees interviews for their department only
        dept = db.query(Department).filter(Department.id == user.get("department_id")).first()
        dept_name = dept.name if dept else ""
        return db.query(Interview).filter(Interview.department.ilike(f"%{dept_name}%")).all()
    else:
        # Others see only interviews they created
        return db.query(Interview).filter(Interview.host_id == user.get("user_id")).all()

@router.put("/approve/{interview_id}", response_model=InterviewResponse)
def approve_interview(
    interview_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Approves an interview request.

    IGLGATE v3.0 Approval Chain:
    - PENDING → APPROVED (via HR_MANAGER, PLANT_ADMIN, or CORPORATE_SUPER_ADMIN)

    HR_EXECUTIVE can create interviews but CANNOT approve them.
    DEPARTMENT_HEAD cannot approve interviews (interviews are HR-exclusive).
    Super Admin is NOT in the daily approval chain.
    """
    from app.security.rbac import can_approve_interview

    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview request not found")

    # Authorization check
    if not can_approve_interview(user, interview, db):
        raise HTTPException(
            status_code=403,
            detail="Only HR Manager, Plant Admin, or Corporate Super Admin can approve interviews"
        )

    if interview.status not in ["PENDING"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve interview in status: {interview.status}"
        )

    # ── APPROVE ──────────────────────────────────────
    interview.status = "APPROVED"

    # Generate approval number
    digits = "".join(random.choices(string.digits, k=6))
    interview.approval_number = f"APP-INT-{interview.id}-{digits}"

    # Generate pass number  INT/2024/000001
    from datetime import datetime as _dt
    year = _dt.utcnow().year
    interview.pass_number = f"INT/{year}/{interview.id:06d}"

    db.commit()
    db.refresh(interview)

    # Generate QR code
    qr_dir = "uploads/qrcodes"
    os.makedirs(qr_dir, exist_ok=True)
    qr_path = os.path.join(qr_dir, f"interview_{interview.id}.png")
    qr = qrcode.make(interview.pass_number)
    qr.save(qr_path)

    # Generate PDF Badge
    badge_dir = "uploads/badges"
    os.makedirs(badge_dir, exist_ok=True)
    badge_path = generate_interview_badge(interview, qr_path)

    # Audit log
    create_audit_log(
        db=db,
        user_email=user.get("sub"),
        action="INTERVIEW_APPROVED",
        visitor_id=None,
        employee_id=user.get("employee_id") or "SYSTEM"
    )

    # Send candidate email with pass
    def notify_candidate(email, name, date_str, pass_path):
        from app.utils.email_templates import render_approval_email
        if email:
            try:
                email_body = render_approval_email(name, date_str, interview.interviewer_name)
                send_email(
                    recipient_email=email,
                    subject="IGL Interview Invitation & Entry Pass",
                    body=email_body,
                    attachment_path=pass_path,
                    is_html=True
                )
            except Exception as e:
                print(f"Failed to send email to candidate: {e}")

    date_str = interview.scheduled_time.strftime("%Y-%m-%d %H:%M")
    approve_msg = (
        f"✅ <b>INTERVIEW APPROVED</b>\n\n"
        f"Candidate: {interview.candidate_name}\n"
        f"Position: {interview.position}\n"
        f"Department: {interview.department}\n"
        f"Pass Number: {interview.pass_number}\n"
        f"Interviewer: {interview.interviewer_name}\n"
        f"Date & Time: {date_str}\n"
        f"Approved By: {user.get('sub')} [{user.get('role')}]"
    )

    background_tasks.add_task(
        notify_candidate,
        email=interview.candidate_email,
        name=interview.candidate_name,
        date_str=date_str,
        pass_path=badge_path
    )

    # Telegram alerts
    telegram_service.send_hr_notification(db, approve_msg, interview.id)
    telegram_service.send_pass_notification(
        db=db,
        departments=["HUMAN RESOURCES", "SECURITY"],
        pass_path=badge_path,
        pass_number=interview.pass_number,
        name=interview.candidate_name,
        pass_type="INTERVIEW PASS",
        target_id=interview.id
    )

    return interview

@router.put("/reject/{interview_id}", response_model=InterviewResponse)
def reject_interview(interview_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """Rejects interview request."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview request not found")
        
    role = user.get("role", "EMPLOYEE")
    if role not in ["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "HR_EXECUTIVE", "DEPARTMENT_HEAD"]:
        raise HTTPException(status_code=403, detail="Not enough permissions to reject requests")
        
    interview.status = "REJECTED"
    db.commit()
    db.refresh(interview)
    
    # Audit log
    create_audit_log(
        db=db,
        user_email=user.get("sub"),
        action="INTERVIEW_REJECTED",
        visitor_id=None,
        employee_id=user.get("employee_id") or "SYSTEM"
    )
    
    # Telegram Notification
    reject_msg = f"❌ <b>INTERVIEW REQUEST REJECTED</b>\n\nCandidate: {interview.candidate_name}\nPosition: {interview.position}\nDepartment: {interview.department}\nStatus: REJECTED"
    telegram_service.send_hr_notification(db, reject_msg, interview.id)
    
    return interview

@router.post("/{interview_id}/checkin")
def checkin_interview(interview_id: int, payload: dict, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """Security check-in scan for Interview Candidates."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview pass not found")
        
    if interview.status != "APPROVED":
        raise HTTPException(status_code=400, detail="Interview is not approved or already processed")
        
    if interview.check_in_time:
        raise HTTPException(status_code=400, detail="Already Checked-In")
        
    gate = payload.get("gate_number", "Gate 1")
    interview.check_in_time = datetime.utcnow()
    interview.entry_gate = gate
    interview.guard_name = user.get("sub")
    interview.inside_plant = True
    interview.status = "Checked-In"
    
    db.commit()
    db.refresh(interview)
    
    # Audit log
    create_audit_log(
        db=db,
        user_email=user.get("sub"),
        action="INTERVIEW_CHECK_IN",
        visitor_id=None,
        employee_id=user.get("employee_id") or "SECURITY"
    )
    
    # Telegram Check-in Alert
    time_str = get_current_ist_str()
    checkin_msg = (
        f"🟢 <b>CANDIDATE CHECKED IN</b>\n\n"
        f"Candidate: {interview.candidate_name}\n"
        f"Pass Number: {interview.pass_number}\n"
        f"Department: {interview.department}\n"
        f"Gate: {gate}\n"
        f"Check-In Time: {time_str}"
    )
    telegram_service.send_security_notification(db, checkin_msg, interview.id)
    telegram_service.send_hr_notification(db, checkin_msg, interview.id)
    
    return {"success": True, "message": "Candidate checked in"}

@router.post("/{interview_id}/checkout")
def checkout_interview(interview_id: int, payload: dict, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """Security check-out scan for Interview Candidates."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview pass not found")
        
    if not interview.check_in_time:
        raise HTTPException(status_code=400, detail="Cannot check out: Not Checked-In yet")
        
    if interview.check_out_time:
        raise HTTPException(status_code=400, detail="Already Checked-Out")
        
    gate = payload.get("gate_number", "Gate 1")
    interview.check_out_time = datetime.utcnow()
    interview.exit_gate = gate
    interview.exit_guard_name = user.get("sub")
    interview.inside_plant = False
    interview.status = "Checked-Out"
    
    # Calculate duration
    if interview.check_in_time:
        diff = interview.check_out_time - interview.check_in_time
        interview.duration_minutes = int(diff.total_seconds() / 60)
        
    db.commit()
    db.refresh(interview)
    
    # Audit log
    create_audit_log(
        db=db,
        user_email=user.get("sub"),
        action="INTERVIEW_CHECK_OUT",
        visitor_id=None,
        employee_id=user.get("employee_id") or "SECURITY"
    )
    
    # Telegram Check-out Alert
    time_str = get_current_ist_str()
    checkout_msg = (
        f"🔴 <b>CANDIDATE CHECKED OUT</b>\n\n"
        f"Candidate: {interview.candidate_name}\n"
        f"Pass Number: {interview.pass_number}\n"
        f"Gate: {gate}\n"
        f"Check-Out Time: {time_str}\n"
        f"Duration: {interview.duration_minutes} mins"
    )
    telegram_service.send_security_notification(db, checkout_msg, interview.id)
    telegram_service.send_hr_notification(db, checkout_msg, interview.id)
    
    return {"success": True, "message": "Candidate checked out"}
