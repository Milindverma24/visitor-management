from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingCreate, MeetingResponse
from app.security.dependencies import get_current_user
from app.models.department import Department
from app.models.user import User
from app.services import telegram_service

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])

@router.post("/", response_model=MeetingResponse)
def create_meeting(request: MeetingCreate, user: dict = Depends(get_current_user)):
    db: Session = SessionLocal()
    # Determine host_id based on role and request
    role = user.get("role", "EMPLOYEE")
    if role in ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"] and request.host_id:
        final_host_id = request.host_id
    else:
        final_host_id = user.get("user_id")

    meeting = Meeting(
        title=request.title,
        description=request.description,
        location=request.location,
        scheduled_time=request.scheduled_time,
        end_time=request.end_time,
        department_id=request.department_id or user.get("department_id"),
        host_id=final_host_id
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # Telegram Meeting Notification
    dept = db.query(Department).filter(Department.id == meeting.department_id).first()
    host = db.query(User).filter(User.id == meeting.host_id).first()
    
    dept_name = dept.name if dept else "Unknown"
    host_name = host.full_name if host else f"Host ID: {meeting.host_id}"
    time_str = meeting.scheduled_time.strftime("%Y-%m-%d %H:%M:%S") if meeting.scheduled_time else "TBD"
    
    meeting_msg = f"📅 <b>MEETING CREATED</b>\n\nMeeting: {meeting.title}\nDepartment: {dept_name}\nVisitor: N/A (Internal/External)\nHost: {host_name}\nTime: {time_str}"
    telegram_service.send_department_notification(db, dept_name, meeting_msg, meeting.id)

    return meeting

@router.get("/")
def get_meetings(user: dict = Depends(get_current_user)):
    db: Session = SessionLocal()
    query = db.query(Meeting)
    
    role = user.get("role", "EMPLOYEE")
    if role in ["SUPER_ADMIN", "ADMIN"]:
        pass
    elif role == "DEPARTMENT_HEAD":
        query = query.filter(Meeting.department_id == user.get("department_id"))
    else:
        query = query.filter(Meeting.host_id == user.get("user_id"))
        
    return query.all()
