from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database.session import get_db
from app.models.contractor import Contractor, ContractorEmployee

router = APIRouter()

class ContractorCreate(BaseModel):
    company_name: str
    company_code: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    work_order_number: Optional[str] = None
    work_description: Optional[str] = None
    work_area: Optional[str] = None

class ContractorEmployeeCreate(BaseModel):
    contractor_id: int
    full_name: str
    phone_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    designation: Optional[str] = None
    safety_induction_done: bool = False
    medical_fitness_done: bool = False
    ppe_verified: bool = False

# Contractors
@router.get("/")
def get_contractors(search: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Contractor)
    if search:
        query = query.filter(Contractor.company_name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.get("/{contractor_id}")
def get_contractor(contractor_id: int, db: Session = Depends(get_db)):
    c = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return c

@router.post("/")
def create_contractor(contractor: ContractorCreate, db: Session = Depends(get_db)):
    new_c = Contractor(**contractor.dict())
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return new_c

@router.put("/{contractor_id}")
def update_contractor(contractor_id: int, data: dict, db: Session = Depends(get_db)):
    c = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contractor not found")
    for key, value in data.items():
        setattr(c, key, value)
    db.commit()
    db.refresh(c)
    return c

@router.delete("/{contractor_id}")
def delete_contractor(contractor_id: int, db: Session = Depends(get_db)):
    c = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contractor not found")
    db.delete(c)
    db.commit()
    return {"success": True}

# Contractor Employees
@router.get("/{contractor_id}/employees")
def get_contractor_employees(contractor_id: int, db: Session = Depends(get_db)):
    return db.query(ContractorEmployee).filter(ContractorEmployee.contractor_id == contractor_id).all()

@router.post("/employees")
def create_contractor_employee(emp: ContractorEmployeeCreate, db: Session = Depends(get_db)):
    new_emp = ContractorEmployee(**emp.dict())
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp

@router.put("/employees/{emp_id}")
def update_contractor_employee(emp_id: int, data: dict, db: Session = Depends(get_db)):
    emp = db.query(ContractorEmployee).filter(ContractorEmployee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for key, value in data.items():
        setattr(emp, key, value)
    db.commit()
    db.refresh(emp)
    return emp

@router.delete("/employees/{emp_id}")
def delete_contractor_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(ContractorEmployee).filter(ContractorEmployee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return {"success": True}
