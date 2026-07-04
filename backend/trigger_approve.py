import os
import sys
from datetime import datetime, timedelta
from jose import jwt

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.session import SessionLocal
from app.core.config import settings
from app.models.visit import Visit
from app.api.approvals.routes import approve_visit_email, create_approval_token

class DummyBackgroundTasks:
    def add_task(self, func, *args, **kwargs):
        print(f"Adding background task: {func.__name__}")
        # Run it synchronously for testing
        try:
            func(*args, **kwargs)
            print("Background task finished successfully!")
        except Exception as e:
            print(f"Background task failed: {e}")

db = SessionLocal()
try:
    visit_id = 4
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        print(f"Visit ID {visit_id} not found!")
        sys.exit(1)
        
    print(f"Simulating approval button click for Visit ID {visit_id}...")
    print(f"Current Status: {visit.status}")
    
    token = create_approval_token(visit_id)
    print(f"Generated Token: {token}")
    
    # We call approve_visit_email directly
    bg_tasks = DummyBackgroundTasks()
    html_response = approve_visit_email(
        request_id=visit_id,
        token=token,
        background_tasks=bg_tasks,
        db=db
    )
    
    print("\nResponse Received:")
    print(html_response)
    
    # Re-fetch visit to check status
    db.refresh(visit)
    print(f"\nNew Status: {visit.status}")
    
except Exception as e:
    print(f"Exception during simulation: {e}")
finally:
    db.close()
