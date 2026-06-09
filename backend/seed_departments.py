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

db.commit()
db.close()
print("Seeding complete.")
