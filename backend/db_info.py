from app.database.session import SessionLocal
from sqlalchemy import inspect, text
db = SessionLocal()
inspector = inspect(db.get_bind())
tables = inspector.get_table_names()
result = []
for t in tables:
    try:
        count = db.execute(text(f'SELECT count(*) FROM "{t}"')).scalar()
        result.append((t, count))
    except Exception as e:
        print(f"Error for {t}: {e}")
        db.rollback()
print(result)
