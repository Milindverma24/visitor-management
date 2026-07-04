from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.security.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=list[DepartmentResponse])
def get_departments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Department)
    if current_user.get("role") != "CORPORATE_SUPER_ADMIN":
        query = query.filter((Department.plant_id == current_user.get("plant_id")) | (Department.plant_id == None))
    return query.all()

@router.get("/public", response_model=list[DepartmentResponse])
def get_public_departments(
    plant_id: int = None,
    db: Session = Depends(get_db)
):
    query = db.query(Department).filter(Department.is_active == True)
    if plant_id:
        query = query.filter((Department.plant_id == plant_id) | (Department.plant_id == None))
    return query.all()

@router.post("/", response_model=DepartmentResponse)
def create_department(
    dept: DepartmentCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Check if exists
    existing = db.query(Department).filter((Department.name == dept.name) | (Department.code == dept.code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name or code already exists")
    
    new_dept = Department(**dept.dict())
    if current_user.get("role") != "CORPORATE_SUPER_ADMIN":
        new_dept.plant_id = current_user.get("plant_id")
    else:
        new_dept.plant_id = dept.plant_id
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
