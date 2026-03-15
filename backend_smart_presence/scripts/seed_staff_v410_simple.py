
import sys
import os
import uuid
from sqlalchemy.orm import Session

# Add parent directory to path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core import security
from app.db.session import SessionLocal
from app.models.staff import Staff
from app.models.organization import Organization

def seed_staff_v410_simple(db: Session):
    print("🚀 Seeding Simple Staff for School demo...")
    
    # Ensure organization exists
    org = db.query(Organization).first()
    if not org:
        org = Organization(id=str(uuid.uuid4()), name="School Academy")
        db.add(org)
        db.commit()
        db.refresh(org)
    
    # Simple School Subjects only
    staff_data = [
        {"code": "admin", "name": "System Admin", "pass": "admin", "role": "ADMIN", "subj": "English"},
        {"code": "testclass", "name": "Lab Teacher", "pass": "testclass", "role": "STAFF", "subj": "Physics"},
        {"code": "alice", "name": "Mrs. Alice", "pass": "staff123", "role": "STAFF", "subj": "English"},
        {"code": "bob", "name": "Mr. Bob", "pass": "staff123", "role": "STAFF", "subj": "Tamil"},
        {"code": "charlie", "name": "Mr. Charlie", "pass": "staff123", "role": "STAFF", "subj": "Maths"},
        {"code": "david", "name": "Mrs. David", "pass": "staff123", "role": "STAFF", "subj": "Physics"},
        {"code": "eve", "name": "Miss. Eve", "pass": "staff123", "role": "STAFF", "subj": "Chemistry"},
        {"code": "frank", "name": "Mr. Frank", "pass": "staff123", "role": "STAFF", "subj": "Biology"},
        {"code": "grace", "name": "Mrs. Grace", "pass": "staff123", "role": "STAFF", "subj": "Maths"},
        {"code": "heidi", "name": "Miss. Heidi", "pass": "staff123", "role": "STAFF", "subj": "English"},
        {"code": "ivan", "name": "Mr. Ivan", "pass": "staff123", "role": "STAFF", "subj": "Tamil"},
        {"code": "judy", "name": "Mrs. Judy", "pass": "staff123", "role": "STAFF", "subj": "Chemistry"},
    ]

    for s in staff_data:
        existing = db.query(Staff).filter(Staff.staff_code == s["code"]).first()
        if existing:
            print(f" > Updating {s['code']}...")
            existing.name = s["name"]
            existing.full_name = s["name"]
            existing.role = s["role"]
            existing.primary_subject = s["subj"]
            existing.secondary_subject = None
            existing.tertiary_subject = None
            existing.hashed_password = security.get_password_hash(s["pass"])
            existing.is_superuser = (s["role"] == "ADMIN")
        else:
            print(f" > Creating {s['code']}...")
            new_staff = Staff(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                staff_code=s["code"],
                name=s["name"],
                full_name=s["name"],
                role=s["role"],
                primary_subject=s["subj"],
                hashed_password=security.get_password_hash(s["pass"]),
                is_superuser=(s["role"] == "ADMIN"),
                avatar_url=f"https://ui-avatars.com/api/?name={s['name'].replace(' ', '+')}&background=random&color=fff&size=200&bold=true"
            )
            db.add(new_staff)
    
    db.commit()
    print("✅ Seeding Successful. 12 Simple Staff members ready.")

if __name__ == "__main__":
    db = SessionLocal()
    seed_staff_v410_simple(db)
    db.close()
