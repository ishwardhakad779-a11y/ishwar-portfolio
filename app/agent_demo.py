"""
Live agent trace demo (Server-Sent Events).

Public endpoint (admin key NAHI chahiye, par rate limit hai):
    POST /api/agent-run   { "question": "..." }

Ye ek chhota REAL agent hai, har step asli kaam karta hai:
    0. Question   - sawal receive
    1. Retrieve   - DB ke projects mein keyword search (koi LLM nahi)
    2. Draft      - sirf matched projects ke facts dekhke Groq LLM jawab likhta hai
    3. Verify     - jawab ke har link ko portfolio facts se check karta hai,
                    jo link facts mein nahi hota use hata deta hai

Har step poora hote hi frontend ko ek event stream hota hai,
taaki visitor graph mein steps live jalte dekhe.
"""

import json
import re
import time

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .ai import (
    CHAT_SYSTEM_PROMPT,
    EXTRA_FACTS,
    FALLBACK_PROFILE,
    FALLBACK_PROJECTS,
    FALLBACK_STACK,
    RateLimiter,
    _primary_model,
    build_facts,
    call_groq,
    enforce_limits,
)
from .database import get_db
from .models import Profile, Project, Stack

router = APIRouter(tags=["agent-demo"])

# 6 runs / 10 min / IP. Daily global limit ai.py wala hi lagta hai.
agent_limiter = RateLimiter(limit=6, window_seconds=600)

STOPWORDS = {
    "the", "and", "for", "with", "which", "what", "who", "how", "his", "her",
    "has", "have", "does", "did", "can", "any", "are", "you", "your", "about",
    "kya", "kaun", "kaunsa", "kaunsi", "hai", "hain", "ka", "ke", "ki", "ko",
    "me", "mein", "se", "ne", "bhi", "aur", "ye", "wo", "ishwar", "project",
    "projects", "tell", "show", "use", "uses", "used", "using", "build",
    "built", "best", "first", "look", "open", "kuch",
}

URL_RE = re.compile(r"https?://[^\s)>\]]+")


class AgentRequest(BaseModel):
    question: str = Field(min_length=3, max_length=300)


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9+#]{2,}", (text or "").lower()))


def _load_projects(db: Session) -> list[dict]:
    rows = (
        db.query(Project)
        .order_by(Project.display_order.asc(), Project.id.desc())
        .all()
    )

    if not rows:
        return [dict(p) for p in FALLBACK_PROJECTS]

    return [
        {
            "title": r.title,
            "category": r.category,
            "tags": r.tags or "",
            "description": r.description,
            "live_url": r.live_url or "",
            "github_url": r.github_url or "",
        }
        for r in rows
    ]


def retrieve(question: str, db: Session) -> tuple[list[dict], list[int], bool]:
    """Keyword retrieval. Returns (top projects, their scores, had_real_match)."""
    projects = _load_projects(db)
    q = _tokens(question) - STOPWORDS

    scored: list[tuple[int, dict]] = []

    for p in projects:
        haystack = _tokens(
            " ".join([p["title"], p["category"], p["tags"], p["description"]])
        )
        title_tokens = _tokens(p["title"])
        score = len(q & haystack) + 2 * len(q & title_tokens)
        scored.append((score, p))

    scored.sort(key=lambda item: -item[0])

    top = scored[:2]
    had_match = any(score > 0 for score, _ in top)

    return [p for _, p in top], [s for s, _ in top], had_match


def focused_facts(db: Session, matched: list[dict]) -> str:
    profile = db.query(Profile).first()
    stack = (
        db.query(Stack)
        .order_by(Stack.display_order.asc(), Stack.id.asc())
        .all()
    )

    name = profile.name if profile and profile.name else FALLBACK_PROFILE["name"]
    headline = (
        profile.headline if profile and profile.headline else FALLBACK_PROFILE["headline"]
    )
    bio = profile.bio if profile and profile.bio else FALLBACK_PROFILE["bio"]
    availability = (
        profile.availability
        if profile and profile.availability
        else FALLBACK_PROFILE["availability"]
    )
    stack_names = [s.name for s in stack] if stack else FALLBACK_STACK

    lines = [
        f"Name: {name}",
        f"Headline: {headline}",
        f"Bio: {bio}",
        f"Availability: {availability}",
        f"Email: {FALLBACK_PROFILE['email']}",
        f"Tech stack: {', '.join(stack_names)}",
        "",
        "Most relevant projects for this question:",
    ]

    for p in matched:
        lines.append(f"* {p['title']} [{p['category']}] ({p['tags']})")
        lines.append(f"  {p['description']}")

        if p["live_url"]:
            lines.append(f"  Live: {p['live_url']}")

        if p["github_url"]:
            lines.append(f"  GitHub: {p['github_url']}")

    lines += ["", "More about Ishwar:", EXTRA_FACTS]

    return "\n".join(lines)


def verify_links(answer: str, facts: str) -> tuple[str, int, list[str]]:
    """Har URL ko facts se check karo. Return (clean answer, total urls, removed urls)."""
    urls = URL_RE.findall(answer)
    removed: list[str] = []
    cleaned = answer

    for url in urls:
        bare = url.rstrip(".,;:!?").rstrip("/")

        if bare not in facts:
            removed.append(bare)
            cleaned = cleaned.replace(url, "[link removed]")

    return cleaned, len(urls), removed


@router.post("/agent-run")
async def agent_run(
    payload: AgentRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    enforce_limits(request, agent_limiter)

    question = payload.question.strip()
    t0 = time.perf_counter()

    def now() -> int:
        return int((time.perf_counter() - t0) * 1000)

    # DB ka saara kaam stream shuru hone se PEHLE (session band hone se bachne ke liye)
    t_ret = time.perf_counter()
    matched, scores, had_match = retrieve(question, db)
    retrieve_ms = int((time.perf_counter() - t_ret) * 1000)

    facts_for_draft = focused_facts(db, matched)
    full_facts = build_facts(db)

    system_prompt = CHAT_SYSTEM_PROMPT.format(
        email=FALLBACK_PROFILE["email"],
        facts=facts_for_draft,
    )

    async def event_stream():
        yield _sse(
            {"step": 0, "status": "done", "detail": question[:160], "t": now()}
        )

        names = ", ".join(
            f"{p['title']} (score {s})" for p, s in zip(matched, scores)
        )
        detail = (
            f"Matched: {names}"
            if had_match
            else f"No strong keyword match, using top projects: {names}"
        )

        yield _sse(
            {
                "step": 1,
                "status": "done",
                "detail": detail,
                "ms": retrieve_ms,
                "t": now(),
            }
        )

        yield _sse(
            {
                "step": 2,
                "status": "running",
                "detail": f"Groq LLM ({_primary_model()}) jawab likh raha hai",
                "t": now(),
            }
        )

        t_llm = time.perf_counter()

        try:
            raw = await call_groq(
                [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
                max_tokens=900,
                temperature=0.3,
            )
        except HTTPException as exc:
            yield _sse(
                {"type": "error", "step": 2, "detail": str(exc.detail), "t": now()}
            )
            return
        except Exception:
            yield _sse(
                {
                    "type": "error",
                    "step": 2,
                    "detail": "Kuch gadbad ho gayi, dobara try karo.",
                    "t": now(),
                }
            )
            return

        llm_ms = int((time.perf_counter() - t_llm) * 1000)

        yield _sse(
            {
                "step": 2,
                "status": "done",
                "detail": f"Draft ready ({len(raw)} characters)",
                "ms": llm_ms,
                "t": now(),
            }
        )

        yield _sse({"step": 3, "status": "running", "t": now()})

        t_ver = time.perf_counter()
        answer, total_urls, removed = verify_links(raw, full_facts)
        verify_ms = int((time.perf_counter() - t_ver) * 1000)

        if total_urls == 0:
            ver_detail = "Jawab mein koi link nahi tha, verify karne ko kuch nahi."
        elif removed:
            ver_detail = (
                f"{total_urls - len(removed)}/{total_urls} links portfolio facts mein mile. "
                f"{len(removed)} unverified link hata diya."
            )
        else:
            ver_detail = f"{total_urls}/{total_urls} links portfolio facts mein verified."

        yield _sse(
            {
                "step": 3,
                "status": "done",
                "detail": ver_detail,
                "ms": verify_ms,
                "t": now(),
            }
        )

        yield _sse({"type": "final", "answer": answer, "total_ms": now()})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
