from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database.session import get_db
from app.models.blacklist import Blacklist, BlacklistType
from datetime import datetime
from app.security.dependencies import get_current_user

router = APIRouter()

class BlacklistCreate(BaseModel):
    blacklist_type: str
    reference_id: Optional[int] = None
    reference_identifier: str
    reference_name: Optional[str] = None
    reason: str
    incident_date: Optional[datetime] = None
    incident_description: Optional[str] = None

@router.get("/")
def get_blacklist(
    blacklist_type: Optional[str] = None,
    is_active: Optional[bool] = True,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Blacklist)
    if current_user.get("role") != "CORPORATE_SUPER_ADMIN":
        query = query.filter(Blacklist.plant_id == current_user.get("plant_id"))
        
    if blacklist_type:
        query = query.filter(Blacklist.blacklist_type == blacklist_type)
    if is_active is not None:
        query = query.filter(Blacklist.is_active == is_active)
    if search:
        query = query.filter(
            Blacklist.reference_identifier.ilike(f"%{search}%") |
            Blacklist.reference_name.ilike(f"%{search}%")
        )
    return query.order_by(Blacklist.blacklisted_at.desc()).offset(skip).limit(limit).all()

@router.post("/check")
def check_blacklist(identifier: str, blacklist_type: Optional[str] = None, db: Session = Depends(get_db)):
    """Quick check if an identifier (name, phone, etc.) is blacklisted."""
    query = db.query(Blacklist).filter(
        Blacklist.reference_identifier.ilike(f"%{identifier}%"),
        Blacklist.is_active == True
    )
    if blacklist_type:
        query = query.filter(Blacklist.blacklist_type == blacklist_type)
    result = query.first()
    if result:
        return {
            "is_blacklisted": True,
            "reason": result.reason,
            "blacklisted_at": result.blacklisted_at,
            "blacklist_type": result.blacklist_type
        }
    return {"is_blacklisted": False}

def sync_unblacklist(db: Session, blacklist_type: str, reference_identifier: str, reference_name: str | None, reference_id: int | None):
    from app.models.visitor import Visitor

    from sqlalchemy import or_
    
    if blacklist_type in ["VISITOR", "DRIVER"]:
        filters = []
        if reference_identifier:
            filters.append(Visitor.phone_number == reference_identifier)
        if reference_name:
            filters.append(Visitor.full_name == reference_name)
        if reference_id:
            filters.append(Visitor.id == reference_id)
        if filters:
            visitors = db.query(Visitor).filter(or_(*filters)).all()
            for v in visitors:
                v.is_blacklisted = False


@router.post("/")
def add_to_blacklist(
    entry: BlacklistCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Check if already blacklisted
    existing = db.query(Blacklist).filter(
        Blacklist.reference_identifier == entry.reference_identifier,
        Blacklist.blacklist_type == entry.blacklist_type,
        Blacklist.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already blacklisted")
    
    new_entry = Blacklist(**entry.dict())
    if current_user.get("role") != "CORPORATE_SUPER_ADMIN":
        new_entry.plant_id = current_user.get("plant_id")
        
    db.add(new_entry)
    
    # Sync with Visitor
    from app.models.visitor import Visitor
    from sqlalchemy import or_
    
    if entry.blacklist_type in ["VISITOR", "DRIVER"]:
        filters = []
        if entry.reference_identifier:
            filters.append(Visitor.phone_number == entry.reference_identifier)
        if entry.reference_name:
            filters.append(Visitor.full_name == entry.reference_name)
        if entry.reference_id:
            filters.append(Visitor.id == entry.reference_id)
        if filters:
            visitors = db.query(Visitor).filter(or_(*filters)).all()
            for v in visitors:
                v.is_blacklisted = True


    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.patch("/{blacklist_id}/remove")
def remove_from_blacklist(blacklist_id: int, removal_reason: str, db: Session = Depends(get_db)):
    entry = db.query(Blacklist).filter(Blacklist.id == blacklist_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Blacklist entry not found")
    entry.is_active = False
    entry.removed_at = datetime.utcnow()
    entry.removal_reason = removal_reason
    
    # Sync status back to entities
    sync_unblacklist(db, entry.blacklist_type, entry.reference_identifier, entry.reference_name, entry.reference_id)
    
    db.commit()
    return {"success": True, "message": "Removed from blacklist"}

@router.delete("/{blacklist_id}")
def delete_blacklist_entry(blacklist_id: int, db: Session = Depends(get_db)):
    entry = db.query(Blacklist).filter(Blacklist.id == blacklist_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Sync status back to entities
    sync_unblacklist(db, entry.blacklist_type, entry.reference_identifier, entry.reference_name, entry.reference_id)
    
    db.delete(entry)
    db.commit()
    return {"success": True}
