from app.database.session import SessionLocal
from app.models.user import User
from app.models.department import Department
from app.security.password import hash_password

db = SessionLocal()
admin = db.query(User).filter(User.email == "admin@vms.com").first()
if not admin:
    admin = User(
        email="admin@vms.com",
        hashed_password=hash_password("password"),
        role="SUPER_ADMIN",
        is_active=True,
        full_name="System Admin"
    )
    db.add(admin)
    db.commit()
    print("Admin user created")
else:
    print("Admin user already exists")
db.close()
