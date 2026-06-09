from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.database.session import get_db
from app.models.material import Material, MaterialType

router = APIRouter()

class MaterialCreate(BaseModel):
    material_name: str
    material_type: str = "INCOMING"
    quantity: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_id: Optional[int] = None
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    department_id: Optional[int] = None
    invoice_number: Optional[str] = None
    po_number: Optional[str] = None
    delivery_challan: Optional[str] = None

@router.get("/")
def get_materials(
    material_type: Optional[str] = None,
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Material)
    if material_type:
        query = query.filter(Material.material_type == material_type)
    if department_id:
        query = query.filter(Material.department_id == department_id)
    if status:
        query = query.filter(Material.status == status)
    return query.order_by(Material.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{material_id}")
def get_material(material_id: int, db: Session = Depends(get_db)):
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material record not found")
    return m

@router.post("/")
def create_material(material: MaterialCreate, db: Session = Depends(get_db)):
    new_m = Material(**material.dict())
    # Generate gate pass number
    count = db.query(Material).count()
    new_m.gate_pass_number = f"IGL-{datetime.utcnow().year}-MAT-{str(count + 1).zfill(5)}"
    db.add(new_m)
    db.commit()
    db.refresh(new_m)
    return new_m

@router.put("/{material_id}")
def update_material(material_id: int, data: dict, db: Session = Depends(get_db)):
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material record not found")
    for key, value in data.items():
        setattr(m, key, value)
    db.commit()
    db.refresh(m)
    return m

@router.patch("/{material_id}/status")
def update_material_status(material_id: int, status: str, db: Session = Depends(get_db)):
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    m.status = status
    if status == "ENTERED":
        m.entry_time = datetime.utcnow()
    elif status == "EXITED":
        m.exit_time = datetime.utcnow()
    elif status == "RETURNED":
        m.is_returned = True
        m.actual_return_date = datetime.utcnow()
    db.commit()
    return {"success": True, "status": status}

@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    db.delete(m)
    db.commit()
    return {"success": True}
