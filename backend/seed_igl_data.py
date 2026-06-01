import random
from datetime import datetime, timedelta

from app.database.session import SessionLocal
from app.models.user import User
from app.models.department import Department
from app.models.visitor import Visitor
from app.models.visit import Visit, PassType
from app.security.password import hash_password

db = SessionLocal()

# 1. Create Departments
dept_data = [
    {"name": "Human Resources", "code": "HR"},
    {"name": "Information Technology", "code": "IT"},
    {"name": "Administration", "code": "ADMIN"},
    {"name": "Security", "code": "SEC"},
    {"name": "Reception", "code": "REC"}
]

departments = {}
for d in dept_data:
    dept = db.query(Department).filter(Department.code == d["code"]).first()
    if not dept:
        dept = Department(name=d["name"], code=d["code"])
        db.add(dept)
        db.commit()
        db.refresh(dept)
    departments[d["code"]] = dept

# 2. Create Users
users_data = [
    {"email": "superadmin@igl.com", "name": "System Administrator", "role": "SUPER_ADMIN", "dept": "IT"},
    {"email": "admin@igl.com", "name": "General Admin", "role": "ADMIN", "dept": "ADMIN"},
    {"email": "security.head@igl.com", "name": "Security Chief", "role": "SECURITY", "dept": "SEC"},
    {"email": "reception@igl.com", "name": "Front Desk", "role": "RECEPTION", "dept": "REC"},
    {"email": "hr.head@igl.com", "name": "HR Director", "role": "HR_MANAGER", "dept": "HR"},
    {"email": "hr.member@igl.com", "name": "HR Executive", "role": "EMPLOYEE", "dept": "HR"},
    {"email": "it.head@igl.com", "name": "IT Director", "role": "DEPARTMENT_HEAD", "dept": "IT"},
    {"email": "it.member@igl.com", "name": "IT Support", "role": "EMPLOYEE", "dept": "IT"},
]

for u in users_data:
    user = db.query(User).filter(User.email == u["email"]).first()
    if not user:
        user = User(
            email=u["email"],
            full_name=u["name"],
            hashed_password=hash_password("password123"),
            role=u["role"],
            department_id=departments[u["dept"]].id,
            is_active=True
        )
        db.add(user)
db.commit()

# 3. Create IGL Visitors
names = ["Ramesh Kumar", "Suresh Singh", "Priya Sharma", "Neha Gupta", "Amit Patel"]
for i in range(5):
    visitor = Visitor(
        full_name=names[i],
        phone_number=f"+91-98765{random.randint(1000,9999)}",
        email=f"{names[i].split()[0].lower()}@example.com",
        title="Consultant",
        purpose="Project Discussion",
        company="Vendor Corp"
    )
    db.add(visitor)
    db.flush()
    
    visit = Visit(
        visitor_id=visitor.id,
        host_employee="IT Director" if i % 2 == 0 else "HR Director",
        department_id=departments["IT"].id if i % 2 == 0 else departments["HR"].id,
        pass_type=PassType.VISITOR_PASS,
        purpose="Project Discussion",
        status="APPROVED",
        arrival_date=datetime.utcnow() + timedelta(days=i),
        check_in_time=datetime.utcnow() + timedelta(days=i, minutes=5),
        check_out_time=datetime.utcnow() + timedelta(days=i, hours=2),
        approved_by="System Administrator",
        approved_at=datetime.utcnow()
    )
    db.add(visit)

db.commit()
db.close()
print("IGL Seed Data Created Successfully.")
