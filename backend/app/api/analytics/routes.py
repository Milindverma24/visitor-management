from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.models.vehicle import Vehicle
from app.models.material import Material
from datetime import datetime, date, timedelta

router = APIRouter()

@router.get("/dashboard")
def get_analytics_dashboard(db: Session = Depends(get_db)):
    """Full analytics dashboard: today's stats, trends, department breakdown."""
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    yesterday_start = today_start - timedelta(days=1)

    # Today counts
    today_visits = db.query(Visit).filter(Visit.created_at >= today_start).all()
    today_checkins = db.query(Visit).filter(
        Visit.check_in_time >= today_start,
        Visit.check_in_time <= today_end
    ).count()
    today_checkouts = db.query(Visit).filter(
        Visit.check_out_time >= today_start,
        Visit.check_out_time <= today_end
    ).count()
    
    currently_inside = db.query(Visit).filter(
        Visit.check_in_time.isnot(None),
        Visit.check_out_time.is_(None)
    ).count()

    # Status counts (all time)
    total_pending = db.query(Visit).filter(Visit.status == "PENDING").count()
    total_approved = db.query(Visit).filter(Visit.status == "APPROVED").count()
    total_rejected = db.query(Visit).filter(Visit.status == "REJECTED").count()

    # Pass type breakdown (today)
    pass_type_breakdown = {}
    for v in today_visits:
        pt = str(v.pass_type) if v.pass_type else "UNKNOWN"
        pass_type_breakdown[pt] = pass_type_breakdown.get(pt, 0) + 1

    # Total entities
    total_visitors = db.query(Visitor).count()
    total_vehicles = db.query(Vehicle).count()
    total_materials = db.query(Material).count()
    blacklisted_visitors = db.query(Visitor).filter(Visitor.is_blacklisted == True).count()
    blacklisted_vehicles = db.query(Vehicle).filter(Vehicle.is_blacklisted == True).count()

    # Last 7 days trend
    weekly_trend = []
    for i in range(6, -1, -1):
        day = date.today() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        count = db.query(Visit).filter(
            Visit.created_at >= day_start,
            Visit.created_at <= day_end
        ).count()
        weekly_trend.append({"date": day.isoformat(), "count": count})

    return {
        "today": {
            "total_visits": len(today_visits),
            "check_ins": today_checkins,
            "check_outs": today_checkouts,
            "currently_inside": currently_inside,
            "pass_type_breakdown": pass_type_breakdown
        },
        "all_time": {
            "pending": total_pending,
            "approved": total_approved,
            "rejected": total_rejected,
            "total_visitors_registered": total_visitors,
            "total_vehicles_registered": total_vehicles,
            "total_materials": total_materials,
            "blacklisted_visitors": blacklisted_visitors,
            "blacklisted_vehicles": blacklisted_vehicles
        },
        "weekly_trend": weekly_trend,
        "generated_at": datetime.utcnow().isoformat()
    }
