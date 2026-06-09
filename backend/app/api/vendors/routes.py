from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database.session import get_db
from app.models.vendor import Vendor

router = APIRouter()

class VendorCreate(BaseModel):
    vendor_name: str
    vendor_code: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    vendor_type: Optional[str] = None
    gst_number: Optional[str] = None

class VendorUpdate(BaseModel):
    vendor_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    vendor_type: Optional[str] = None
    gst_number: Optional[str] = None
    is_active: Optional[bool] = None
    is_blacklisted: Optional[bool] = None
    blacklist_reason: Optional[str] = None

@router.get("/")
def get_vendors(search: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Vendor)
    if search:
        query = query.filter(Vendor.vendor_name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.get("/{vendor_id}")
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    v = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return v

@router.post("/")
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db)):
    new_v = Vendor(**vendor.dict())
    db.add(new_v)
    db.commit()
    db.refresh(new_v)
    return new_v

@router.put("/{vendor_id}")
def update_vendor(vendor_id: int, vendor: VendorUpdate, db: Session = Depends(get_db)):
    v = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for key, value in vendor.dict(exclude_unset=True).items():
        setattr(v, key, value)
    db.commit()
    db.refresh(v)
    return v

@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    v = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(v)
    db.commit()
    return {"success": True, "message": "Vendor deleted"}
