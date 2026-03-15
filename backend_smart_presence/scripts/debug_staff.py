
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")
from app.db.session import SessionLocal
from app.models.staff import Staff

db = SessionLocal()
staff = db.query(Staff).all()
print(f"Total Staff: {len(staff)}")
for s in staff:
    print(f" - {s.name} ({s.staff_code}): {s.primary_subject}, {s.secondary_subject}, {s.tertiary_subject}")
db.close()
