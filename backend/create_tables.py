##################################################
# DATABASE IMPORTS
##################################################

from app.database.database import Base
from app.database.database import engine

##################################################
# MODEL IMPORTS
##################################################

from app.models.user import User
from app.models.visitor import Visitor
from app.models.visit import Visit
from app.models.audit_log import AuditLog
from app.models.meeting import Meeting
from app.models.interview import Interview

##################################################
# CREATE ALL TABLES
##################################################

print("Creating tables...")

Base.metadata.create_all(bind=engine)

print("Tables created successfully")