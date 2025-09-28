from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy import text
from uuid import UUID
from typing import Optional  # Python 3.9 compatibility
from app.core.dependencies import get_db, get_current_user  # assumed existing
from . import schemas, models

router = APIRouter(prefix="/chat", tags=["chat"])

# Simple in-memory connection manager (MVP). For production consider Redis / pubsub.
class ChatConnectionManager:
    def __init__(self):
        # conversation_id -> set of websockets
        self.conversations: dict[str, set[WebSocket]] = {}

    async def connect(self, conversation_id: str, ws: WebSocket):
        await ws.accept()
        self.conversations.setdefault(conversation_id, set()).add(ws)

    def disconnect(self, conversation_id: str, ws: WebSocket):
        bucket = self.conversations.get(conversation_id)
        if bucket and ws in bucket:
            bucket.remove(ws)
            if not bucket:
                self.conversations.pop(conversation_id, None)

    async def broadcast(self, conversation_id: str, payload: dict):
        bucket = self.conversations.get(conversation_id)
        if not bucket:
            return
        dead = []
        for ws in bucket:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for d in dead:
            bucket.discard(d)
        if bucket and not self.conversations.get(conversation_id):
            self.conversations[conversation_id] = bucket

manager = ChatConnectionManager()

@router.get("/conversations", response_model=list[schemas.ConversationOut])
async def list_conversations(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # basic: return conversations where user is participant
    q = (
        select(models.Conversation)
        .join(models.ConversationParticipant)
        .where(models.ConversationParticipant.user_id == user.id)
        .order_by(models.Conversation.last_message_at.desc())
        .limit(100)
    )
    res = (await db.execute(q)).scalars().unique().all()
    return res

@router.post("/conversations", response_model=schemas.ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(payload: schemas.ConversationCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # staff/moderator only (simplified check)
    if user.role not in ("staff", "admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not allowed")
    conv = models.Conversation()
    db.add(conv)
    db.add(models.ConversationParticipant(conversation=conv, user_id=payload.parent_user_id, role=models.ParticipantRole.parent))
    db.add(models.ConversationParticipant(conversation=conv, user_id=user.id, role=models.ParticipantRole.staff))
    await db.flush()
    await db.refresh(conv)
    return conv

@router.get("/messages/{conversation_id}", response_model=list[schemas.MessageOut])
async def list_messages(conversation_id: UUID, after_sequence: Optional[int] = None, limit: int = 50, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # membership check
    member_q = select(models.ConversationParticipant).where(models.ConversationParticipant.conversation_id == conversation_id, models.ConversationParticipant.user_id == user.id)
    if not (await db.execute(member_q)).first():
        raise HTTPException(status_code=404, detail="Conversation not found")
    msg_q = select(models.Message).where(models.Message.conversation_id == conversation_id).order_by(models.Message.sequence.desc()).limit(limit)
    if after_sequence:
        msg_q = msg_q.where(models.Message.sequence > after_sequence)
    res = (await db.execute(msg_q)).scalars().all()
    return list(reversed(res))

@router.post("/messages", response_model=schemas.MessageOut, status_code=status.HTTP_201_CREATED)
async def post_message(payload: schemas.MessageCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # membership check
    member_q = select(models.ConversationParticipant).where(models.ConversationParticipant.conversation_id == payload.conversation_id, models.ConversationParticipant.user_id == user.id)
    if not (await db.execute(member_q)).first():
        raise HTTPException(status_code=404, detail="Conversation not found")
    msg = models.Message(conversation_id=payload.conversation_id, sender_id=user.id, body=payload.body, content_type=payload.content_type, attachment_url=payload.attachment_url, meta=payload.meta)
    db.add(msg)
    await db.flush()
    # update conversation last_message_at
    await db.execute(models.Conversation.__table__.update().where(models.Conversation.id == payload.conversation_id).values(last_message_at=models.text('now()')))
    await db.refresh(msg)
    return msg

@router.post("/messages/{message_id}/flag", response_model=schemas.MessageFlagOut, status_code=status.HTTP_201_CREATED)
async def flag_message(message_id: UUID, payload: schemas.MessageFlagCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # basic existence & membership check
    msg_q = select(models.Message).where(models.Message.id == message_id)
    msg = (await db.execute(msg_q)).scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    part_q = select(models.ConversationParticipant).where(models.ConversationParticipant.conversation_id == msg.conversation_id, models.ConversationParticipant.user_id == user.id)
    if not (await db.execute(part_q)).first():
        raise HTTPException(status_code=404, detail="Conversation not found")
    flag = models.MessageFlag(message_id=message_id, flagged_by=user.id, reason=payload.reason)
    db.add(flag)
    await db.flush()
    return flag

@router.post("/messages/{message_id}/moderate", response_model=schemas.MessageFlagOut)
async def moderate_message(message_id: UUID, action: str, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """Moderation actions: review, dismiss, delete, mask.
    delete -> sets deleted_at on message & flag status=actioned
    mask   -> replaces body with '***' & sets flag status=actioned
    review -> sets flag status=reviewed
    dismiss-> sets flag status=dismissed
    """
    if user.role not in ("staff","admin","moderator"):
        raise HTTPException(status_code=403, detail="Not allowed")
    msg_q = select(models.Message).where(models.Message.id == message_id)
    msg = (await db.execute(msg_q)).scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    # get latest flag or create pending if none
    flag_q = select(models.MessageFlag).where(models.MessageFlag.message_id == message_id).order_by(models.MessageFlag.created_at.desc())
    flag = (await db.execute(flag_q)).scalars().first()
    if not flag:
        flag = models.MessageFlag(message_id=message_id, flagged_by=user.id, reason="auto-created for moderation")
        db.add(flag)
        await db.flush()
    from datetime import datetime
    now_expr = models.text('now()')
    action_lower = action.lower()
    if action_lower == 'delete':
        await db.execute(models.Message.__table__.update().where(models.Message.id==message_id).values(deleted_at=models.text('now()')))
        flag.status = models.FlagStatus.actioned
    elif action_lower == 'mask':
        await db.execute(models.Message.__table__.update().where(models.Message.id==message_id).values(body='***'))
        flag.status = models.FlagStatus.actioned
    elif action_lower == 'review':
        flag.status = models.FlagStatus.reviewed
    elif action_lower == 'dismiss':
        flag.status = models.FlagStatus.dismissed
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    await db.flush()
    return flag

@router.websocket("/ws/{conversation_id}")
async def websocket_chat(conversation_id: UUID, ws: WebSocket):
    # Basic token auth via query parameter token= (MVP). TODO: replace with proper subprotocol/JWT cookie flow.
    token = ws.query_params.get("token")
    # We cannot reuse dependency system directly; minimal parse fallback.
    if not token:
        await ws.close(code=4401)
        return
    # Accept early to send errors gracefully; real impl: validate JWT properly
    await manager.connect(str(conversation_id), ws)
    try:
        await ws.send_json({"type":"welcome","conversation_id":str(conversation_id)})
        while True:
            msg = await ws.receive_json()
            mtype = msg.get("type")
            if mtype == "ping":
                await ws.send_json({"type":"pong","ts":msg.get("ts")})
            elif mtype == "typing":
                await manager.broadcast(str(conversation_id), {"type":"typing","user":"anon","conversation_id":str(conversation_id)})
            elif mtype == "message":
                body = msg.get("body")
                if not body:
                    await ws.send_json({"type":"error","error":"empty_body"})
                    continue
                # Broadcast only (persistence via REST for now) – future: persist here and assign sequence
                await manager.broadcast(str(conversation_id), {"type":"message","body":body,"conversation_id":str(conversation_id)})
            else:
                await ws.send_json({"type":"error","error":"unknown_type"})
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(str(conversation_id), ws)

_FTS_LANGS = {"english","simple"}
_MAX_QUERY_LEN = 120
_RATE_BUCKET: dict[int, list[float]] = {}
_RATE_WINDOW = 60.0  # seconds
_RATE_MAX = 30       # max searches per window per user

def _rate_check(user_id: int, now: float):
    bucket = _RATE_BUCKET.setdefault(user_id, [])
    # prune
    cutoff = now - _RATE_WINDOW
    while bucket and bucket[0] < cutoff:
        bucket.pop(0)
    if len(bucket) >= _RATE_MAX:
        return False
    bucket.append(now)
    return True

@router.get("/search/messages", response_model=list[schemas.MessageSearchResult])
async def search_messages(q: str, conversation_id: Optional[UUID] = None, limit: int = 50, lang: str = "english", db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """Full-text search over messages body (websearch syntax).
    Guards: length, rate limit, allowed language, soft-delete filtered.
    """
    import time as _t
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Empty query")
    if len(q) > _MAX_QUERY_LEN:
        raise HTTPException(status_code=400, detail="Query too long")
    lang = lang.lower()
    if lang not in _FTS_LANGS:
        raise HTTPException(status_code=400, detail="Unsupported language")
    if not _rate_check(user.id, _t.time()):
        raise HTTPException(status_code=429, detail="Search rate exceeded")
    base = f"""
        select m.id, m.conversation_id, m.sender_id, m.sequence, m.created_at,
               ts_headline(:lang, m.body, websearch_to_tsquery(:lang, :q)) as snippet,
               ts_rank_cd(to_tsvector(:lang, coalesce(m.body,'')), websearch_to_tsquery(:lang, :q)) as rank
        from messages m
        join conversation_participants cp on cp.conversation_id = m.conversation_id and cp.user_id = :uid
        where m.deleted_at is null
          and to_tsvector(:lang, coalesce(m.body,'')) @@ websearch_to_tsquery(:lang, :q)
    """
    params = {"q": q, "uid": user.id, "lang": lang}
    if conversation_id:
        base += " and m.conversation_id = :cid"
        params["cid"] = str(conversation_id)
    base += " order by rank desc, m.created_at desc limit :limit"
    params["limit"] = limit
    result = await db.execute(text(base), params)
    return [schemas.MessageSearchResult(**dict(r._mapping)) for r in result]
