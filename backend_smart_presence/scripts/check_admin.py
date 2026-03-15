
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")
from app.db.session import SessionLocal
from app.models.staff import Staff

db = SessionLocal()
s = db.query(Staff).filter(Staff.staff_code == 'admin').first()
if s:
    print(f"Admin is superuser: {s.is_superuser}")
    print(f"Admin is active: {s.is_active}")
else:
    print("Admin not found")
db.close()
