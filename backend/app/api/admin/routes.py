from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database.session import SessionLocal

from app.models.visitor import Visitor
from app.models.visit import Visit

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


@router.get("/analytics")
def analytics():

    db: Session = SessionLocal()

    total_visitors = db.query(
        Visitor
    ).count()

    total_visits = db.query(
        Visit
    ).count()

    approved = db.query(
        Visit
    ).filter(
        Visit.status == "APPROVED"
    ).count()

    rejected = db.query(
        Visit
    ).filter(
        Visit.status == "REJECTED"
    ).count()

    pending = db.query(
        Visit
    ).filter(
        Visit.status == "PENDING"
    ).count()

    checked_in = db.query(
        Visit
    ).filter(
        Visit.check_in_time != None
    ).count()

    return {
        "total_visitors": total_visitors,
        "total_visits": total_visits,
        "approved_visits": approved,
        "rejected_visits": rejected,
        "pending_visits": pending,
        "checked_in_visits": checked_in
    }