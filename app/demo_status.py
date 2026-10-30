"""
Live demo status board.

    GET /api/demo-status   (public)

Portfolio ke projects ke `live_url` ko asli mein ping karta hai aur batata hai:
    online   - demo jaga hua hai (response time ke saath)
    waking   - demo so raha tha, ab jaag raha hai (free hosting pe 30-50s lagte hain)
    offline  - demo jawab nahi de raha
    paused   - aaj ke ping ki limit khatam (neeche dekho)

IMPORTANT (Render free plan):
Render free plan mein poore workspace ke liye sirf 750 instance-hours / month milte hain.
Har ping ek soye hue demo ko jaga deta hai, isliye:
  * har demo ke liye roz sirf STATUS_WAKES_PER_DAY pings (default 6) allowed hain
  * results server pe cache hote hain (online = 10 min), to 100 visitors aaye toh bhi
    demos ko 100 baar ping nahi hota
  * sirf https wale public URLs ping hote hain
Limit khatam hone pe board "paused" dikhata hai, kuch tootta nahi.
"""

import asyncio
import ipaddress
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from .agent_demo import _load_projects
from .database import get_db

router = APIRouter(tags=["demo-status"])

MAX_DEMOS = 4
PING_TIMEOUT = 9.0

# Result kitni der tak cache rahe (seconds)
TTL = {"online": 600, "waking": 15, "offline": 90, "paused": 60}

_state: dict[str, dict] = {}
_budget: dict[str, list] = {}  # url -> [din, ping_count]
_hits: dict[str, deque] = defaultdict(deque)


def _max_wakes_per_day() -> int:
    try:
        return max(0, int(os.getenv("STATUS_WAKES_PER_DAY", "6")))
    except ValueError:
        return 6


def _rate_limit(request: Request) -> None:
    """Ek IP se 5 minute mein max 40 requests."""
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    ip = forwarded or (request.client.host if request.client else "unknown")

    now = time.time()

    if len(_hits) > 2000:
        _hits.clear()

    queue = _hits[ip]

    while queue and now - queue[0] > 300:
        queue.popleft()

    if len(queue) >= 40:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again in a few minutes.",
        )

    queue.append(now)


def _is_public_https(url: str) -> bool:
    try:
        parsed = urlparse(url)
    except ValueError:
        return False

    host = (parsed.hostname or "").lower()

    if parsed.scheme != "https" or not host or "." not in host:
        return False

    if host == "localhost" or host.endswith((".local", ".internal")):
        return False

    try:
        ipaddress.ip_address(host)
        return False  # seedha IP address allowed nahi
    except ValueError:
        return True


def _try_charge(url: str) -> bool:
    """Aaj ke ping budget me se ek ping kharch karo. Budget khatam toh False."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    day, count = _budget.get(url, [today, 0])

    if day != today:
        day, count = today, 0

    if count >= _max_wakes_per_day():
        _budget[url] = [day, count]
        return False

    _budget[url] = [day, count + 1]
    return True


def _view(title: str, url: str, entry: dict) -> dict:
    return {
        "title": title,
        "url": url,
        "status": entry["status"],
        "ms": entry.get("ms"),
        "checked_at": int(entry["at"]),
    }


async def _check(title: str, url: str) -> dict:
    now = time.time()
    cached = _state.get(url)

    if cached and now - cached["at"] < TTL.get(cached["status"], 60):
        return _view(title, url, cached)

    # "waking" wale demo ko dobara dekhna jaage hue ko poochna hai, budget nahi kharch hota
    already_waking = bool(cached and cached["status"] == "waking")

    if not already_waking and not _try_charge(url):
        entry = {
            "status": "paused",
            "ms": cached.get("ms") if cached else None,
            "at": now,
        }
        _state[url] = entry
        return _view(title, url, entry)

    started = time.perf_counter()
    status = "offline"
    ms = None

    try:
        async with httpx.AsyncClient(
            timeout=PING_TIMEOUT, follow_redirects=True
        ) as client:
            async with client.stream(
                "GET",
                url,
                headers={"User-Agent": "ishwar-portfolio-status/1.0"},
            ) as response:
                # Sirf headers tak ka time naapte hain, page download nahi karte
                ms = int((time.perf_counter() - started) * 1000)

                if response.status_code < 500:
                    status = "online"
                elif response.status_code in (502, 503, 504):
                    status = "waking"
    except httpx.TimeoutException:
        status = "waking"
    except httpx.HTTPError:
        status = "offline"

    entry = {"status": status, "ms": ms, "at": time.time()}
    _state[url] = entry

    return _view(title, url, entry)


@router.get("/demo-status")
async def demo_status(request: Request, db: Session = Depends(get_db)):
    _rate_limit(request)

    targets: list[tuple[str, str]] = []
    seen: set[str] = set()

    for project in _load_projects(db):
        url = (project.get("live_url") or "").strip()

        if url and url not in seen and _is_public_https(url):
            seen.add(url)
            targets.append((project["title"], url))

        if len(targets) >= MAX_DEMOS:
            break

    results = await asyncio.gather(*(_check(title, url) for title, url in targets))

    return JSONResponse(
        {"demos": list(results)},
        headers={"Cache-Control": "no-store"},
    )
