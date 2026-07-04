import sys
import os
from sqlalchemy import text

from dotenv import load_dotenv

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
load_dotenv()

from app.database.session import SessionLocal

def clear_data():
    db = SessionLocal()
    try:
        # Get list of existing tables in public schema
        result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
        existing_tables = {row[0] for row in result}
        
        target_tables = [
            "qr_tokens", 
            "notifications", 
            "materials", 
            "documents", 
            "blacklist", 
            "visits", 
            "visitors", 
            "contractor_employees", 
            "contractors", 
            "vendors", 
            "audit_logs", 
            "interviews", 
            "meetings"
        ]
        
        tables_to_truncate = [t for t in target_tables if t in existing_tables]
        
        if tables_to_truncate:
            print("Truncating transactional database tables...")
            tables_str = ", ".join(tables_to_truncate)
            db.execute(text(f"TRUNCATE TABLE {tables_str} RESTART IDENTITY CASCADE;"))
            print(f"Successfully truncated tables: {tables_str}")
        else:
            print("No matching transactional tables found to truncate.")
            
        print("Cleaning up non-admin users...")
        ultimate_email = os.getenv("ULTIMATE_ADMIN_EMAIL", "ultimate@igl.com")
        guard_email = os.getenv("SECURITY_GUARD_EMAIL", "security.guard@igl.com")
        transport_email = os.getenv("TRANSPORT_EMAIL", "transport@igl.com")
        
        # Keep only the core system accounts
        delete_users_query = """
            DELETE FROM users 
            WHERE email NOT IN (:ultimate_email, :guard_email, :transport_email);
        """
        db.execute(text(delete_users_query), {
            "ultimate_email": ultimate_email,
            "guard_email": guard_email,
            "transport_email": transport_email
        })
        
        db.commit()
        print("Successfully cleared all transactional and test data!")
        print("Default Departments, Plant Locations, and Admin Logins remain untouched.")
    except Exception as e:
        print(f"Error occurred while clearing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_data()
