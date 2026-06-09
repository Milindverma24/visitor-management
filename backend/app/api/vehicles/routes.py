from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database.session import get_db
from app.models.vehicle import Vehicle, VehicleType
from app.models.visit import Visit, PassType
from app.models.visitor import Visitor
import random
import string

router = APIRouter()

class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str = "TRUCK"
    make_model: Optional[str] = None
    driver_name: Optional[str] = None
    driver_mobile: Optional[str] = None
    driver_email: Optional[str] = None
    driver_photo_path: Optional[str] = None
    transport_company: Optional[str] = None
    purpose: Optional[str] = None
    host_employee: Optional[str] = None

class VehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    make_model: Optional[str] = None
    driver_name: Optional[str] = None
    driver_mobile: Optional[str] = None
    driver_aadhaar: Optional[str] = None
    transport_company: Optional[str] = None
    is_blacklisted: Optional[bool] = None
    blacklist_reason: Optional[str] = None

@router.get("/")
def get_vehicles(
    search: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    is_blacklisted: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)
    if search:
        query = query.filter(Vehicle.vehicle_number.ilike(f"%{search}%"))
    if vehicle_type:
        query = query.filter(Vehicle.vehicle_type == vehicle_type)
    if is_blacklisted is not None:
        query = query.filter(Vehicle.is_blacklisted == is_blacklisted)
    return query.offset(skip).limit(limit).all()

@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.get("/by-number/{vehicle_number}")
def get_vehicle_by_number(vehicle_number: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == vehicle_number.upper()).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.post("/")
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    existing = db.query(Vehicle).filter(Vehicle.vehicle_number == vehicle.vehicle_number.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle number already registered")
    # Exclude extra fields from the pydantic model that aren't in the DB model
    new_vehicle = Vehicle(**vehicle.dict(exclude={"purpose", "host_employee"}))
    new_vehicle.vehicle_number = vehicle.vehicle_number.upper()
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: int, vehicle: VehicleUpdate, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for key, value in vehicle.dict(exclude_unset=True).items():
        setattr(db_vehicle, key, value)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(db_vehicle)
    db.commit()
    return {"success": True, "message": "Vehicle deleted"}

@router.post("/{vehicle_id}/blacklist")
def blacklist_vehicle(vehicle_id: int, reason: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    vehicle.is_blacklisted = True
    vehicle.blacklist_reason = reason

    # Add entry to unified Blacklist table
    from app.models.blacklist import Blacklist, BlacklistType
    existing = db.query(Blacklist).filter(
        Blacklist.reference_identifier == vehicle.vehicle_number,
        Blacklist.blacklist_type == BlacklistType.VEHICLE,
        Blacklist.is_active == True
    ).first()
    
    if not existing:
        blacklist_entry = Blacklist(
            blacklist_type=BlacklistType.VEHICLE,
            reference_id=vehicle.id,
            reference_identifier=vehicle.vehicle_number,
            reference_name=vehicle.driver_name or "N/A",
            reason=reason,
            is_active=True
        )
        db.add(blacklist_entry)

    db.commit()
    return {"success": True, "message": "Vehicle blacklisted"}

@router.post("/transporter-pass")
def create_transporter_pass(payload: VehicleCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Handles external portal requests for vehicles: creates vehicle (if new) and submits a PENDING pass."""
    
    # 1. Handle Vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == payload.vehicle_number.upper()).first()
    if not vehicle:
        vehicle = Vehicle(
            vehicle_number=payload.vehicle_number.upper(),
            vehicle_type=payload.vehicle_type,
            driver_name=payload.driver_name,
            driver_mobile=payload.driver_mobile,
            transport_company=payload.transport_company
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
    elif vehicle.is_blacklisted:
        raise HTTPException(status_code=403, detail="Vehicle is blacklisted. Entry denied.")

    # 2. Handle Visitor (Driver)
    visitor = None
    if payload.driver_mobile:
        visitor = db.query(Visitor).filter(Visitor.phone_number == payload.driver_mobile).first()
        if not visitor:
            visitor = Visitor(
                full_name=payload.driver_name or "Unknown Driver",
                phone_number=payload.driver_mobile,
                email=payload.driver_email,
                company=payload.transport_company or "Transport Company",
                purpose=payload.purpose,
                category="DRIVER",
                id_type="NONE",
                photo_path=payload.driver_photo_path
            )
            db.add(visitor)
            db.commit()
            db.refresh(visitor)
        elif visitor.is_blacklisted:
            raise HTTPException(status_code=403, detail="Driver is blacklisted. Entry denied.")

    # 3. Create Pass (PENDING state)
    unique_id = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    card_id = f"TRP-{unique_id}"

    visit = Visit(
        visitor_id=visitor.id if visitor else None,
        host_employee=payload.host_employee or "GATE_SECURITY",
        pass_type=PassType.VENDOR_PASS,
        purpose=f"[{vehicle.vehicle_number}] - {payload.purpose or 'MATERIAL DELIVERY'}",
        status="PENDING",
        card_id=card_id,
        up_to="N/A",
        accompanied_by_count=0
    )
    
    db.add(visit)
    db.commit()
    db.refresh(visit)
    
    def bg_vehicle_request_alert(visitor_name, vehicle_num, purpose, visit_id):
        from app.database.session import SessionLocal
        from app.services import telegram_service
        from app.utils.timezone import get_ist_now
        db_session = SessionLocal()
        try:
            alert_msg = f"⏳ <b>NEW TRANSPORTER PASS REQUEST PENDING</b>\n\nDriver: {visitor_name}\nVehicle: {vehicle_num}\nPurpose: {purpose}\nTime: {get_ist_now().strftime('%Y-%m-%d %H:%M:%S')}\n\n<i>Please review and approve in the Admin Dashboard.</i>"
            telegram_service.send_admin_notification(db_session, alert_msg, visit_id)
        finally:
            db_session.close()

    background_tasks.add_task(
        bg_vehicle_request_alert,
        visitor_name=visitor.full_name if visitor else "Unknown Driver",
        vehicle_num=vehicle.vehicle_number,
        purpose=payload.purpose or 'MATERIAL DELIVERY',
        visit_id=visit.id
    )
    
    return {
        "success": True,
        "message": "Pass requested successfully. Waiting for admin approval.",
        "pass_number": card_id,
        "vehicle_id": vehicle.id,
        "visit_id": visit.id
    }
