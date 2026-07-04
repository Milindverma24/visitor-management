import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.session import SessionLocal
from app.models.visit import Visit
from app.models.visitor import Visitor

db = SessionLocal()
try:
    visit = db.query(Visit).filter(Visit.id == 4).first()
    if visit:
        print(f"Visit ID: {visit.id}")
        print(f"Visit Status: {visit.status}")
        visitor = db.query(Visitor).filter(Visitor.id == visit.visitor_id).first()
        if visitor:
            print(f"Visitor Name: {visitor.full_name}")
            print(f"Visitor Email: {visitor.email}")
            print(f"Visitor Phone: {visitor.phone_number}")
        else:
            print("Visitor record not found!")
    else:
        print("Visit ID 4 not found!")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
