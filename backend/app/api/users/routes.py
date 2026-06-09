from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database.session import get_db
from app.models.user import User
from app.models.department import Department
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.security.password import hash_password
from app.security.dependencies import get_current_user


router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def get_users(department_name: Optional[str] = None, department_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    
    if department_id:
        query = query.filter(User.department_id == department_id)
    elif department_name:
        query = query.join(Department, User.department_id == Department.id).filter(Department.name == department_name)
        
    return query.all()

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    if user.employee_id:
        existing_emp = db.query(User).filter(User.employee_id == user.employee_id).first()
        if existing_emp:
            raise HTTPException(status_code=400, detail="User with this employee ID already exists")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        employee_id=user.employee_id,
        hashed_password=hash_password(user.password),
        role=user.role.upper() if user.role else "EMPLOYEE",
        department_id=user.department_id,
        is_active=user.is_active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    elif "password" in update_data:
        update_data.pop("password")
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return {"success": True, "message": "User deleted"}

@router.put("/profile/update", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.id == current_user.get("user_id")).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.employee_id and user_update.employee_id != db_user.employee_id:
        existing = db.query(User).filter(User.employee_id == user_update.employee_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Employee ID already exists")

    update_data = user_update.dict(exclude_unset=True)
    allowed_fields = {"full_name", "employee_id", "profile_photo_path"}
    for key, value in update_data.items():
        if key in allowed_fields:
            setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user

