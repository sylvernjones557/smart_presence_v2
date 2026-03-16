from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.db.session import get_db

router = APIRouter()

# ── Global Period Timings (Institution-wide defaults) ──
GLOBAL_PERIOD_TIMINGS = {
    1: {"start": "09:00:00", "end": "10:00:00"},
    2: {"start": "10:00:00", "end": "11:00:00"},
    3: {"start": "11:00:00", "end": "12:00:00"},
}


@router.post("/intelligent-availability", response_model=Any)
def check_staff_availability(
    request_data: dict,  # Expect { "day_of_week": int, "period": int, "subject": str }
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(deps.get_current_active_user),
) -> Any:
    """Find available staff for a specific timetable slot."""
    day_of_week = request_data.get("day_of_week", 1)
    period = request_data.get("period", 1)
    subject = request_data.get("subject")
    
    """Find available staff for a specific timetable slot."""
    # 1. Get all staff
    all_staff = db.query(models.Staff).filter(models.Staff.is_active == True).all()
    
    # 2. Get IDs of staff who are ALREADY busy in this slot
    busy_staff_entries = db.query(models.Timetable).filter(
        models.Timetable.day_of_week == day_of_week,
        models.Timetable.period == period,
        models.Timetable.staff_id.isnot(None)
    ).all()
    
    busy_ids = {entry.staff_id for entry in busy_staff_entries}
    
    available = []
    recommended = []
    busy = []

    for s in all_staff:
        staff_data = {
            "id": s.id,
            "name": s.name,
            "specializations": [s.primary_subject, getattr(s, 'secondary_subject', None), getattr(s, 'tertiary_subject', None)],
            "avatar": s.avatar_url
        }
        
        if s.id in busy_ids:
            # Find what class they are in
            entry = next((e for e in busy_staff_entries if e.staff_id == s.id), None)
            staff_data["busy_with"] = entry.subject if entry else "Other Class"
            busy.append(staff_data)
        else:
            # RANKING LOGIC: 1=Primary(Expert), 2=Secondary(Advanced), 3=Tertiary(Advanced), 0=None(Substitute)
            priority = 0
            if subject:
                query = subject.lower()
                if s.primary_subject and query in s.primary_subject.lower():
                    priority = 1
                elif hasattr(s, 'secondary_subject') and s.secondary_subject and query in s.secondary_subject.lower():
                    priority = 2
                elif hasattr(s, 'tertiary_subject') and s.tertiary_subject and query in s.tertiary_subject.lower():
                    priority = 3

            staff_data["priority"] = priority

            if priority == 1:
                staff_data["tier"] = "EXPERT"
                recommended.append(staff_data)
            elif priority > 1:
                staff_data["tier"] = "ADVANCED"
                recommended.append(staff_data)
            else:
                staff_data["tier"] = "SUBSTITUTE"
                available.append(staff_data)

    # Sort recommended to show Experts first
    recommended.sort(key=lambda x: x["priority"])

    return {
        "recommended": recommended,
        "available": available,
        "busy": busy
    }


@router.get("/", response_model=List[schemas.Timetable])
def read_timetable(
    db: Session = Depends(get_db),
    group_id: Optional[UUID] = Query(None),
    staff_id: Optional[UUID] = Query(None),
    day_of_week: Optional[int] = Query(None),
    current_user: models.Staff = Depends(deps.get_current_active_user),
) -> Any:
    query = db.query(models.Timetable)
    if group_id:
        query = query.filter(models.Timetable.group_id == group_id)
    if staff_id:
        query = query.filter(models.Timetable.staff_id == staff_id)
    if day_of_week:
        query = query.filter(models.Timetable.day_of_week == day_of_week)
    return query.order_by(models.Timetable.day_of_week, models.Timetable.period).all()


@router.post("/", response_model=schemas.Timetable)
def create_timetable_entry(
    *,
    db: Session = Depends(get_db),
    entry_in: schemas.TimetableCreate,
    current_user: models.Staff = Depends(deps.get_current_active_superuser),
) -> Any:
    from datetime import time as dt_time

    # 1. Verify group exists
    group = db.query(models.Group).filter(models.Group.id == entry_in.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # 2. Strict Conflict Check: Is this class already booked for this slot?
    existing_class_slot = db.query(models.Timetable).filter(
        models.Timetable.group_id == entry_in.group_id,
        models.Timetable.day_of_week == entry_in.day_of_week,
        models.Timetable.period == entry_in.period
    ).first()
    if existing_class_slot:
        raise HTTPException(
            status_code=400, 
            detail=f"{group.name} already has a {existing_class_slot.subject} period at this time."
        )

    # 3. Verify staff and check for Staff Overlap
    if entry_in.staff_id:
        staff = db.query(models.Staff).filter(models.Staff.id == entry_in.staff_id).first()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff not found")
        
        # Check if teacher is already in another class at this time
        busy_check = db.query(models.Timetable).filter(
            models.Timetable.staff_id == entry_in.staff_id,
            models.Timetable.day_of_week == entry_in.day_of_week,
            models.Timetable.period == entry_in.period
        ).first()
        if busy_check:
            busy_group = db.query(models.Group).filter(models.Group.id == busy_check.group_id).first()
            raise HTTPException(
                status_code=400, 
                detail=f"{staff.name} is already assigned to {busy_group.name if busy_group else 'another class'} during this period."
            )

    # Auto-fill global period timings if not provided
    effective_start = entry_in.start_time
    effective_end = entry_in.end_time
    global_timing = GLOBAL_PERIOD_TIMINGS.get(entry_in.period, {})
    
    if not effective_start and global_timing.get("start"):
        parts = global_timing["start"].split(":")
        effective_start = dt_time(int(parts[0]), int(parts[1]))
    if not effective_end and global_timing.get("end"):
        parts = global_timing["end"].split(":")
        effective_end = dt_time(int(parts[0]), int(parts[1]))

    entry = models.Timetable(
        group_id=entry_in.group_id,
        day_of_week=entry_in.day_of_week,
        period=entry_in.period,
        subject=entry_in.subject,
        staff_id=entry_in.staff_id,
        start_time=effective_start,
        end_time=effective_end,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry




@router.get("/entry/{entry_id}", response_model=schemas.Timetable)
def read_timetable_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(deps.get_current_active_user),
) -> Any:
    entry = db.query(models.Timetable).filter(models.Timetable.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    return entry


@router.patch("/entry/{entry_id}", response_model=schemas.Timetable)
def update_timetable_entry(
    entry_id: UUID,
    entry_update: schemas.TimetableUpdate,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(deps.get_current_active_superuser),
) -> Any:
    entry = db.query(models.Timetable).filter(models.Timetable.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    update_data = entry_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/entry/{entry_id}")
def delete_timetable_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(deps.get_current_active_superuser),
) -> Any:
    entry = db.query(models.Timetable).filter(models.Timetable.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Timetable entry deleted"}
