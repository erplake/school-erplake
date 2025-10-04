from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text
from app.core.db import get_session
from app.core.security import get_current_user, require
from app.core.tenant import audit
from typing import Any

router = APIRouter(prefix="/teacher", tags=["teacher"])

# Placeholder models imports - adjust when actual teacher/class models consolidated
from app.modules.core import models_new as core_models
from app.modules.attendance import models as attendance_models
from app.modules.gallery import models as gallery_models
from datetime import date, timedelta
from pydantic import BaseModel
from typing import Optional
from fastapi import Body

class AttendanceMarkIn(BaseModel):
    student_id: int
    status: str  # 'present'|'absent'|'late'|'excused'

class AttendanceSubmitIn(BaseModel):
    date: date
    marks: list[AttendanceMarkIn]

VALID_ATT_STATUS = {'present','absent','late','excused'}

# TEMP DEV: removed permission dependency require('teacher:overview_read') while RBAC disabled
@router.get('/overview')
async def teacher_overview(session: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    """Aggregate dashboard for a teacher.

    Returns counts, attendance completion for today, last 7 day attendance rates per class,
    and recent gallery uploads (latest 5 across all classes taught).
    """
    teacher_id = getattr(current_user, 'id', None)
    if teacher_id is None:
        # DEV STUB: allow unauthenticated access for frontend integration.
        # Assign a fallback teacher id (1). Remove this block once real auth is wired on the UI.
        teacher_id = 1

    # For now we approximate class ownership: class_teacher column in ClassSection maps to staff.id which maps to user_account.id? (Assumption)
    # If mismatch arises adjust linkage here.
    class_q = select(core_models.ClassSection).where(core_models.ClassSection.class_teacher == teacher_id)
    try:
        classes = (await session.execute(class_q)).scalars().all()
    except Exception as e:  # permission or missing table issues
        msg = str(e).lower()
        if 'permission denied' in msg or 'insufficientprivilege' in msg:
            return {
                'totals': {'classes': 0, 'students': 0},
                'attendance_today': [],
                'recent_gallery_images': [],
                'transport_duty': {'has_duty_today': False,'assigned_routes':0},
                'warning': 'Database role lacks SELECT privilege on academics.class_section (grant needed).'
            }
        raise
    class_ids = [c.id for c in classes]
    total_classes = len(class_ids)

    total_students = 0
    if class_ids:
        enroll_q = select(func.count()).select_from(core_models.Enrollment).where(core_models.Enrollment.class_section_id.in_(class_ids))
        total_students = (await session.execute(enroll_q)).scalar_one()

    today = date.today()
    # Attendance stats: for each class count enrolled vs number of attendance records for today's date
    attendance_completion = []
    if class_ids:
        # per class enrollment counts
        enroll_counts_q = (
            select(core_models.Enrollment.class_section_id, func.count().label('enrolled'))
            .where(core_models.Enrollment.class_section_id.in_(class_ids))
            .group_by(core_models.Enrollment.class_section_id)
        )
        enroll_counts = {r.class_section_id: r.enrolled for r in (await session.execute(enroll_counts_q)).all()}

        # attendance rows today -> need join student->enrollment to filter by classes
        att_today_q = (
            select(core_models.Enrollment.class_section_id, func.count().label('marked'))
            .select_from(attendance_models.AttendanceStudent)
            .join(core_models.CoreStudent, core_models.CoreStudent.id == attendance_models.AttendanceStudent.student_id)
            .join(core_models.Enrollment, core_models.Enrollment.student_id == core_models.CoreStudent.id)
            .where(attendance_models.AttendanceStudent.date == today, core_models.Enrollment.class_section_id.in_(class_ids))
            .group_by(core_models.Enrollment.class_section_id)
        )
        marked_counts = {r.class_section_id: r.marked for r in (await session.execute(att_today_q)).all()}

        for cid in class_ids:
            enrolled = enroll_counts.get(cid, 0)
            marked = marked_counts.get(cid, 0)
            pct = (marked / enrolled * 100.0) if enrolled else 0.0
            attendance_completion.append({'class_section_id': cid, 'enrolled': enrolled, 'marked_today': marked, 'percent_marked': round(pct,1)})

    # Recent gallery uploads (latest 5)
    recent_images = []
    if class_ids:
        recent_q = (
            select(gallery_models.ClassGalleryImage)
            .where(gallery_models.ClassGalleryImage.class_section_id.in_(class_ids), gallery_models.ClassGalleryImage.is_deleted == False)
            .order_by(gallery_models.ClassGalleryImage.created_at.desc())
            .limit(5)
        )
        recent_images = (await session.execute(recent_q)).scalars().all()
        recent_images = [
            {
                'id': img.id,
                'class_section_id': img.class_section_id,
                'original_filename': img.original_filename,
                'created_at': img.created_at,
            } for img in recent_images
        ]

    # Transport duty stub (placeholder) – replace with real model when available
    transport_duty = {
        'has_duty_today': False,
        'assigned_routes': 0,
    }

    return {
        'totals': {
            'classes': total_classes,
            'students': total_students,
        },
        'attendance_today': attendance_completion,
        'recent_gallery_images': recent_images,
        'transport_duty': transport_duty,
    }

# TEMP DEV: removed permission dependency require('teacher:class_dashboard') while RBAC disabled
@router.get('/class/{class_section_id}')
async def class_dashboard(class_section_id: int, session: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    cls = (await session.execute(select(core_models.ClassSection).where(core_models.ClassSection.id==class_section_id))).scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail='Class not found')

    # Student count
    student_count = (await session.execute(select(func.count()).select_from(core_models.Enrollment).where(core_models.Enrollment.class_section_id==class_section_id))).scalar_one()

    today = date.today()
    # Attendance today counts
    enrolled_q = select(func.count()).select_from(core_models.Enrollment).where(core_models.Enrollment.class_section_id==class_section_id)
    enrolled = (await session.execute(enrolled_q)).scalar_one()
    marked_q = (
        select(func.count())
        .select_from(attendance_models.AttendanceStudent)
        .join(core_models.CoreStudent, core_models.CoreStudent.id == attendance_models.AttendanceStudent.student_id)
        .join(core_models.Enrollment, core_models.Enrollment.student_id == core_models.CoreStudent.id)
        .where(core_models.Enrollment.class_section_id==class_section_id, attendance_models.AttendanceStudent.date==today)
    )
    marked = (await session.execute(marked_q)).scalar_one()
    attendance_percent = round((marked / enrolled * 100.0),1) if enrolled else 0.0

    # Recent 10 images for this class
    images_q = (
        select(gallery_models.ClassGalleryImage)
        .where(gallery_models.ClassGalleryImage.class_section_id==class_section_id, gallery_models.ClassGalleryImage.is_deleted==False)
        .order_by(gallery_models.ClassGalleryImage.created_at.desc())
        .limit(10)
    )
    imgs = (await session.execute(images_q)).scalars().all()
    imgs = [
        {
            'id': img.id,
            'original_filename': img.original_filename,
            'created_at': img.created_at,
        } for img in imgs
    ]

    return {
        'class_section_id': class_section_id,
        'name': getattr(cls, 'grade_label', None),
        'section_label': getattr(cls, 'section_label', None),
        'student_count': student_count,
        'attendance_today': {
            'enrolled': enrolled,
            'marked': marked,
            'percent_marked': attendance_percent,
        },
        'recent_gallery_images': imgs,
    }

# ---------- New endpoints powering TeacherClassManager UI ----------
@router.get('/classes')
async def list_teacher_classes(session: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    """Return all class sections assigned to the current teacher with basic metrics."""
    teacher_id = getattr(current_user, 'id', None) or 1  # dev stub fallback
    class_q = select(core_models.ClassSection).where(core_models.ClassSection.class_teacher == teacher_id)
    classes = (await session.execute(class_q)).scalars().all()
    if not classes:
        return { 'classes': [] }
    class_ids = [c.id for c in classes]
    today = date.today()

    enroll_counts_q = (
        select(core_models.Enrollment.class_section_id, func.count().label('enrolled'))
        .where(core_models.Enrollment.class_section_id.in_(class_ids))
        .group_by(core_models.Enrollment.class_section_id)
    )
    enroll_counts = {r.class_section_id: r.enrolled for r in (await session.execute(enroll_counts_q)).all()}

    marked_q = (
        select(core_models.Enrollment.class_section_id, func.count().label('marked'))
        .select_from(attendance_models.AttendanceStudent)
        .join(core_models.CoreStudent, core_models.CoreStudent.id == attendance_models.AttendanceStudent.student_id)
        .join(core_models.Enrollment, core_models.Enrollment.student_id == core_models.CoreStudent.id)
        .where(attendance_models.AttendanceStudent.date == today, core_models.Enrollment.class_section_id.in_(class_ids))
        .group_by(core_models.Enrollment.class_section_id)
    )
    marked_counts = {r.class_section_id: r.marked for r in (await session.execute(marked_q)).all()}

    gallery_q = (
        select(
            gallery_models.ClassGalleryImage.class_section_id.label('cid'),
            func.count().label('img_count'),
            func.max(gallery_models.ClassGalleryImage.created_at).label('last_created')
        )
        .where(gallery_models.ClassGalleryImage.class_section_id.in_(class_ids), gallery_models.ClassGalleryImage.is_deleted == False)
        .group_by(gallery_models.ClassGalleryImage.class_section_id)
    )
    gallery_stats = {r.cid: (r.img_count, r.last_created) for r in (await session.execute(gallery_q)).all()}

    results = []
    for c in classes:
        enrolled = enroll_counts.get(c.id, 0)
        marked = marked_counts.get(c.id, 0)
        pct = round((marked / enrolled * 100.0), 1) if enrolled else 0.0
        img_count, last_created = gallery_stats.get(c.id, (0, None))
        results.append({
            'id': c.id,
            'grade_label': getattr(c, 'grade_label', None),
            'section_label': getattr(c, 'section_label', None),
            'enrolled': enrolled,
            'marked_today': marked,
            'attendance_percent': pct,
            'recent_images': img_count,
            'last_image_at': last_created,
        })
    return { 'classes': results }

@router.get('/class/{class_section_id}/roster')
async def class_roster(class_section_id: int, session: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    """Return roster for a specific class with basic student info."""
    cls = (await session.execute(select(core_models.ClassSection).where(core_models.ClassSection.id == class_section_id))).scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail='Class not found')
    roster_q = (
        select(
            core_models.Enrollment.id.label('enrollment_id'),
            core_models.CoreStudent.id.label('student_id'),
            core_models.CoreStudent.first_name,
            core_models.CoreStudent.last_name,
            core_models.Enrollment.roll_no
        )
        .join(core_models.CoreStudent, core_models.CoreStudent.id == core_models.Enrollment.student_id)
        .where(core_models.Enrollment.class_section_id == class_section_id)
        .order_by(core_models.Enrollment.roll_no.nulls_last(), core_models.CoreStudent.first_name)
    )
    rows = (await session.execute(roster_q)).all()
    students = []
    for r in rows:
        full_name = r.first_name + (f" {r.last_name}" if r.last_name else '')
        students.append({
            'student_id': r.student_id,
            'full_name': full_name,
            'roll_no': r.roll_no,
        })
    return { 'class_section_id': class_section_id, 'students': students }


# ---------------- Attendance persistence (Phase B) -----------------
@router.get('/class/{class_section_id}/attendance')
async def get_class_attendance(class_section_id: int, on: Optional[date] = None, session: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    """Return existing attendance marks for a class on a date (default today).

    Response shape: { date: ISO date, marks: [{student_id, status}], counts: {present,absent,late,excused} }
    """
    on = on or date.today()
    # fetch student ids in class via enrollment
    enroll_subq = select(core_models.Enrollment.student_id).where(core_models.Enrollment.class_section_id==class_section_id).subquery()
    q = select(attendance_models.AttendanceStudent).where(attendance_models.AttendanceStudent.student_id.in_(select(enroll_subq.c.student_id)), attendance_models.AttendanceStudent.date==on)
    rows = (await session.execute(q)).scalars().all()
    marks = [ {'student_id': r.student_id, 'status': r.status} for r in rows ]
    counts = {k:0 for k in ['present','absent','late','excused']}
    for m in marks:
        if m['status'] in counts:
            counts[m['status']] += 1
    return { 'date': on, 'marks': marks, 'counts': counts }


@router.post('/class/{class_section_id}/attendance')
async def submit_class_attendance(class_section_id: int, payload: AttendanceSubmitIn, session: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    """Upsert attendance marks for a class for a given date.

    Any mark omitted is left unchanged; to clear a mark send status set to null (not implemented yet).
    """
    # Validate statuses
    invalid = [m.status for m in payload.marks if m.status not in VALID_ATT_STATUS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid statuses: {sorted(set(invalid))}")
    # Collect student ids for class to restrict writes (avoid marking others)
    enroll_q = select(core_models.Enrollment.student_id).where(core_models.Enrollment.class_section_id==class_section_id)
    class_student_ids = {r.student_id for r in (await session.execute(enroll_q)).all()}
    if not class_student_ids:
        raise HTTPException(status_code=404, detail='Class empty or not found')
    # Upsert each mark
    # Using ON CONFLICT (student_id,date) DO UPDATE
    for m in payload.marks:
        if m.student_id not in class_student_ids:
            continue  # ignore out of class marks silently
        stmt = text("""
            INSERT INTO attendance_student (student_id, date, status)
            VALUES (:sid, :dt, :st)
            ON CONFLICT (student_id, date) DO UPDATE SET status = EXCLUDED.status
        """)
        await session.execute(stmt, {'sid': m.student_id, 'dt': payload.date, 'st': m.status})
    await session.commit()
    return { 'ok': True, 'updated': len(payload.marks) }


# ---------------- Timetable stub (Phase D) -----------------
@router.get('/class/{class_section_id}/timetable')
async def class_timetable(class_section_id: int, session: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    """Return a stub timetable for the current day.

    Real implementation should query timetable tables. For now we infer 6 periods.
    """
    today = date.today()
    periods = []
    # 6 periods starting 08:30, 45 min each + 10 min breaks
    start_hour = 8
    minute = 30
    for i in range(1,7):
        start_h = start_hour + ((minute // 60))
        start_m = minute % 60
        # build naive times
        start_label = f"{start_h:02d}:{start_m:02d}"
        # end 45 min later
        total_start = start_h*60+start_m
        total_end = total_start + 45
        end_h = total_end // 60
        end_m = total_end % 60
        end_label = f"{end_h:02d}:{end_m:02d}"
        periods.append({
            'period': i,
            'start': start_label,
            'end': end_label,
            'subject': None,
        })
        minute += 55  # 45 + 10 break
    return { 'date': today, 'periods': periods }
