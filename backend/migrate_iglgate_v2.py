##################################################
# IGLGATE v2.0 — FULL DATABASE MIGRATION
# Creates all new tables for the IGLGATE platform
# Safe to run on existing database (uses CREATE TABLE IF NOT EXISTS via SQLAlchemy)
##################################################

import sys
import os

# Ensure we're running from the backend directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.database import Base, engine

##################################################
# IMPORT ALL EXISTING MODELS (already in DB)
##################################################
from app.models.user import User
from app.models.visitor import Visitor
from app.models.visit import Visit
from app.models.audit_log import AuditLog

from app.models.department import Department

##################################################
# IMPORT ALL NEW IGLGATE v2.0 MODELS
##################################################

from app.models.contractor import Contractor, ContractorEmployee
from app.models.vendor import Vendor
from app.models.material import Material
from app.models.qr_token import QRToken
from app.models.blacklist import Blacklist
from app.models.document import Document
from app.models.notification import Notification

##################################################
# RUN MIGRATION
##################################################

def run_migration():
    print("=" * 60)
    print("  IGLGATE v2.0 — DATABASE MIGRATION")
    print("  Indian Glycol Limited")
    print("=" * 60)
    print()
    
    print("📡 Connecting to database...")
    
    try:
        with engine.connect() as conn:
            print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection FAILED: {e}")
        sys.exit(1)
    
    print()
    print("📋 Creating new tables (existing tables are untouched)...")
    print()
    
    # SQLAlchemy's create_all uses CREATE TABLE IF NOT EXISTS semantics
    # — existing tables are never dropped or modified
    tables_before = set()
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables_before = set(inspector.get_table_names())
        print(f"   Existing tables found: {len(tables_before)}")
    except Exception as e:
        print(f"   (Could not list existing tables: {e})")
    
    print()
    
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"❌ Migration FAILED: {e}")
        sys.exit(1)
    
    # Report what was created
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables_after = set(inspector.get_table_names())
        new_tables = tables_after - tables_before
        
        print("✅ Migration complete!")
        print()
        
        if new_tables:
            print(f"🆕 New tables created ({len(new_tables)}):")
            for t in sorted(new_tables):
                print(f"   ✓ {t}")
        else:
            print("ℹ️  No new tables created (all tables already existed).")
        
        print()
        print(f"📊 Total tables in database: {len(tables_after)}")
        print()
        print("All tables:")
        for t in sorted(tables_after):
            marker = "🆕" if t in new_tables else "  "
            print(f"  {marker} {t}")
        
    except Exception as e:
        print(f"⚠️  Migration ran but could not generate report: {e}")
    
    print()
    print("=" * 60)
    print("  ✅ IGLGATE v2.0 Migration Successful!")
    print("=" * 60)

if __name__ == "__main__":
    run_migration()
