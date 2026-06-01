from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database.session import SessionLocal
from app.models.interview import Interview
from app.schemas.interview import InterviewCreate, InterviewResponse
from app.security.dependencies import get_current_user, RoleChecker
from app.models.visitor import Visitor
from app.services import telegram_service

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])

@router.post("/", response_model=InterviewResponse)
def create_interview(request: InterviewCreate, user: dict = Depends(RoleChecker(["SUPER_ADMIN", "ADMIN", "HR_MANAGER"]))):
    db: Session = SessionLocal()
    interview = Interview(
        candidate_id=request.candidate_id,
        position=request.position,
        round_name=request.round_name,
        scheduled_time=request.scheduled_time,
        hr_host_id=user.get("user_id")
    )
    try:
        db.add(interview)
        db.commit()
        db.refresh(interview)
        
        # Telegram Interview Notification
        visitor = db.query(Visitor).filter(Visitor.id == request.candidate_id).first()
        candidate_name = visitor.full_name if visitor else f"ID: {request.candidate_id}"
        date_str = request.scheduled_time.strftime("%Y-%m-%d") if request.scheduled_time else "TBD"
        time_str = request.scheduled_time.strftime("%H:%M:%S") if request.scheduled_time else "TBD"
        
        hr_msg = f"🎯 <b>INTERVIEW SCHEDULED</b>\n\nCandidate: {candidate_name}\nPosition: {request.position}\nDepartment: HR\nDate: {date_str}\nTime: {time_str}"
        telegram_service.send_hr_notification(db, hr_msg, interview.id)

        return interview
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid Candidate ID. Visitor does not exist.")

@router.get("/")
def get_interviews(user: dict = Depends(get_current_user)):
    db: Session = SessionLocal()
    query = db.query(Interview)
    
    role = user.get("role", "EMPLOYEE")
    if role not in ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"]:
        return [] # Only these roles should see interviews
        
    return query.all()
