from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter()

@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    return departments

@router.post("/", response_model=DepartmentResponse)
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db)):
    # Check if exists
    existing = db.query(Department).filter((Department.name == dept.name) | (Department.code == dept.code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name or code already exists")
    
    new_dept = Department(**dept.dict())
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: int, dept: DepartmentUpdate, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    update_data = dept.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_dept, key, value)
        
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db.delete(db_dept)
    db.commit()
    return {"success": True, "message": "Department deleted"}
