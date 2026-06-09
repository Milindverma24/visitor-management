from app.database.session import SessionLocal
from app.models.department import Department
from app.models.user import User
from app.security.password import hash_password

db = SessionLocal()

# 1. Create Transport Department
transport_dept = db.query(Department).filter(Department.code == "TRANS").first()
if not transport_dept:
    transport_dept = Department(name="Transport", code="TRANS", head="Vijay Kumar")
    db.add(transport_dept)
    db.commit()
    db.refresh(transport_dept)
    print("Created Transport Department")
else:
    print("Transport Department already exists")

# 2. Create Transport Manager / Officer
transport_manager = db.query(User).filter(User.email == "transport@igl.com").first()
if not transport_manager:
    transport_manager = User(
        email="transport@igl.com",
        full_name="Vijay Kumar",
        hashed_password=hash_password("password123"),
        role="DEPARTMENT_HEAD",
        department_id=transport_dept.id,
        is_active=True
    )
    db.add(transport_manager)
    db.commit()
    print("Created Transport Manager")
else:
    print("Transport Manager already exists")

db.close()
print("Done seeding Transport department.")
