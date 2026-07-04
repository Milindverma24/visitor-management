from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.visit import Visit


router = APIRouter()

@router.get("/live")
def get_live_occupancy(db: Session = Depends(get_db)):
    """Returns live plant occupancy counts broken down by type."""
    
    inside_visits = db.query(Visit).filter(
        Visit.check_in_time.isnot(None),
        Visit.check_out_time.is_(None)
    ).all()

    total = len(inside_visits)
    breakdown = {}
    for v in inside_visits:
        if v.pass_type:
            ptype = v.pass_type.value if hasattr(v.pass_type, "value") else str(v.pass_type)
            if "PassType." in ptype:
                ptype = ptype.replace("PassType.", "")
        else:
            ptype = "UNKNOWN"
        breakdown[ptype] = breakdown.get(ptype, 0) + 1

    return {
        "total_inside": total,
        "visitors": breakdown.get("VISITOR_PASS", 0),

        "contractors": breakdown.get("CONTRACTOR_PASS", 0),
        "vendors": breakdown.get("VENDOR_PASS", 0),
        "temp_employees": breakdown.get("TEMPORARY_EMPLOYEE_PASS", 0),
        "breakdown": breakdown
    }
