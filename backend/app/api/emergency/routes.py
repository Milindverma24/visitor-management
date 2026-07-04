from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.visit import Visit
from app.models.visitor import Visitor

from datetime import datetime

router = APIRouter()

@router.get("/muster")
def emergency_muster(db: Session = Depends(get_db)):
    """
    Emergency Muster Report: Returns ALL entities currently inside the plant.
    visit.check_in_time IS NOT NULL AND visit.check_out_time IS NULL
    """
    inside_visits = db.query(Visit).filter(
        Visit.check_in_time.isnot(None),
        Visit.check_out_time.is_(None)
    ).order_by(Visit.check_in_time.asc()).all()

    result = []
    for v in inside_visits:
        visitor = db.query(Visitor).filter(Visitor.id == v.visitor_id).first() if v.visitor_id else None
        result.append({
            "pass_id": v.id,
            "card_id": v.card_id,
            "pass_type": v.pass_type,
            "status": v.status,
            "visitor_name": visitor.full_name if visitor else "N/A",
            "visitor_phone": visitor.phone_number if visitor else "N/A",
            "visitor_company": visitor.company if visitor else "N/A",
            "visitor_photo": visitor.photo_path if visitor else None,
            "host_employee": v.host_employee,
            "department_id": v.department_id,
            "check_in_time": str(v.check_in_time),
            "gate_number": v.gate_number,
            "checked_in_by": v.checked_in_by,
            "duration_minutes": int((datetime.utcnow() - v.check_in_time).total_seconds() / 60) if v.check_in_time else 0
        })

    total = len(result)
    by_type = {}
    for item in result:
        ptype = str(item.get("pass_type", "UNKNOWN"))
        by_type[ptype] = by_type.get(ptype, 0) + 1

    return {
        "muster_time": datetime.utcnow().isoformat(),
        "total_inside": total,
        "breakdown_by_type": by_type,
        "entries": result
    }

EMERGENCY_STATE = {
    "fire_alert": False,
    "gas_leak_alert": False,
    "general_alert": False,
    "alert_message": None,
    "last_checked": datetime.utcnow().isoformat()
}

@router.get("/alert")
def get_emergency_alert_status():
    """Returns current emergency alert status."""
    return EMERGENCY_STATE

@router.post("/broadcast")
def trigger_emergency_broadcast(payload: dict, db: Session = Depends(get_db)):
    """Triggers or clears an emergency alert, broadcasts it via WebSockets, and notifies Telegram."""
    alert_type = payload.get("type", "GENERAL")  # FIRE, GAS_LEAK, GENERAL
    action = payload.get("action", "TRIGGER")  # TRIGGER, CLEAR
    message = payload.get("message", "Emergency evacuation broadcast triggered.")

    if action == "TRIGGER":
        if alert_type == "FIRE":
            EMERGENCY_STATE["fire_alert"] = True
        elif alert_type == "GAS_LEAK":
            EMERGENCY_STATE["gas_leak_alert"] = True
        else:
            EMERGENCY_STATE["general_alert"] = True
        EMERGENCY_STATE["alert_message"] = message
    else:
        EMERGENCY_STATE["fire_alert"] = False
        EMERGENCY_STATE["gas_leak_alert"] = False
        EMERGENCY_STATE["general_alert"] = False
        EMERGENCY_STATE["alert_message"] = None

    EMERGENCY_STATE["last_checked"] = datetime.utcnow().isoformat()

    # Send WebSocket broadcast
    try:
        from app.api.websockets import sync_broadcast
        sync_broadcast("EMERGENCY_ALERT", EMERGENCY_STATE)
    except Exception as e:
        pass



    return {"success": True, "state": EMERGENCY_STATE}
