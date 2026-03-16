"""Class schedule and live class endpoints."""
from typing import Any, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.api import deps
from app.db.session import get_db

router = APIRouter()


@router.get("/live")
def get_live_classes(
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(deps.get_current_active_user),
) -> Any:
    """Get currently active classes based on timetable and current time."""
    now = datetime.utcnow()
    # Python: Monday=0, isoweekday: Monday=1
    day_of_week = now.isoweekday()
    current_time = now.time()

    org_id = current_user.organization_id
    entries = (
        db.query(models.Timetable)
        .join(models.Group, models.Group.id == models.Timetable.group_id)
        .filter(
            models.Timetable.day_of_week == day_of_week,
            models.Group.organization_id == org_id,
        )
        .all()
    )

    live = []
    for entry in entries:
        # Check if current time is within the period
        if entry.start_time and entry.end_time:
            if entry.start_time <= current_time <= entry.end_time:
                group = db.query(models.Group).filter(models.Group.id == entry.group_id).first()
                staff = db.query(models.Staff).filter(models.Staff.id == entry.staff_id).first() if entry.staff_id else None
                live.append({
                    "group_id": str(entry.group_id),
                    "group_name": group.name if group else "Unknown",
                    "subject": entry.subject,
                    "period": entry.period,
                    "teacher_name": staff.name if staff else "TBD",
                    "start_time": entry.start_time.isoformat() if entry.start_time else None,
                    "end_time": entry.end_time.isoformat() if entry.end_time else None,
                })

    return live


# ── Global Period Timings (Institution-wide defaults) ──
GLOBAL_PERIOD_TIMINGS = {
    1: {"start": "09:00:00", "end": "10:00:00"},
    2: {"start": "10:00:00", "end": "11:00:00"},
    3: {"start": "11:00:00", "end": "12:00:00"},
}


@router.get("/{class_id}/schedule/today")
def get_class_schedule_today(
    class_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(deps.get_current_active_user),
) -> Any:
    """Get today's schedule for a specific class."""
    from datetime import time as dt_time, timedelta
    from app.models.attendance import AttendanceSession

    # Verify group exists
    group = db.query(models.Group).filter(models.Group.id == class_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Class not found")

    day_of_week = datetime.utcnow().isoweekday()

    entries = db.query(models.Timetable).filter(
        models.Timetable.group_id == class_id,
        models.Timetable.day_of_week == day_of_week,
    ).order_by(models.Timetable.period).all()

    # Check today's attendance sessions for this class to detect late entries
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_sessions = db.query(AttendanceSession).filter(
        AttendanceSession.group_id == class_id,
        AttendanceSession.started_at >= today_start,
        AttendanceSession.status == "COMPLETED",
    ).all()

    result = []
    for entry in entries:
        staff = db.query(models.Staff).filter(models.Staff.id == entry.staff_id).first() if entry.staff_id else None
        
        # Use global timing as fallback if entry doesn't have specific times
        global_timing = GLOBAL_PERIOD_TIMINGS.get(entry.period, {})
        effective_start = entry.start_time
        effective_end = entry.end_time
        
        if not effective_start and global_timing.get("start"):
            parts = global_timing["start"].split(":")
            effective_start = dt_time(int(parts[0]), int(parts[1]))
        if not effective_end and global_timing.get("end"):
            parts = global_timing["end"].split(":")
            effective_end = dt_time(int(parts[0]), int(parts[1]))
        
        time_str = f"{effective_start.strftime('%H:%M') if effective_start else '?'} - {effective_end.strftime('%H:%M') if effective_end else '?'}"
        
        # Check if attendance was taken late for this period
        attendance_taken_late = False
        if effective_end and today_sessions:
            for s in today_sessions:
                if s.ended_at and s.ended_at.time() > effective_end:
                    attendance_taken_late = True
                    break
        
        result.append({
            "id": str(entry.id),
            "period": entry.period,
            "subject": entry.subject,
            "teacher_name": staff.name if staff else "TBD",
            "staff_id": str(entry.staff_id) if entry.staff_id else None,
            "time": time_str,
            "start_time": effective_start.isoformat() if effective_start else None,
            "end_time": effective_end.isoformat() if effective_end else None,
            "attendance_taken_late": attendance_taken_late,
        })

    return result

