# seed_test_data.py
"""Create sample visitors and visits for testing the dashboard and department filtering.
This script creates:
- 10 Visitor records (5 for HR, 5 for IT)
- Corresponding Visit records linked to the appropriate department and a host employee.
"""

import random
from datetime import datetime, timedelta

from app.database.session import SessionLocal
from app.models.visitor import Visitor
from app.models.visit import Visit, PassType
from app.models.department import Department
from app.models.user import User

# Helper to get a random department (HR or IT)
def get_department_by_code(code: str):
    db = SessionLocal()
    dept = db.query(Department).filter(Department.code == code).first()
    db.close()
    return dept

hr_dept = get_department_by_code("HR")
it_dept = get_department_by_code("IT")

# Get sample host employees (use the managers we seeded earlier)
def get_user_by_email(email: str):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    db.close()
    return user

hr_manager = get_user_by_email("ultimate@igl.com")
it_manager = get_user_by_email("security.guard@igl.com")

names = [
    "Alice Smith", "Bob Johnson", "Charlie Lee", "Diana Patel",
    "Evan Kim", "Fiona Garcia", "George Brown", "Hannah Davis",
    "Ian Wilson", "Julia Martinez"
]

purposes = [
    "Project Kickoff", "Vendor Demonstration", "Interview - Software Engineer",
    "Contractor Site Visit", "Maintenance Review", "Technology Assessment",
    "Compliance Audit", "HR Policy Meeting", "IT System Upgrade", "Safety Training"
]

db = SessionLocal()
for i in range(10):
    visitor = Visitor(
        full_name=names[i],
        phone_number=f"+91-98765{random.randint(1000,9999)}",
        email=f"{names[i].split()[0].lower()}{i}@example.com",
        title="Visitor",
        purpose=purposes[i],
        company="Acme Corp"
    )
    db.add(visitor)
    db.flush()  # assign visitor.id

    # Assign department based on index parity
    dept = hr_dept if i % 2 == 0 else it_dept
    host_user = hr_manager if i % 2 == 0 else it_manager
    visit = Visit(
        visitor_id=visitor.id,
        host_employee=host_user.full_name,
        department_id=dept.id,
        pass_type=PassType.VISITOR_PASS,
        purpose=purposes[i],
        status="APPROVED",
        arrival_date=datetime.utcnow() + timedelta(minutes=i * 5),
        check_in_time=datetime.utcnow() + timedelta(minutes=i * 5 + 1),
        check_out_time=datetime.utcnow() + timedelta(minutes=i * 5 + 30),
        approved_by=host_user.full_name,
        approved_at=datetime.utcnow()
    )
    db.add(visit)

# Commit all changes
db.commit()
print("✅ 10 visitors and corresponding visits seeded successfully.")

db.close()
