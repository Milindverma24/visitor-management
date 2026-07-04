import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.session import SessionLocal
from app.models.user import User

db = SessionLocal()
try:
    print("Listing all users in database...")
    users = db.query(User).all()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"ID: {u.id}, Name: {u.full_name}, Email: {u.email}, Role: {u.role}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
