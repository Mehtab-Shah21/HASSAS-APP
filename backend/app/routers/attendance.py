from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import require_active_business_id, require_admin
from app.models.attendance import Attendance, AttendanceStatus
from app.models.user import User, UserRole
from app.schemas.attendance import (
    AttendanceMark,
    AttendanceResponse,
    DayAttendanceEntry,
    DayAttendanceResponse,
    EmployeeTotals,
    TodayStrip,
)
from app.services.audit import write_audit_log

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


def _active_employees(db: Session) -> list[User]:
    return (
        db.query(User)
        .filter(User.role == UserRole.employee, User.is_active.is_(True))
        .order_by(User.first_name)
        .all()
    )


@router.post("/mark", response_model=AttendanceResponse)
def mark_attendance(
    payload: AttendanceMark,
    business_id: int = Depends(require_active_business_id),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    existing = (
        db.query(Attendance)
        .filter(Attendance.user_id == payload.user_id, Attendance.date == payload.date)
        .first()
    )
    if existing:
        existing.status = payload.status
        existing.note = payload.note
        existing.business_id = business_id
        write_audit_log(
            db, user_id=current_user.id, business_id=business_id, action="update",
            entity_type="attendance", entity_id=existing.id,
            description=f"Marked user {payload.user_id} as {payload.status.value} on {payload.date}",
        )
        db.commit()
        db.refresh(existing)
        return existing

    record = Attendance(
        business_id=business_id,
        user_id=payload.user_id,
        date=payload.date,
        status=payload.status,
        note=payload.note,
    )
    db.add(record)
    db.flush()
    write_audit_log(
        db, user_id=current_user.id, business_id=business_id, action="create",
        entity_type="attendance", entity_id=record.id,
        description=f"Marked user {payload.user_id} as {payload.status.value} on {payload.date}",
    )
    db.commit()
    db.refresh(record)
    return record


@router.get("/day", response_model=DayAttendanceResponse)
def day_attendance(
    date_: date = Query(alias="date"),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    employees = _active_employees(db)
    records = {a.user_id: a for a in db.query(Attendance).filter(Attendance.date == date_).all()}
    entries = [
        DayAttendanceEntry(
            user_id=emp.id,
            user_name=emp.display_name or f"{emp.first_name} {emp.last_name or ''}".strip(),
            status=records[emp.id].status if emp.id in records else None,
            note=records[emp.id].note if emp.id in records else None,
        )
        for emp in employees
    ]
    return DayAttendanceResponse(date=date_, entries=entries)


@router.get("/totals", response_model=list[EmployeeTotals])
def totals(
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    employees = _active_employees(db)
    records = db.query(Attendance).filter(Attendance.date >= date_from, Attendance.date <= date_to).all()

    counts: dict[int, dict[str, int]] = {emp.id: {"present": 0, "absent": 0, "leave": 0} for emp in employees}
    for r in records:
        if r.user_id in counts:
            counts[r.user_id][r.status.value] += 1

    return [
        EmployeeTotals(
            user_id=emp.id,
            user_name=emp.display_name or f"{emp.first_name} {emp.last_name or ''}".strip(),
            present=counts[emp.id]["present"],
            absent=counts[emp.id]["absent"],
            leave=counts[emp.id]["leave"],
        )
        for emp in employees
    ]


@router.get("/today-strip", response_model=TodayStrip)
def today_strip(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    today = date.today()
    employees = _active_employees(db)
    records = {a.user_id: a.status for a in db.query(Attendance).filter(Attendance.date == today).all()}
    present = sum(1 for e in employees if records.get(e.id) == AttendanceStatus.present)
    absent = sum(1 for e in employees if records.get(e.id) == AttendanceStatus.absent)
    leave = sum(1 for e in employees if records.get(e.id) == AttendanceStatus.leave)
    unmarked = len(employees) - present - absent - leave
    return TodayStrip(present_today=present, absent_today=absent, leave_today=leave, unmarked_today=unmarked)
