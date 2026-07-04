from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
import csv
import io
from app.database.session import get_db
from app.models.user import User
from app.models.department import Department
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.security.password import hash_password
from app.security.dependencies import get_current_user

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def get_users(
    department_name: Optional[str] = None, 
    department_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(User)
    
    if department_id:
        query = query.filter(User.department_id == department_id)
    elif department_name:
        query = query.join(Department, User.department_id == Department.id).filter(Department.name == department_name)
        
    if current_user.get("role") != "CORPORATE_SUPER_ADMIN":
        user_plant = current_user.get("plant_id")
        if user_plant is not None:
            query = query.filter((User.plant_id == user_plant) | (User.plant_id == None))
        
    return query.all()

@router.get("/public", response_model=List[UserResponse])
def get_public_users(
    department_name: Optional[str] = None,
    plant_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.is_active == True)
    
    if department_name:
        query = query.join(Department, User.department_id == Department.id).filter(Department.name == department_name)
        
    if plant_id:
        query = query.filter(User.plant_id == plant_id)
        
    return query.all()

@router.post("/", response_model=UserResponse)
def create_user(
    user: UserCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    if user.employee_id:
        existing_emp = db.query(User).filter(User.employee_id == user.employee_id).first()
        if existing_emp:
            raise HTTPException(status_code=400, detail="User with this employee ID already exists")

    # Automatically assign plant_id for non-super admins
    user_plant_id = user.plant_id
    if current_user.get("role") != "CORPORATE_SUPER_ADMIN":
        user_plant_id = current_user.get("plant_id")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        employee_id=user.employee_id,
        hashed_password=hash_password(user.password),
        role=user.role.upper() if user.role else "EMPLOYEE",
        department_id=user.department_id,
        plant_id=user_plant_id,
        is_active=user.is_active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int, 
    user: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    elif "password" in update_data:
        update_data.pop("password")
        
    if current_user.get("role") != "CORPORATE_SUPER_ADMIN":
        # Don't allow changing plant_id if not super admin
        if "plant_id" in update_data:
            update_data.pop("plant_id")
            
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

@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    content = await file.read()
    decoded_content = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded_content))

    added_count = 0
    skipped_count = 0
    errors = []

    seen_emails = set()
    seen_emp_ids = set()

    for row_num, row in enumerate(csv_reader, start=2):
        email = row.get("email", "").strip()
        employee_id = row.get("employee_id", "").strip()
        full_name = row.get("full_name", "").strip()
        role = row.get("role", "EMPLOYEE").strip().upper()
        department_name = row.get("department_name", "").strip()
        password = row.get("password", "Pass123").strip()

        if not email or not full_name:
            errors.append(f"Row {row_num}: Missing full_name or email.")
            continue

        # Check for duplicates in memory
        if email in seen_emails or (employee_id and employee_id in seen_emp_ids):
            skipped_count += 1
            continue

        # Check for duplicates in database
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            skipped_count += 1
            continue
            
        if employee_id:
            existing_emp = db.query(User).filter(User.employee_id == employee_id).first()
            if existing_emp:
                skipped_count += 1
                continue

        # Get department ID
        dept_id = None
        if department_name:
            dept = db.query(Department).filter(Department.name == department_name).first()
            if dept:
                dept_id = dept.id

        new_user = User(
            full_name=full_name,
            email=email,
            employee_id=employee_id if employee_id else None,
            hashed_password=hash_password(password),
            role=role if role else "EMPLOYEE",
            department_id=dept_id,
            plant_id=current_user.get("plant_id") if current_user.get("role") != "CORPORATE_SUPER_ADMIN" else None,
            is_active=True
        )
        db.add(new_user)
        seen_emails.add(email)
        if employee_id:
            seen_emp_ids.add(employee_id)
        added_count += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error during insert: {str(e)}")

    return {
        "success": True,
        "message": f"Successfully added {added_count} employees. Skipped {skipped_count} duplicates.",
        "added": added_count,
        "skipped": skipped_count,
        "errors": errors
    }

