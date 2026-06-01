from app.database.session import SessionLocal
from app.models.user import User
from app.models.department import Department
from app.security.password import hash_password

db = SessionLocal()

# Create HR Department
hr_dept = db.query(Department).filter(Department.code == "HR").first()
if not hr_dept:
    hr_dept = Department(name="Human Resources", code="HR", head="Sarah Connor")
    db.add(hr_dept)
    db.commit()
    db.refresh(hr_dept)
    print("Created HR Department")

# Create IT Department
it_dept = db.query(Department).filter(Department.code == "IT").first()
if not it_dept:
    it_dept = Department(name="Information Technology", code="IT", head="John Smith")
    db.add(it_dept)
    db.commit()
    db.refresh(it_dept)
    print("Created IT Department")

# Create HR Manager
hr_manager = db.query(User).filter(User.email == "hr@vms.com").first()
if not hr_manager:
    hr_manager = User(
        email="hr@vms.com",
        full_name="Sarah Connor",
        hashed_password=hash_password("password"),
        role="HR_MANAGER",
        department_id=hr_dept.id,
        is_active=True
    )
    db.add(hr_manager)
    print("Created HR Manager")

# Create IT Manager
it_manager = db.query(User).filter(User.email == "it@vms.com").first()
if not it_manager:
    it_manager = User(
        email="it@vms.com",
        full_name="John Smith",
        hashed_password=hash_password("password"),
        role="DEPARTMENT_HEAD",
        department_id=it_dept.id,
        is_active=True
    )
    db.add(it_manager)
    print("Created IT Manager")

db.commit()
db.close()
print("Seeding complete.")
