from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, Table, Column, Integer, Date, Text, MetaData, text as _text
from sqlalchemy import exc as sa_exc
from datetime import date, timedelta
from .models import Wing, SchoolClass, ClassStudent
from ..students.models import Student
from ...core.db import get_session
from ...core.security import require
import csv, io, time

router_wings = APIRouter(prefix="/wings", tags=["wings"])
router_classes_admin = APIRouter(prefix="/classes-admin", tags=["classes-admin"])  # separate from existing /classes analytics endpoint

# Runtime schema safety: add staff linkage columns if migration not applied yet.
_STAFF_COLUMNS_ENSURED = False

async def _ensure_staff_columns(session: AsyncSession):
    global _STAFF_COLUMNS_ENSURED
    if _STAFF_COLUMNS_ENSURED:
        return
    try:
        # Probe one of the new columns
        await session.execute(select(SchoolClass.teacher_staff_id).limit(1))
        _STAFF_COLUMNS_ENSURED = True
        return
    except Exception:
        try:
            await session.execute(_text("ALTER TABLE school_classes ADD COLUMN IF NOT EXISTS teacher_staff_id integer"))
            await session.execute(_text("ALTER TABLE school_classes ADD COLUMN IF NOT EXISTS assistant_teacher_id integer"))
            await session.execute(_text("ALTER TABLE school_classes ADD COLUMN IF NOT EXISTS support_staff_ids text"))
            await session.commit()
        except Exception:
            await session.rollback()
        finally:
            _STAFF_COLUMNS_ENSURED = True

# -------------------- Pydantic Schemas --------------------
class WingCreate(BaseModel):
    academic_year: str
    name: str
    grade_start: str  # alphanumeric label now
    grade_end: str
    target_ratio: Optional[int] = None
    head: Optional[str] = None

class WingOut(WingCreate):
    id: int

class WingUpdate(BaseModel):
    name: Optional[str]
    grade_start: Optional[str]
    grade_end: Optional[str]
    target_ratio: Optional[int]
    head: Optional[str]

class ClassCreate(BaseModel):
    academic_year: str
    wing_id: Optional[int]
    grade: str
    section: str
    teacher_name: Optional[str] = None
    target_ratio: Optional[int] = None
    teacher_staff_id: Optional[int] = None
    assistant_teacher_id: Optional[int] = None
    support_staff_ids: Optional[List[int]] = None
    storage_path: Optional[str] = None
    meet_link: Optional[str] = None

class ClassOut(ClassCreate):
    id: int
    total_students: int = 0
    male: int = 0
    female: int = 0
    attendance_pct: int = 0  # percent 0-100
    fee_due_pct: int = 0      # percent of students with outstanding fees (0-100)
    results_avg: int = 0      # placeholder until results tables exist

class ClassUpdate(BaseModel):
    wing_id: Optional[int]
    teacher_name: Optional[str]
    target_ratio: Optional[int]
    section: Optional[str]
    teacher_staff_id: Optional[int]
    assistant_teacher_id: Optional[int]
    support_staff_ids: Optional[List[int]]
    storage_path: Optional[str]
    meet_link: Optional[str]

class StudentAssignPayload(BaseModel):
    student_ids: List[int]
    replace: bool = True

class ClassSettingsPatch(BaseModel):
    id: int
    storage_path: Optional[str] = None
    meet_link: Optional[str] = None
    target_ratio: Optional[int] = None

class ClassSettingsBulkRequest(BaseModel):
    updates: List[ClassSettingsPatch]

class ClassSettingsBulkResponse(BaseModel):
    updated: int

# -------------------- Wings Endpoints --------------------
@router_wings.get("", response_model=List[WingOut])
async def list_wings(academic_year: Optional[str] = None, session: AsyncSession = Depends(get_session), user=Depends(require('classes:list'))):
    stmt = select(Wing)
    if academic_year:
        stmt = stmt.where(Wing.academic_year==academic_year)
    rows = (await session.execute(stmt.order_by(Wing.grade_start.asc()))).scalars().all()
    return [WingOut(**{c.name: getattr(r,c.name) for c in Wing.__table__.columns}) for r in rows]

@router_wings.post("", response_model=WingOut)
async def create_wing(body: WingCreate, session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    w = Wing(**body.dict())
    session.add(w)
    await session.commit(); await session.refresh(w)
    return WingOut(**{c.name: getattr(w,c.name) for c in Wing.__table__.columns})

@router_wings.patch("/{wing_id}", response_model=WingOut)
async def update_wing(wing_id: int, body: WingUpdate, session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    w = (await session.execute(select(Wing).where(Wing.id==wing_id))).scalar_one_or_none()
    if not w: raise HTTPException(404, 'Wing not found')
    for k,v in body.dict(exclude_unset=True).items(): setattr(w,k,v)
    await session.commit(); await session.refresh(w)
    return WingOut(**{c.name: getattr(w,c.name) for c in Wing.__table__.columns})

@router_wings.delete("/{wing_id}")
async def delete_wing(wing_id: int, session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    await session.execute(delete(Wing).where(Wing.id==wing_id))
    await session.commit()
    return {"status":"ok"}

# -------------------- Classes Endpoints --------------------
_AGG_CACHE_TTL_SEC = 30  # seconds
_agg_cache = { 'data': None, 'params': None, 'ts': 0.0 }

def _invalidate_agg_cache():
    _agg_cache['data'] = None
    _agg_cache['params'] = None
    _agg_cache['ts'] = 0.0

@router_classes_admin.get("", response_model=List[ClassOut])
async def list_classes_admin(academic_year: Optional[str] = None,
    attendance_days: int = 1,
    exam_window_days: int = 90,
    response: Response = None,
    session: AsyncSession = Depends(get_session), user=Depends(require('classes:list'))):
    await _ensure_staff_columns(session)
    # Basic validation & normalization
    attendance_days = max(1, min(attendance_days, 120))  # cap to avoid huge scans
    exam_window_days = max(1, min(exam_window_days, 365))
    cache_key = (academic_year, attendance_days, exam_window_days)
    now = time.time()
    if _agg_cache['data'] is not None and _agg_cache['params'] == cache_key and (now - _agg_cache['ts']) < _AGG_CACHE_TTL_SEC:
        if response is not None:
            response.headers['x-cache'] = 'HIT'
        return _agg_cache['data']
    if response is not None:
        response.headers['x-cache'] = 'MISS'
    stmt = select(SchoolClass)
    if academic_year:
        stmt = stmt.where(SchoolClass.academic_year==academic_year)
    classes = (await session.execute(stmt.order_by(SchoolClass.grade.asc(), SchoolClass.section.asc()))).scalars().all()
    out: list[ClassOut] = []
    if not classes:
        return out
    class_ids = [c.id for c in classes]
    cs_rows = (await session.execute(select(ClassStudent.class_id, ClassStudent.student_id).where(ClassStudent.class_id.in_(class_ids)))).all()
    by_class: dict[int, list[int]] = {}
    for cid, sid in cs_rows:
        by_class.setdefault(cid, []).append(sid)
    if cs_rows:
        from ..students.models import Student  # local import to avoid circular
        from ..students.models_extra import AttendanceEvent, FeeInvoice
        student_ids = [sid for _, sid in cs_rows]
        stu_rows = (await session.execute(select(Student.id, Student.gender).where(Student.id.in_(student_ids)))).all()
        gender_map = {sid: (g or '').upper() for sid, g in stu_rows}
        att_start = date.today() - timedelta(days=max(1, attendance_days)-1)
        today_att = (await session.execute(select(AttendanceEvent.student_id, AttendanceEvent.present).where(AttendanceEvent.student_id.in_(student_ids), AttendanceEvent.date >= att_start))).all()
        att_map: dict[int, int] = {}
        for sid, present in today_att:
            att_map[sid] = att_map.get(sid, 0) + (1 if present else 0)
        fee_rows = (await session.execute(select(FeeInvoice.student_id, FeeInvoice.amount, FeeInvoice.paid_amount, FeeInvoice.settled_at).where(FeeInvoice.student_id.in_(student_ids)))).all()
        fee_due_map: dict[int, bool] = {}
        for sid, amount, paid, settled in fee_rows:
            if settled is None and (amount or 0) - (paid or 0) > 0:
                fee_due_map[sid] = True
        exam_latest: dict[int, tuple[int,int]] = {}
        exam_cutoff = date.today() - timedelta(days=max(1, exam_window_days))
        metadata = MetaData()
        exam_scores_table = Table(
            'exam_scores', metadata,
            Column('id', Integer),
            Column('student_id', Integer),
            Column('exam_date', Date),
            Column('exam_type', Text),
            Column('total_marks', Integer),
            Column('obtained_marks', Integer),
        )
        try:
            exam_rows = (await session.execute(
                select(
                    exam_scores_table.c.student_id,
                    exam_scores_table.c.exam_date,
                    exam_scores_table.c.total_marks,
                    exam_scores_table.c.obtained_marks
                ).where(
                    exam_scores_table.c.student_id.in_(student_ids),
                    exam_scores_table.c.exam_date >= exam_cutoff
                ).order_by(
                    exam_scores_table.c.student_id,
                    exam_scores_table.c.exam_date.desc()
            ))).all()
            for sid, exam_date_val, total_marks, obtained_marks in exam_rows:
                if sid not in exam_latest and total_marks:
                    exam_latest[sid] = (total_marks, obtained_marks)
        except sa_exc.SQLAlchemyError:
            exam_latest = {}
    else:
        gender_map = {}
        att_map = {}
        fee_due_map = {}
        exam_latest = {}
    for c in classes:
        sids = by_class.get(c.id, [])
        total = len(sids)
        male = sum(1 for sid in sids if gender_map.get(sid)== 'M')
        female = sum(1 for sid in sids if gender_map.get(sid)== 'F')
        # Attendance percent: average presence over window
        if total and attendance_days > 0:
            present_sum = sum(att_map.get(sid, 0) for sid in sids)
            # present_sum ranges 0..(attendance_days*total)
            attendance_pct = int((present_sum * 100) / (attendance_days * total))
            fee_due_pct = int((sum(1 for sid in sids if fee_due_map.get(sid)) * 100)/ total)
        else:
            attendance_pct = 0
            fee_due_pct = 0
        # Results average: mean of latest exam percentages per student in class
        if total:
            percents = []
            for sid in sids:
                if sid in exam_latest:
                    tot, obt = exam_latest[sid]
                    if tot:
                        percents.append((obt / tot) * 100)
            results_avg = int(sum(percents)/len(percents)) if percents else 0
        else:
            results_avg = 0
        ss_ids = []
        if getattr(c,'support_staff_ids',None):
            ss_ids = [int(x) for x in c.support_staff_ids.split(',') if x]
        out.append(ClassOut(id=c.id, academic_year=c.academic_year, wing_id=c.wing_id, grade=c.grade, section=c.section, teacher_name=c.teacher_name, target_ratio=c.target_ratio, teacher_staff_id=getattr(c,'teacher_staff_id',None), assistant_teacher_id=getattr(c,'assistant_teacher_id',None), support_staff_ids=ss_ids, total_students=total, male=male, female=female, attendance_pct=attendance_pct, fee_due_pct=fee_due_pct, results_avg=results_avg))
    # store in cache
    _agg_cache['data'] = out
    _agg_cache['params'] = cache_key
    _agg_cache['ts'] = time.time()
    return out

@router_classes_admin.get("/metrics")
async def classes_admin_metrics(academic_year: Optional[str] = None,
    attendance_days: int = 1,
    exam_window_days: int = 90,
    session: AsyncSession = Depends(get_session), user=Depends(require('classes:list'))):
    """Lightweight summary: counts & averaged percentages without returning each class row.
    Reuses cached aggregate list when available to avoid recomputation."""
    # Reuse existing list function logic via internal call (without duplicating SQL); if cache miss it will populate.
    # We call the underlying function by importing it or referencing directly.
    # Instead of re-querying DB here, we simulate a call by invoking list_classes_admin with a dummy Response.
    dummy_resp = Response()
    classes = await list_classes_admin(academic_year=academic_year, attendance_days=attendance_days, exam_window_days=exam_window_days, response=dummy_resp, session=session, user=user)  # type: ignore
    total_classes = len(classes)
    total_students = sum(c.total_students for c in classes)
    avg_attendance = int(sum(c.attendance_pct * c.total_students for c in classes) / total_students) if total_students else 0
    avg_results = int(sum(c.results_avg * c.total_students for c in classes) / total_students) if total_students else 0
    fee_due_students = sum(int(c.fee_due_pct * c.total_students / 100) for c in classes)
    fee_due_pct_overall = int((fee_due_students * 100) / total_students) if total_students else 0
    return {
        "academic_year": academic_year,
        "classes": total_classes,
        "students": total_students,
        "attendance_pct": avg_attendance,
        "results_avg": avg_results,
        "fee_due_pct": fee_due_pct_overall,
        "cache": dummy_resp.headers.get('x-cache','MISS')
    }

@router_classes_admin.post("", response_model=ClassOut)
async def create_class(body: ClassCreate, session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    await _ensure_staff_columns(session)
    payload = body.dict()
    if payload.get('support_staff_ids') is not None:
        payload['support_staff_ids'] = ','.join(str(i) for i in payload['support_staff_ids'])
    cls = SchoolClass(**payload)
    session.add(cls)
    await session.commit(); await session.refresh(cls)
    _invalidate_agg_cache()
    out_payload = body.dict()
    return ClassOut(id=cls.id, total_students=0, **out_payload)

@router_classes_admin.patch("/{class_id}", response_model=ClassOut)
async def update_class(class_id: int, body: ClassUpdate, session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    await _ensure_staff_columns(session)
    c = (await session.execute(select(SchoolClass).where(SchoolClass.id==class_id))).scalar_one_or_none()
    if not c: raise HTTPException(404, 'Class not found')
    update_data = body.dict(exclude_unset=True)
    if 'support_staff_ids' in update_data and update_data['support_staff_ids'] is not None:
        update_data['support_staff_ids'] = ','.join(str(i) for i in update_data['support_staff_ids'])
    for k,v in update_data.items(): setattr(c,k,v)
    await session.commit(); await session.refresh(c)
    _invalidate_agg_cache()
    total_ids = (await session.execute(select(ClassStudent.student_id).where(ClassStudent.class_id==c.id))).scalars().all()
    from ..students.models import Student
    from ..students.models_extra import AttendanceEvent, FeeInvoice
    if total_ids:
        stu_rows = (await session.execute(select(Student.id, Student.gender).where(Student.id.in_(total_ids)))).all()
        gender_map = {sid:(g or '').upper() for sid,g in stu_rows}
        male = sum(1 for sid in total_ids if gender_map.get(sid)=='M')
        female = sum(1 for sid in total_ids if gender_map.get(sid)=='F')
        att_rows = (await session.execute(select(AttendanceEvent.student_id, AttendanceEvent.present).where(AttendanceEvent.student_id.in_(total_ids)))).all()
        present = sum(1 for _,p in att_rows if p==1)
        attendance_pct = int((present*100)/len(total_ids)) if total_ids else 0
        fee_rows = (await session.execute(select(FeeInvoice.student_id, FeeInvoice.amount, FeeInvoice.paid_amount, FeeInvoice.settled_at).where(FeeInvoice.student_id.in_(total_ids)))).all()
        fee_due = sum(1 for sid,amt,paid,settled in fee_rows if (settled is None and (amt or 0)-(paid or 0) > 0))
        fee_due_pct = int((fee_due*100)/len(total_ids)) if total_ids else 0
    else:
        male=female=attendance_pct=fee_due_pct=0
    ss_ids = []
    if getattr(c,'support_staff_ids',None):
        ss_ids = [int(x) for x in c.support_staff_ids.split(',') if x]
    return ClassOut(id=c.id, academic_year=c.academic_year, wing_id=c.wing_id, grade=c.grade, section=c.section, teacher_name=c.teacher_name, target_ratio=c.target_ratio, teacher_staff_id=getattr(c,'teacher_staff_id',None), assistant_teacher_id=getattr(c,'assistant_teacher_id',None), support_staff_ids=ss_ids, total_students=len(total_ids), male=male, female=female, attendance_pct=attendance_pct, fee_due_pct=fee_due_pct, results_avg=0)

@router_classes_admin.post("/bulk-settings", response_model=ClassSettingsBulkResponse)
async def bulk_update_class_settings(body: ClassSettingsBulkRequest, session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    if not body.updates:
        return ClassSettingsBulkResponse(updated=0)
    updated = 0
    for patch in body.updates:
        c = (await session.execute(select(SchoolClass).where(SchoolClass.id==patch.id))).scalar_one_or_none()
        if not c:
            continue
        changed = False
        if patch.storage_path is not None and c.storage_path != patch.storage_path:
            c.storage_path = patch.storage_path; changed = True
        if patch.meet_link is not None and c.meet_link != patch.meet_link:
            c.meet_link = patch.meet_link; changed = True
        if patch.target_ratio is not None and c.target_ratio != patch.target_ratio:
            c.target_ratio = patch.target_ratio; changed = True
        if changed:
            updated += 1
    if updated:
        await session.commit()
        _invalidate_agg_cache()
    return ClassSettingsBulkResponse(updated=updated)

@router_classes_admin.delete("/{class_id}")
async def delete_class(class_id: int, session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    # Remove associated mappings first to avoid foreign key violations if cascade not configured
    await session.execute(delete(ClassStudent).where(ClassStudent.class_id==class_id))
    await session.execute(delete(SchoolClass).where(SchoolClass.id==class_id))
    await session.commit()
    _invalidate_agg_cache()
    return {"status":"ok","deleted": class_id}

@router_classes_admin.post("/{class_id}/students")
async def assign_students(class_id: int, body: StudentAssignPayload, session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    c = (await session.execute(select(SchoolClass).where(SchoolClass.id==class_id))).scalar_one_or_none()
    if not c: raise HTTPException(404, 'Class not found')
    # validate students exist
    existing = (await session.execute(select(Student.id).where(Student.id.in_(body.student_ids)))).scalars().all()
    if len(existing) != len(body.student_ids):
        missing = set(body.student_ids) - set(existing)
        raise HTTPException(400, f"Invalid student ids: {sorted(missing)}")
    if body.replace:
        await session.execute(delete(ClassStudent).where(ClassStudent.class_id==class_id))
    # insert new ones (avoid duplicates)
    existing_set = set((await session.execute(select(ClassStudent.student_id).where(ClassStudent.class_id==class_id))).scalars().all())
    for sid in body.student_ids:
        if sid in existing_set: continue
        session.add(ClassStudent(class_id=class_id, student_id=sid))
    await session.commit()
    _invalidate_agg_cache()
    total = (await session.execute(select(ClassStudent.student_id).where(ClassStudent.class_id==class_id))).scalars().all()
    return {"status":"ok","total":len(total)}

# -------------------- Import / Export CSV --------------------
CSV_HEADER = ['academic_year','wing','grade','section','teacher_name','target_ratio']

@router_classes_admin.post('/import')
async def import_csv(file: UploadFile = File(...), session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    content = await file.read()
    text = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames != CSV_HEADER:
        raise HTTPException(400, f'Invalid header. Expected {CSV_HEADER}')
    created = 0
    for row in reader:
        # Wing upsert
        w = (await session.execute(select(Wing).where(Wing.academic_year==row['academic_year'], Wing.name==row['wing']))).scalar_one_or_none()
        if not w:
            w = Wing(academic_year=row['academic_year'], name=row['wing'], grade_start=int(row['grade']), grade_end=int(row['grade']), target_ratio=int(row['target_ratio'] or 0) or None)
            session.add(w)
            await session.flush()
        cls = (await session.execute(select(SchoolClass).where(SchoolClass.academic_year==row['academic_year'], SchoolClass.grade==int(row['grade']), SchoolClass.section==row['section']))).scalar_one_or_none()
        if not cls:
            cls = SchoolClass(academic_year=row['academic_year'], wing_id=w.id, grade=int(row['grade']), section=row['section'], teacher_name=row['teacher_name'] or None, target_ratio=int(row['target_ratio'] or 0) or None)
            session.add(cls)
            created += 1
    await session.commit()
    _invalidate_agg_cache()
    return {"status":"ok","created":created}

@router_classes_admin.get('/export')
async def export_csv(academic_year: str, session: AsyncSession = Depends(get_session), user=Depends(require('classes:list'))):
    stmt = select(SchoolClass, Wing.name.label('wing_name')).join(Wing, Wing.id==SchoolClass.wing_id, isouter=True).where(SchoolClass.academic_year==academic_year)
    rows = (await session.execute(stmt)).all()
    output = io.StringIO(); writer = csv.writer(output)
    writer.writerow(CSV_HEADER)
    for cls, wing_name in rows:
        writer.writerow([cls.academic_year, wing_name or '', cls.grade, cls.section, cls.teacher_name or '', cls.target_ratio or ''])
    return {"csv": output.getvalue()}
