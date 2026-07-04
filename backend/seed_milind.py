import sys
import os
from dotenv import load_dotenv

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
load_dotenv()

from app.database.session import SessionLocal
from app.models.user import User
from app.models.department import Department
from app.models.plant import Plant
from app.security.password import hash_password

def seed_milind_verma():
    db = SessionLocal()
    
    # Load settings from environment variables
    admin_email = os.getenv("SEED_ADMIN_EMAIL", "admin@igl.co.in")
    admin_password = os.getenv("SEED_ADMIN_PASSWORD", "admin123")
    admin_name = os.getenv("SEED_ADMIN_NAME", "IGL Admin")
    
    try:
        print(f"Cleaning old accounts matching prefix of: {admin_email}...")
        # Clean up any existing users with this prefix
        email_prefix = admin_email.split("@")[0]
        db.query(User).filter(User.email.like(f"{email_prefix}%")).delete(synchronize_session=False)
        db.commit()
        
        # Get all departments and plants
        departments = db.query(Department).all()
        plants = db.query(Plant).all()
        
        if not departments:
            print("Error: No departments found. Please run seed_departments.py or seed_igl_data.py first.")
            return
            
        if not plants:
            print("Notice: No plants found. Creating default plants first...")
            p1 = Plant(plant_name="Corporate Office", plant_code="CORP", is_active=True)
            p2 = Plant(plant_name="Okhla Plant", plant_code="OKHLA", is_active=True)
            db.add_all([p1, p2])
            db.commit()
            db.refresh(p1)
            db.refresh(p2)
            plants = [p1, p2]
        
        # 1. Create the Main Super Admin account
        print(f"Creating Corporate Super Admin account for {admin_email}...")
        admin_user = User(
            email=admin_email,
            employee_id=admin_email,
            full_name=admin_name,
            hashed_password=hash_password(admin_password),
            role="CORPORATE_SUPER_ADMIN",
            department_id=departments[0].id,
            plant_id=None,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print(f"Main admin account created successfully!")
        
        # 2. Create host accounts for all plant & department combinations
        print("Creating Host entries across all locations and departments...")
        user_count = 0
        email_base, email_domain = admin_email.split("@")
        for plant in plants:
            for dept in departments:
                # Unique email variation (gmail plus addressing)
                unique_email = f"{email_base}+p{plant.id}_d{dept.id}@{email_domain}"
                unique_emp_id = f"EMP_MILIND_P{plant.id}_D{dept.id}"
                
                host_user = User(
                    email=unique_email,
                    employee_id=unique_emp_id,
                    full_name=admin_name,
                    hashed_password=hash_password(admin_password),
                    role="EMPLOYEE",
                    department_id=dept.id,
                    plant_id=plant.id,
                    is_active=True
                )
                db.add(host_user)
                user_count += 1
                
        db.commit()
        print(f"Seeded {user_count} host combinations successfully!")
        print(f"{admin_name} will now be visible as a host employee for all departments and locations.")
    except Exception as e:
        print(f"Error seeding user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_milind_verma()
