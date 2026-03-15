
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")
from app.db.session import SessionLocal
from app.models.staff import Staff

db = SessionLocal()
s = db.query(Staff).filter(Staff.staff_code == 'charlie').first()
if s:
    print(f"Found Charlie: {s.name}")
    print(f"Subjects: {s.primary_subject}, {s.secondary_subject}, {s.tertiary_subject}")
else:
    print("Charlie not found")
db.close()
