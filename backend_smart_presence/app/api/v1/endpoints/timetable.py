from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.db.session import get_db

router = APIRouter()


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

    entry = models.Timetable(
        group_id=entry_in.group_id,
        day_of_week=entry_in.day_of_week,
        period=entry_in.period,
        subject=entry_in.subject,
        staff_id=entry_in.staff_id,
        start_time=entry_in.start_time,
        end_time=entry_in.end_time,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/check-availability", response_model=Any)
def check_staff_availability(
    day_of_week: int,
    period: int,
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(deps.get_current_active_superuser),
) -> Any:
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
            "primary_subject": s.primary_subject,
            "avatar": s.avatar_url
        }
        
        if s.id in busy_ids:
            # Find what class they are in
            entry = next((e for e in busy_staff_entries if e.staff_id == s.id), None)
            staff_data["busy_with"] = entry.subject if entry else "Other Class"
            busy.append(staff_data)
        else:
            # If they match the desired subject, recommend them
            if subject and s.primary_subject and subject.lower() in s.primary_subject.lower():
                recommended.append(staff_data)
            else:
                available.append(staff_data)

    return {
        "recommended": recommended,
        "available": available,
        "busy": busy
    }


@router.get("/{entry_id}", response_model=schemas.Timetable)
def read_timetable_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(deps.get_current_active_user),
) -> Any:
    entry = db.query(models.Timetable).filter(models.Timetable.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    return entry


@router.patch("/{entry_id}", response_model=schemas.Timetable)
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


@router.delete("/{entry_id}")
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
