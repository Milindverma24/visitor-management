from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.models.visitor import Visitor
from app.models.visit import Visit
from app.models.vehicle import Vehicle
from app.models.user import User
from app.models.interview import Interview
from app.models.meeting import Meeting

router = APIRouter()

@router.get("/")
def global_search(
    q: str,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Global search by:
    - Phone number → visitor/candidate/meeting visitor
    - Visitor name → visitor/candidate/meeting visitor
    - Pass number → visit/interview/meeting
    - Vehicle number → vehicle
    - Company name → visitor.company/meeting company
    - Host employee → visit.host_employee/interviewer/meeting host
    """
    results = {"visitors": [], "visits": [], "vehicles": [], "users": [], "interviews": [], "meetings": []}
    q_lower = q.strip().lower()

    if not entity_type or entity_type == "visitor":
        visitors = db.query(Visitor).filter(
            Visitor.phone_number.ilike(f"%{q_lower}%") |
            Visitor.full_name.ilike(f"%{q_lower}%") |
            Visitor.company.ilike(f"%{q_lower}%") |
            Visitor.id_number.ilike(f"%{q_lower}%")
        ).limit(10).all()
        results["visitors"] = [
            {"id": v.id, "full_name": v.full_name, "phone_number": v.phone_number,
             "company": v.company, "is_blacklisted": v.is_blacklisted}
            for v in visitors
        ]

    if not entity_type or entity_type == "visit":
        visits = db.query(Visit).filter(
            Visit.card_id.ilike(f"%{q_lower}%") |
            Visit.host_employee.ilike(f"%{q_lower}%")
        ).order_by(Visit.created_at.desc()).limit(10).all()
        results["visits"] = [
            {"id": v.id, "card_id": v.card_id, "status": v.status,
             "pass_type": v.pass_type, "host_employee": v.host_employee,
             "created_at": str(v.created_at)}
            for v in visits
        ]

    if not entity_type or entity_type == "vehicle":
        vehicles = db.query(Vehicle).filter(
            Vehicle.vehicle_number.ilike(f"%{q_lower}%") |
            Vehicle.driver_name.ilike(f"%{q_lower}%") |
            Vehicle.transport_company.ilike(f"%{q_lower}%") |
            Vehicle.driver_aadhaar.ilike(f"%{q_lower}%")
        ).limit(10).all()
        results["vehicles"] = [
            {"id": v.id, "vehicle_number": v.vehicle_number, "vehicle_type": v.vehicle_type,
             "driver_name": v.driver_name, "transport_company": v.transport_company,
             "is_blacklisted": v.is_blacklisted}
            for v in vehicles
        ]

    # Include Interview search
    if not entity_type or entity_type == "interview":
        interviews = db.query(Interview).filter(
            Interview.candidate_name.ilike(f"%{q_lower}%") |
            Interview.candidate_mobile.ilike(f"%{q_lower}%") |
            Interview.pass_number.ilike(f"%{q_lower}%") |
            Interview.position.ilike(f"%{q_lower}%") |
            Interview.interviewer_name.ilike(f"%{q_lower}%")
        ).order_by(Interview.created_at.desc()).limit(10).all()
        results["interviews"] = [
            {"id": i.id, "card_id": i.pass_number, "candidate_name": i.candidate_name,
             "position": i.position, "status": i.status, "interviewer": i.interviewer_name,
             "created_at": str(i.created_at)}
            for i in interviews
        ]

    # Include Meeting search
    if not entity_type or entity_type == "meeting":
        meetings = db.query(Meeting).filter(
            Meeting.title.ilike(f"%{q_lower}%") |
            Meeting.visitor_name.ilike(f"%{q_lower}%") |
            Meeting.visitor_mobile.ilike(f"%{q_lower}%") |
            Meeting.pass_number.ilike(f"%{q_lower}%") |
            Meeting.host_employee.ilike(f"%{q_lower}%") |
            Meeting.company_name.ilike(f"%{q_lower}%")
        ).order_by(Meeting.created_at.desc()).limit(10).all()
        results["meetings"] = [
            {"id": m.id, "card_id": m.pass_number, "visitor_name": m.visitor_name,
             "title": m.title, "status": m.status, "host": m.host_employee,
             "created_at": str(m.created_at)}
            for m in meetings
        ]

    return results

@router.get("/latest-pass")
def get_latest_pass(
    phone: Optional[str] = None,
    vehicle_number: Optional[str] = None,
    pass_number: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns the most recent active pass for given identifier (phone / vehicle / pass number)."""
    
    # Latest Pass Rule: Always return latest approved/active pass
    if pass_number:
        p_clean = pass_number.strip().upper()
        if p_clean.startswith("INT/"):
            interview = db.query(Interview).filter(
                Interview.pass_number.ilike(f"%{p_clean}%")
            ).order_by(Interview.created_at.desc()).first()
            if interview:
                return {
                    "found": True,
                    "pass": {
                        "id": interview.id,
                        "status": interview.status,
                        "card_id": interview.pass_number,
                        "pass_type": "INTERVIEW_PASS",
                        "host_employee": f"{interview.interviewer_name} ({interview.department})",
                        "purpose": f"Interview: {interview.position} ({interview.interview_type})",
                        "check_in_time": interview.check_in_time.isoformat() if interview.check_in_time else None,
                        "check_out_time": interview.check_out_time.isoformat() if interview.check_out_time else None,
                        "visitor_name": interview.candidate_name,
                    }
                }
        elif p_clean.startswith("MTG/"):
            meeting = db.query(Meeting).filter(
                Meeting.pass_number.ilike(f"%{p_clean}%")
            ).order_by(Meeting.created_at.desc()).first()
            if meeting:
                return {
                    "found": True,
                    "pass": {
                        "id": meeting.id,
                        "status": meeting.status,
                        "card_id": meeting.pass_number,
                        "pass_type": "MEETING_PASS",
                        "host_employee": f"{meeting.host_employee} ({meeting.host_department})",
                        "purpose": f"Meeting: {meeting.title}",
                        "check_in_time": meeting.check_in_time.isoformat() if meeting.check_in_time else None,
                        "check_out_time": meeting.check_out_time.isoformat() if meeting.check_out_time else None,
                        "visitor_name": meeting.visitor_name,
                    }
                }
        else:
            if p_clean.startswith("VISIT_ID:"):
                # Handle raw Visit ID from QR code
                try:
                    visit_id = int(p_clean.split(":")[1])
                    visit = db.query(Visit).filter(Visit.id == visit_id).first()
                except ValueError:
                    visit = None
            else:
                visit = db.query(Visit).filter(
                    Visit.card_id.ilike(f"%{p_clean}%")
                ).order_by(Visit.created_at.desc()).first()
                
            if visit:
                visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
                return {
                    "found": True,
                    "pass": {
                        "id": visit.id,
                        "status": visit.status,
                        "card_id": visit.card_id,
                        "pass_type": visit.pass_type,
                        "host_employee": visit.host_employee,
                        "purpose": visit.purpose,
                        "check_in_time": visit.check_in_time.isoformat() if visit.check_in_time else None,
                        "check_out_time": visit.check_out_time.isoformat() if visit.check_out_time else None,
                        "visitor_name": visitor.full_name if visitor else "Unknown"
                    }
                }

    elif phone:
        # Search interviews first
        interview = db.query(Interview).filter(
            Interview.candidate_mobile == phone
        ).order_by(Interview.created_at.desc()).first()
        if interview:
            return {
                "found": True,
                "pass": {
                    "id": interview.id,
                    "status": interview.status,
                    "card_id": interview.pass_number,
                    "pass_type": "INTERVIEW_PASS",
                    "host_employee": f"{interview.interviewer_name} ({interview.department})",
                    "purpose": f"Interview: {interview.position}",
                    "check_in_time": interview.check_in_time.isoformat() if interview.check_in_time else None,
                    "check_out_time": interview.check_out_time.isoformat() if interview.check_out_time else None,
                    "visitor_name": interview.candidate_name,
                }
            }
            
        # Search meetings
        meeting = db.query(Meeting).filter(
            Meeting.visitor_mobile == phone
        ).order_by(Meeting.created_at.desc()).first()
        if meeting:
            return {
                "found": True,
                "pass": {
                    "id": meeting.id,
                    "status": meeting.status,
                    "card_id": meeting.pass_number,
                    "pass_type": "MEETING_PASS",
                    "host_employee": f"{meeting.host_employee} ({meeting.host_department})",
                    "purpose": f"Meeting: {meeting.title}",
                    "check_in_time": meeting.check_in_time.isoformat() if meeting.check_in_time else None,
                    "check_out_time": meeting.check_out_time.isoformat() if meeting.check_out_time else None,
                    "visitor_name": meeting.visitor_name,
                }
            }
            
        # Search visits
        visitor = db.query(Visitor).filter(Visitor.phone_number == phone).first()
        if visitor:
            visit = db.query(Visit).filter(Visit.visitor_id == visitor.id).order_by(Visit.created_at.desc()).first()
            if visit:
                return {
                    "found": True,
                    "pass": {
                        "id": visit.id,
                        "status": visit.status,
                        "card_id": visit.card_id,
                        "pass_type": visit.pass_type,
                        "host_employee": visit.host_employee,
                        "purpose": visit.purpose,
                        "check_in_time": visit.check_in_time.isoformat() if visit.check_in_time else None,
                        "check_out_time": visit.check_out_time.isoformat() if visit.check_out_time else None,
                        "visitor_name": visitor.full_name
                    }
                }

    elif vehicle_number:
        # Search visits
        visit = db.query(Visit).filter(
            Visit.purpose.ilike(f"%{vehicle_number.upper()}%")
        ).order_by(Visit.created_at.desc()).first()
        if visit:
            visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
            return {
                "found": True,
                "pass": {
                    "id": visit.id,
                    "status": visit.status,
                    "card_id": visit.card_id,
                    "pass_type": visit.pass_type,
                    "host_employee": visit.host_employee,
                    "purpose": visit.purpose,
                    "check_in_time": visit.check_in_time.isoformat() if visit.check_in_time else None,
                    "check_out_time": visit.check_out_time.isoformat() if visit.check_out_time else None,
                    "visitor_name": visitor.full_name if visitor else "Unknown"
                }
            }

    return {"found": False, "pass": None}
