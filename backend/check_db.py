from app.database.session import SessionLocal
from app.models.visit import Visit
from datetime import datetime

db = SessionLocal()
visits = db.query(Visit).filter(Visit.id.in_([8, 9])).all()

for v in visits:
    print(f"ID: {v.id}, Status: {v.status}, CheckIn: {v.check_in_time}, ValidUpTo: {v.valid_up_to}, Now: {datetime.utcnow()}")
