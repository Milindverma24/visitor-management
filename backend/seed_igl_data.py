import os
from dotenv import load_dotenv
load_dotenv()

from app.database.session import SessionLocal
from app.models.user import User
from app.models.department import Department
from app.security.password import hash_password

db = SessionLocal()

# Load credentials from environment variables
ultimate_email = os.getenv("ULTIMATE_ADMIN_EMAIL", "ultimate@igl.com")
ultimate_password = os.getenv("ULTIMATE_ADMIN_PASSWORD", "12345")
guard_email = os.getenv("SECURITY_GUARD_EMAIL", "security.guard@igl.com")
guard_password = os.getenv("SECURITY_GUARD_PASSWORD", "12345")

# 1. Create Departments
dept_data = [
    {"name": "Human Resources", "code": "HR"},
    {"name": "Information Technology", "code": "IT"},
    {"name": "Administration", "code": "ADMIN"},
    {"name": "Security", "code": "SEC"},
    {"name": "Reception", "code": "REC"},
    {"name": "Production", "code": "PROD"},
    {"name": "Maintenance", "code": "MAINT"},
    {"name": "Safety", "code": "SAFE"},
    {"name": "Finance", "code": "FIN"},
    {"name": "Sales", "code": "SALES"},
    {"name": "Marketing", "code": "MKTG"},
    {"name": "Legal", "code": "LGL"},
    {"name": "Operations", "code": "OPS"}
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
    {
        "email": ultimate_email,
        "name": "Ultimate System Admin",
        "role": "CORPORATE_SUPER_ADMIN",
        "dept": "IT",
        "password": ultimate_password
    },
    {
        "email": guard_email,
        "name": "Security Guard 1",
        "role": "CORPORATE_SUPER_ADMIN",
        "dept": "SEC",
        "password": guard_password
    },
]

for u in users_data:
    user = db.query(User).filter(User.email == u["email"]).first()
    if not user:
        user = User(
            email=u["email"],
            employee_id=u["email"],
            full_name=u["name"],
            hashed_password=hash_password(u["password"]),
            role=u["role"],
            department_id=departments[u["dept"]].id,
            is_active=True
        )
        db.add(user)
    else:
        user.hashed_password = hash_password(u["password"])
        user.employee_id = u["email"]
        user.role = u["role"]
        user.department_id = departments[u["dept"]].id
db.commit()

db.close()
print("IGL Seed Data Created/Cleaned Successfully.")
