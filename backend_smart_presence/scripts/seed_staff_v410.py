
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

def seed_staff(db: Session):
    print("🚀 Seeding Staff for Smart Suggestion demo...")
    
    # Ensure organization exists
    org = db.query(Organization).first()
    if not org:
        org = Organization(id=str(uuid.uuid4()), name="Smart Academy")
        db.add(org)
        db.commit()
        db.refresh(org)
    
    staff_data = [
        {"code": "admin", "name": "System Admin", "pass": "admin", "role": "ADMIN", "subj": "Administration"},
        {"code": "testclass", "name": "Test Instructor", "pass": "testclass", "role": "STAFF", "subj": "General Testing"},
        {"code": "alice", "name": "Dr. Alice Vance", "pass": "staff123", "role": "STAFF", "subj": "ARTIFICIAL INTELLIGENCE", "subj2": "PYTHON", "subj3": "MACHINE LEARNING"},
        {"code": "bob", "name": "Prof. Bob Smith", "pass": "staff123", "role": "STAFF", "subj": "PYTHON", "subj2": "DATA STRUCTURES", "subj3": "ALGORITHMS"},
        {"code": "charlie", "name": "Charlie Brown", "pass": "staff123", "role": "STAFF", "subj": "MATHEMATICS", "subj2": "STATISTICS", "subj3": "CALCULUS"},
        {"code": "david", "name": "David Miller", "pass": "staff123", "role": "STAFF", "subj": "PHYSICS", "subj2": "MECHANICS", "subj3": "THERMODYNAMICS"},
        {"code": "eve", "name": "Eve Adams", "pass": "staff123", "role": "STAFF", "subj": "CYBERSECURITY", "subj2": "NETWORKING", "subj3": "CRYPTOGRAPHY"},
        {"code": "frank", "name": "Frank Castle", "pass": "staff123", "role": "STAFF", "subj": "DATA SCIENCE", "subj2": "SQL", "subj3": "PANDAS"},
        {"code": "grace", "name": "Grace Hopper", "pass": "staff123", "role": "STAFF", "subj": "WEB DEVELOPMENT", "subj2": "JAVASCRIPT", "subj3": "CSS"},
        {"code": "heidi", "name": "Heidi Klum", "pass": "staff123", "role": "STAFF", "subj": "CLOUD COMPUTING", "subj2": "AWS", "subj3": "DOCKER"},
        {"code": "ivan", "name": "Ivan Drago", "pass": "staff123", "role": "STAFF", "subj": "DATABASE SYSTEMS", "subj2": "NOSQL", "subj3": "POSTGRES"},
        {"code": "judy", "name": "Judy Dench", "pass": "staff123", "role": "STAFF", "subj": "NETWORKING", "subj2": "TCP/IP", "subj3": "ROUTING"},
    ]

    for s in staff_data:
        existing = db.query(Staff).filter(Staff.staff_code == s["code"]).first()
        if existing:
            print(f" > Updating {s['code']}...")
            existing.name = s["name"]
            existing.full_name = s["name"]
            existing.role = s["role"]
            existing.primary_subject = s["subj"]
            if "subj2" in s: existing.secondary_subject = s["subj2"]
            if "subj3" in s: existing.tertiary_subject = s["subj3"]
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
                secondary_subject=s.get("subj2"),
                tertiary_subject=s.get("subj3"),
                hashed_password=security.get_password_hash(s["pass"]),
                is_superuser=(s["role"] == "ADMIN"),
                avatar_url=f"https://ui-avatars.com/api/?name={s['name'].replace(' ', '+')}&background=random&color=fff&size=200&bold=true"
            )
            db.add(new_staff)
    
    db.commit()
    print("✅ Seeding Successful. 12 Staff members ready.")

if __name__ == "__main__":
    db = SessionLocal()
    seed_staff(db)
    db.close()
