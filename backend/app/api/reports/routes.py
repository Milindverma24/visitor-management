from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import pandas as pd
import io

from app.database.session import SessionLocal
from app.models.visit import Visit
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/export")
def export_reports(
    format: str = Query("csv", description="Export format: csv or excel"),
    status: Optional[str] = None,
    department_id: Optional[int] = None,
    user: dict = Depends(get_current_user)
):
    db: Session = SessionLocal()
    query = db.query(Visit)
    
    # Simple RBAC
    if user.get("role") == "DEPARTMENT_HEAD":
        query = query.filter(Visit.department_id == user.get("department_id"))
    
    if status:
        query = query.filter(Visit.status == status)
    if department_id and user.get("role") in ["SUPER_ADMIN", "ADMIN"]:
        query = query.filter(Visit.department_id == department_id)
        
    visits = query.all()
    
    data = []
    for v in visits:
        data.append({
            "ID": v.id,
            "Visitor ID": v.visitor_id,
            "Host": v.host_employee,
            "Department ID": v.department_id,
            "Purpose": v.purpose,
            "Status": v.status,
            "Pass Type": v.pass_type.value if v.pass_type else "N/A",
            "Check-In": str(v.check_in_time) if v.check_in_time else "N/A",
            "Check-Out": str(v.check_out_time) if v.check_out_time else "N/A",
            "Created At": str(v.created_at)
        })
        
    df = pd.DataFrame(data)
    
    if format == "excel":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Visits")
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=visits_report_{datetime.now().strftime('%Y%m%d')}.xlsx"}
        )
    else:
        # Default to CSV
        output = io.StringIO()
        df.to_csv(output, index=False)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=visits_report_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

from app.models.audit_log import AuditLog

@router.get("/telegram_logs")
def get_telegram_logs(user: dict = Depends(get_current_user)):
    db: Session = SessionLocal()
    
    # Only Admin or Super Admin should view notification logs
    role = user.get("role", "EMPLOYEE")
    if role not in ["SUPER_ADMIN", "ADMIN"]:
        return []
        
    # Fetch logs starting with TELEGRAM_
    logs = db.query(AuditLog).filter(AuditLog.action.like("TELEGRAM_%")).order_by(AuditLog.created_at.desc()).limit(100).all()
    
    return logs
