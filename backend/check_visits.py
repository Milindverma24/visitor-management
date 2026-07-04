import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.session import SessionLocal
from app.models.visit import Visit
from app.models.user import User

db = SessionLocal()
try:
    print("Checking last 5 visits...")
    visits = db.query(Visit).order_by(Visit.id.desc()).limit(5).all()
    for v in visits:
        print(f"ID: {v.id}, Host: {v.host_employee}, Status: {v.status}, Created At: {v.created_at}")
        # Try to resolve host user
        clean_host_name = v.host_employee.split(" (")[0]
        host_user = db.query(User).filter(User.full_name == clean_host_name).first()
        if not host_user:
            host_user = db.query(User).filter(User.email == clean_host_name).first()
        if not host_user:
            host_user = db.query(User).filter(User.employee_id == clean_host_name).first()
            
        if host_user:
            print(f"  -> Resolved Host User: ID: {host_user.id}, Name: {host_user.full_name}, Email: {host_user.email}")
        else:
            print(f"  -> Could NOT resolve host user for '{clean_host_name}'")
            
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
