from datetime import datetime
from app.utils.badge_generator import generate_badge

class DummyVisit:
    id = 9999
    card_id = "TST-9999"
    created_at = datetime.now()
    mobile_token_no = "MT-123"
    accessories = "Laptop"
    purpose = "Meeting"
    up_to = "HR Dept"
    host_employee = "Milind Verma"
    valid_up_to = datetime.now()
    accompanied_by_count = 0
    department_id = "HR"

class DummyVisitor:
    title = "Mr."
    full_name = "Test Visitor"
    category = "Contractor"
    phone_number = "9876543210"
    address = "Delhi, India"
    photo_path = None

v = DummyVisit()
vis = DummyVisitor()

generate_badge(v, vis, "", "uploads/company_logo.png")
print("Generated PDF!")
