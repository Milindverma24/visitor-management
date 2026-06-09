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
    {"email": "ultimate@igl.com", "name": "Ultimate System Admin", "role": "CORPORATE_SUPER_ADMIN", "dept": "IT"},
    {"email": "security.guard@igl.com", "name": "Security Guard 1", "role": "CORPORATE_SUPER_ADMIN", "dept": "SEC"},
]

# Keep only seeded users
kept_emails = [u["email"] for u in users_data]
all_users = db.query(User).all()
for user in all_users:
    if user.email not in kept_emails:
        # Clear references in departments
        db.query(Department).filter(Department.head_user_id == user.id).update({Department.head_user_id: None})
        # Clear manager references
        db.query(User).filter(User.reporting_manager_id == user.id).update({User.reporting_manager_id: None})
        # Delete user
        db.delete(user)
db.commit()

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

db.close()
print("IGL Seed Data Created/Cleaned Successfully.")
