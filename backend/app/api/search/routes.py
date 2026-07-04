from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.models.visitor import Visitor
from app.models.visit import Visit

from app.models.user import User

router = APIRouter()

@router.get("/")
def global_search(
    q: str,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Global search by:
    - Phone number → visitor
    - Visitor name → visitor
    - Pass number → visit

    - Company name → visitor.company
    - Host employee → visit.host_employee
    """
    results = {"visitors": [], "visits": [], "users": []}
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





    return results

@router.get("/latest-pass")
def get_latest_pass(
    phone: Optional[str] = None,

    pass_number: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns the most recent active pass for given identifier (phone / pass number)."""
    
    # Latest Pass Rule: Always return latest approved/active pass
    if pass_number:
        p_clean = pass_number.strip().upper()
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



    return {"found": False, "pass": None}
