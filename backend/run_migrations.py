import sys
import os

# Add the current directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import engine, Base
from app.models.department import Department
from app.models.user import User
from app.models.visitor import Visitor
from app.models.interview import Interview
from app.models.meeting import Meeting

def run_migrations():
    print("Dropping old interviews and meetings tables...")
    Base.metadata.drop_all(bind=engine, tables=[Interview.__table__, Meeting.__table__])
    print("Creating new interviews and meetings tables...")
    Base.metadata.create_all(bind=engine, tables=[Interview.__table__, Meeting.__table__])
    print("Database migrations completed successfully!")

if __name__ == "__main__":
    run_migrations()
