from app.database.session import SessionLocal
from app.models.department import Department

db = SessionLocal()

dept_data = [
    {"name": "Production", "code": "PROD"},
    {"name": "Maintenance", "code": "MAINT"},
    {"name": "Safety", "code": "SAFE"},
    {"name": "Finance", "code": "FIN"},
    {"name": "Sales", "code": "SALES"},
    {"name": "Marketing", "code": "MKTG"},
    {"name": "Legal", "code": "LGL"},
    {"name": "Operations", "code": "OPS"}
]

for d in dept_data:
    dept = db.query(Department).filter(Department.code == d["code"]).first()
    if not dept:
        dept = Department(name=d["name"], code=d["code"])
        db.add(dept)
        print(f"Added {d['name']}")
    else:
        print(f"Skipped {d['name']} (already exists)")

db.commit()
db.close()
print("Departments updated.")
