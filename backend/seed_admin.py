import os
from dotenv import load_dotenv
load_dotenv()

from app.database.session import SessionLocal
from app.models.user import User
from app.models.department import Department
from app.security.password import hash_password

db = SessionLocal()

ultimate_email = os.getenv("ULTIMATE_ADMIN_EMAIL", "ultimate@igl.com")
ultimate_password = os.getenv("ULTIMATE_ADMIN_PASSWORD", "12345")

# Delete admin@vms.com if it exists
old_admin = db.query(User).filter(User.email == "admin@vms.com").first()
if old_admin:
    db.delete(old_admin)
    db.commit()
    print("Old admin@vms.com deleted")

# Seed ultimate admin user
admin = db.query(User).filter(User.email == ultimate_email).first()
if not admin:
    admin = User(
        email=ultimate_email,
        employee_id=ultimate_email,
        hashed_password=hash_password(ultimate_password),
        role="CORPORATE_SUPER_ADMIN",
        is_active=True,
        full_name="Ultimate System Admin"
    )
    db.add(admin)
    db.commit()
    print(f"Ultimate System Admin user created: {ultimate_email}")
else:
    admin.hashed_password = hash_password(ultimate_password)
    admin.employee_id = ultimate_email
    db.commit()
    print(f"Ultimate System Admin user already exists, updated configuration.")
db.close()
