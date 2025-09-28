import asyncio
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from sqlalchemy import text
try:
    from dotenv import load_dotenv  # type: ignore
    root_env = Path(__file__).resolve().parents[3] / '.env.local'
    if root_env.exists():
        load_dotenv(root_env, override=True)
except Exception:
    pass
from app.core.db import engine, ASYNC_DSN

STUDENTS = [
    ("Suresh", "Kumar", "5", "A", "9876543210"),
    ("Anita", "Iyer", "5", "A", "9876543211"),
    ("Rahul", "Verma", "6", "B", "9876543212"),
]

FEE_HEADS = ["Tuition", "Transport", "Lab"]

# New sample domain data
USERS = [
    {"p": "+911111111111", "e": "admin@example.com"},
    {"p": "+912222222222", "e": "teacher@example.com"},
    {"p": "+913333333333", "e": "parent1@example.com"},
    {"p": "+914444444444", "e": "parent2@example.com"},
]

CONVERSATIONS = [
    {"external_ref": "welcome-thread", "title": "Welcome Parents"},
    {"external_ref": "exam-prep", "title": "Exam Preparation Guidance"},
]

MESSAGES = {
    "welcome-thread": [
        ("parent1@example.com", "Hello everyone, excited to be here."),
        ("teacher@example.com", "Welcome! Feel free to ask any questions."),
        ("parent2@example.com", "Looking forward to updates."),
    ],
    "exam-prep": [
        ("teacher@example.com", "Mid-term exams start next month. Let's prepare."),
        ("parent1@example.com", "Could you share a syllabus outline?"),
    ],
}

EVENTS = [
    {"external_ref": "annual-day", "title": "Annual Day", "description": "Cultural performances and awards.", "starts_in_days": 14, "duration_hours": 4, "visibility": "public", "status": "scheduled"},
    {"external_ref": "pta-meet", "title": "PTA Meeting", "description": "Discussion on academic progress.", "starts_in_days": 7, "duration_hours": 2, "visibility": "parents", "status": "scheduled"},
]

SOCIAL_POSTS = [
    {"channel_ref": "post-annual-teaser", "platform": "internal", "title": "Annual Day Coming Soon", "body": "Get ready for Annual Day in two weeks!", "status": "scheduled", "schedule_in_hours": 6},
    {"channel_ref": "post-welcome", "platform": "whatsapp", "title": "Welcome New Parents", "body": "A warm welcome to all new parents joining us this term.", "status": "published", "publish_offset_hours": -1},
]

async def seed():
    print("[seed] Using ASYNC_DSN:", ASYNC_DSN)
    from app.core.config import settings
    print("[seed] settings.postgres_dsn:", settings.postgres_dsn)
    async with engine.begin() as conn:
        # Users
        await conn.execute(text("""
            insert into users (phone,email) values (:p,:e)
            on conflict (phone) do nothing
        """), USERS)

        # Students
        for first, last, cls, section, guardian in STUDENTS:
            await conn.execute(text(
                """
                insert into students (first_name,last_name,class,section,guardian_phone)
                values (:f,:l,:c,:s,:g)
                on conflict do nothing
                """
            ), {"f": first, "l": last, "c": cls, "s": section, "g": guardian})

        # Fee heads
        for fh in FEE_HEADS:
            await conn.execute(text("insert into fee_heads (name) values (:n) on conflict do nothing"), {"n": fh})

        # Sample invoices for first student
        await conn.execute(text(
            """
            insert into invoices (student_id, amount_paise, status, due_date)
            select id, 500000, 'unpaid', :due from students where first_name = :fn limit 1
            on conflict do nothing
            """
        ), {"due": date.today(), "fn": "Suresh"})

        # Sample attendance for today
        await conn.execute(text(
            """
            insert into attendance_student (student_id, date, status)
            select id, :dt, 'present' from students
            on conflict (student_id,date) do nothing
            """
        ), {"dt": date.today()})

        # Map emails to user ids
        user_rows = (await conn.execute(text("select id,email from users where email is not null"))).mappings().all()
        email_to_id = {r["email"]: r["id"] for r in user_rows}

        # Conversations (idempotent via external_ref)
        for conv in CONVERSATIONS:
            await conn.execute(text(
                """
                insert into conversations (id,external_ref,title)
                values (gen_random_uuid(), :ref,:title)
                on conflict (external_ref) do nothing
                """
            ), {"ref": conv["external_ref"], "title": conv["title"]})

        # Participants: attach all users as observers except teacher (staff)
        conv_rows = (await conn.execute(text("select id, external_ref from conversations"))).mappings().all()
        ref_to_conv = {r["external_ref"]: r["id"] for r in conv_rows}

        for ref, msg_list in MESSAGES.items():
            conv_id = ref_to_conv.get(ref)
            if not conv_id:
                continue
            # Ensure participants based on message senders
            participants_added = set()
            for sender_email, _ in msg_list:
                uid = email_to_id.get(sender_email)
                if not uid or uid in participants_added:
                    continue
                role = 'staff' if 'teacher' in sender_email else ('parent' if 'parent' in sender_email else 'observer')
                await conn.execute(text(
                    """
                    insert into conversation_participants (conversation_id,user_id,role)
                    values (:cid,:uid,:role)
                    on conflict do nothing
                    """
                ), {"cid": conv_id, "uid": uid, "role": role})
                participants_added.add(uid)
            # Insert messages if none exist yet for this conversation
            existing = await conn.execute(text("select count(*) as c from messages where conversation_id=:cid"), {"cid": conv_id})
            if existing.scalar_one() == 0:
                for sender_email, body in msg_list:
                    uid = email_to_id.get(sender_email)
                    await conn.execute(text(
                        """
                        insert into messages (id, conversation_id, sender_id, body, content_type)
                        values (gen_random_uuid(), :cid, :sid, :body, 'text')
                        """
                    ), {"cid": conv_id, "sid": uid, "body": body})

        # Events (idempotent via external_ref stored in conversations.external_ref pattern? We'll use events title uniqueness assumption)
        now = datetime.now(timezone.utc)
        for ev in EVENTS:
            existing_ev = await conn.execute(text("select id from events where title=:title"), {"title": ev["title"]})
            if existing_ev.scalar_one_or_none():
                continue
            starts = now + timedelta(days=ev["starts_in_days"])
            ends = starts + timedelta(hours=ev["duration_hours"])
            await conn.execute(text(
                """
                insert into events (id,title,description,starts_at,ends_at,location,visibility,status,created_by)
                values (gen_random_uuid(), :title,:description,:starts,:ends,'Auditorium',:visibility,:status,NULL)
                """
            ), {"title": ev["title"], "description": ev["description"], "starts": starts, "ends": ends, "visibility": ev["visibility"], "status": ev["status"]})

        # Social posts (idempotent via channel_ref)
        for sp in SOCIAL_POSTS:
            existing_sp = await conn.execute(text("select id from social_posts where channel_ref=:cr"), {"cr": sp["channel_ref"]})
            if existing_sp.scalar_one_or_none():
                continue
            scheduled_for = None
            published_at = None
            now = datetime.now(timezone.utc)
            if sp.get("status") == "scheduled":
                scheduled_for = now + timedelta(hours=sp.get("schedule_in_hours", 1))
            if sp.get("status") == "published":
                published_at = now + timedelta(hours=sp.get("publish_offset_hours", 0))
            await conn.execute(text(
                """
                insert into social_posts (id,platform,title,body,media_url,scheduled_for,published_at,status,created_by,channel_ref)
                values (gen_random_uuid(), :platform,:title,:body,NULL,:scheduled_for,:published_at,:status,NULL,:channel_ref)
                """
            ), {"platform": sp["platform"], "title": sp["title"], "body": sp["body"], "scheduled_for": scheduled_for, "published_at": published_at, "status": sp["status"], "channel_ref": sp["channel_ref"]})

    print("Seed data inserted (extended conversations/events/social posts).")


def run():
    asyncio.run(seed())

if __name__ == "__main__":
    run()
