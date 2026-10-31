"""
Anonymous visitor insights.

Kya store hota hai: sirf event ka type (visit, project_live, ask_ai...), ek chhota naam
(project ka title ya Ask AI ka sawal, max 200 chars) aur time.
Kya store NAHI hota: IP, cookie, device, JD ka text.

    POST /api/track      public, frontend se (sirf whitelist wale kinds, rate-limited)
    POST /api/insights   admin only (POST isliye ki GET public hote hain)

Ask AI / JD match / Agent run server pe hi log hote hain (track_dep dependency se),
isliye koi unhe nakli nahi bana sakta.
"""

import time
from collections import defaultdict, deque
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.orm import Session

from .database import Base, get_db

router = APIRouter(tags=["insights"])

CLIENT_KINDS = {
    "visit",
    "project_live",
    "project_source",
    "demo_open",
    "resume_click",
    "email_click",
    "linkedin_click",
    "github_click",
}

KIND_BY_PATH = {
    "/api/chat": "ask_ai",
    "/api/jd-match": "jd_match",
    "/api/agent-run": "agent_run",
}

RETENTION_DAYS = 180


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String(32), index=True, nullable=False)
    name = Column(String(200), default="")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


def _clean(text: str | None) -> str:
    return " ".join((text or "").split())[:200]


_inserts = 0


def _store(kind: str, name: str = "") -> None:
    global _inserts

    gen = get_db()
    db = next(gen)

    try:
        db.add(Event(kind=kind, name=_clean(name)))
        db.commit()

        _inserts += 1
        if _inserts % 200 == 0:
            cutoff = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
            db.query(Event).filter(Event.created_at < cutoff).delete()
            db.commit()
    except Exception:
        db.rollback()
    finally:
        gen.close()


def _extract_text(data) -> str:
    if not isinstance(data, dict):
        return ""

    for key in ("message", "question", "query", "text", "prompt"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value

    messages = data.get("messages")
    if isinstance(messages, list):
        for item in reversed(messages):
            if (
                isinstance(item, dict)
                and item.get("role") == "user"
                and isinstance(item.get("content"), str)
            ):
                return item["content"]

    return ""


async def track_request(request: Request) -> None:
    """Router-level dependency: Ask AI, JD match aur Agent run ko log karta hai.
    Kuch bhi galat ho toh chupchaap ignore, asli request kabhi nahi rukti."""
    try:
        kind = KIND_BY_PATH.get(request.url.path)

        if not kind:
            return

        name = ""
        if kind in ("ask_ai", "agent_run"):
            name = _extract_text(await request.json())

        _store(kind, name)
    except Exception:
        pass


track_dep = Depends(track_request)

_hits: dict[str, deque] = defaultdict(deque)


def _rate_limit(request: Request) -> None:
    """Ek IP se ghante me max 150 track events."""
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    ip = forwarded or (request.client.host if request.client else "unknown")
    now = time.time()

    if len(_hits) > 2000:
        _hits.clear()

    queue = _hits[ip]
    while queue and now - queue[0] > 3600:
        queue.popleft()

    if len(queue) >= 150:
        raise HTTPException(status_code=429, detail="Too many events")

    queue.append(now)


class TrackIn(BaseModel):
    kind: str = Field(max_length=32)
    name: str = Field(default="", max_length=200)


@router.post("/track")
def track(payload: TrackIn, request: Request):
    if payload.kind not in CLIENT_KINDS:
        raise HTTPException(status_code=400, detail="Unknown event")

    _rate_limit(request)
    _store(payload.kind, payload.name)

    return {"ok": True}


class InsightsIn(BaseModel):
    days: int = Field(default=30, ge=1, le=180)


@router.post("/insights")
def insights(payload: InsightsIn, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=payload.days)

    totals = {
        kind: count
        for kind, count in db.query(Event.kind, func.count(Event.id))
        .filter(Event.created_at >= since)
        .group_by(Event.kind)
        .all()
    }

    # Roz ke visits
    per_day: dict[str, int] = {}
    for (created,) in (
        db.query(Event.created_at)
        .filter(Event.kind == "visit", Event.created_at >= since)
        .all()
    ):
        key = created.strftime("%Y-%m-%d")
        per_day[key] = per_day.get(key, 0) + 1

    daily = []
    for offset in range(payload.days - 1, -1, -1):
        day = (datetime.utcnow() - timedelta(days=offset)).strftime("%Y-%m-%d")
        daily.append({"date": day, "visits": per_day.get(day, 0)})

    # Kaunsa project kitna khula
    projects: dict[str, dict] = {}
    for name, kind, count in (
        db.query(Event.name, Event.kind, func.count(Event.id))
        .filter(
            Event.kind.in_(["project_live", "project_source"]),
            Event.created_at >= since,
        )
        .group_by(Event.name, Event.kind)
        .all()
    ):
        entry = projects.setdefault(
            name or "(unknown)", {"name": name or "(unknown)", "live": 0, "source": 0}
        )
        entry["live" if kind == "project_live" else "source"] += count

    top_projects = sorted(
        projects.values(), key=lambda p: p["live"] + p["source"], reverse=True
    )[:10]

    # Recent sawal
    questions = [
        {
            "kind": e.kind,
            "text": e.name,
            "at": e.created_at.isoformat() + "Z",
        }
        for e in db.query(Event)
        .filter(
            Event.kind.in_(["ask_ai", "agent_run"]),
            Event.created_at >= since,
        )
        .order_by(Event.id.desc())
        .limit(40)
        .all()
    ]

    return {
        "days": payload.days,
        "totals": totals,
        "daily": daily,
        "top_projects": top_projects,
        "questions": questions,
    }
