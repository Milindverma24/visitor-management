import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import engine, Base

# Import all SQLAlchemy models
from app.models.user import User
from app.models.department import Department
from app.models.visitor import Visitor
from app.models.visit import Visit
from app.models.vendor import Vendor
from app.models.contractor import Contractor
from app.models.material import Material
from app.models.notification import Notification
from app.models.document import Document
from app.models.blacklist import Blacklist
from app.models.audit_log import AuditLog
from app.models.qr_token import QRToken
from app.models.plant import Plant


def run_migrations():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("Done!")


if __name__ == "__main__":
    run_migrations()