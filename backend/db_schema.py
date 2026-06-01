from app.database.session import SessionLocal
from sqlalchemy import inspect
db = SessionLocal()
inspector = inspect(db.get_bind())
for table in ['users', 'visitors', 'visits', 'departments']:
    print(f"\n## Table: {table}")
    columns = inspector.get_columns(table)
    for c in columns:
        print(f"- {c['name']} ({c['type']})")
