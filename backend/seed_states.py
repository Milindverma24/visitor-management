import random
from datetime import datetime, timedelta

from app.database.session import SessionLocal
from app.models.department import Department
from app.models.visitor import Visitor
from app.models.visit import Visit, PassType

db = SessionLocal()

departments = {
    "HR": db.query(Department).filter(Department.code == "HR").first(),
    "IT": db.query(Department).filter(Department.code == "IT").first(),
}

# 1. PENDING Visit
visitor1 = Visitor(
    full_name="Pending Patel",
    phone_number="+91-9876500001",
    email="pending@example.com",
    title="Candidate",
    purpose="Interview",
    company="Self"
)
db.add(visitor1)
db.flush()

visit1 = Visit(
    visitor_id=visitor1.id,
    host_employee="HR Director",
    department_id=departments["HR"].id,
    pass_type=PassType.VISITOR_PASS,
    purpose="Interview",
    status="PENDING", # PENDING so the approve button shows up
    arrival_date=datetime.utcnow(),
    card_id="VM/100001"
)
db.add(visit1)

# 2. APPROVED (Awaiting Check-in)
visitor2 = Visitor(
    full_name="CheckIn Chopra",
    phone_number="+91-9876500002",
    email="checkin@example.com",
    title="Vendor",
    purpose="Maintenance",
    company="FixIt Corp"
)
db.add(visitor2)
db.flush()

visit2 = Visit(
    visitor_id=visitor2.id,
    host_employee="IT Director",
    department_id=departments["IT"].id,
    pass_type=PassType.VISITOR_PASS,
    purpose="Maintenance",
    status="APPROVED",
    arrival_date=datetime.utcnow(),
    approved_by="System Administrator",
    approved_at=datetime.utcnow(),
    card_id="VM/100002"
    # No check-in time yet
)
db.add(visit2)

# 3. CHECKED-IN (Awaiting Check-out)
visitor3 = Visitor(
    full_name="CheckOut Chatterjee",
    phone_number="+91-9876500003",
    email="checkout@example.com",
    title="Consultant",
    purpose="Project Sync",
    company="Consulting Inc"
)
db.add(visitor3)
db.flush()

visit3 = Visit(
    visitor_id=visitor3.id,
    host_employee="IT Director",
    department_id=departments["IT"].id,
    pass_type=PassType.VISITOR_PASS,
    purpose="Project Sync",
    status="APPROVED",
    arrival_date=datetime.utcnow(),
    approved_by="System Administrator",
    approved_at=datetime.utcnow() - timedelta(hours=3),
    check_in_time=datetime.utcnow() - timedelta(hours=2), # Has checked in
    card_id="VM/100003"
    # No check out time
)
db.add(visit3)

db.commit()
db.close()
print("Generated test states successfully!")
