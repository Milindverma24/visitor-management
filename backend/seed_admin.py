from app.database.session import SessionLocal
from app.models.user import User
from app.models.department import Department
from app.security.password import hash_password

db = SessionLocal()

# Delete admin@vms.com if it exists
old_admin = db.query(User).filter(User.email == "admin@vms.com").first()
if old_admin:
    db.delete(old_admin)
    db.commit()
    print("Old admin@vms.com deleted")

# Seed ultimate@igl.com
admin = db.query(User).filter(User.email == "ultimate@igl.com").first()
if not admin:
    admin = User(
        email="ultimate@igl.com",
        hashed_password=hash_password("password123"),
        role="CORPORATE_SUPER_ADMIN",
        is_active=True,
        full_name="Ultimate System Admin"
    )
    db.add(admin)
    db.commit()
    print("Ultimate System Admin user created")
else:
    print("Ultimate System Admin user already exists")
db.close()
