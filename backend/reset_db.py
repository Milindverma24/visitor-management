from app.database.database import engine, Base
from app.models.user import User
from app.models.visitor import Visitor
from app.models.visit import Visit
from app.models.audit_log import AuditLog
from app.models.meeting import Meeting
from app.models.interview import Interview
from app.models.department import Department
print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)
print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
