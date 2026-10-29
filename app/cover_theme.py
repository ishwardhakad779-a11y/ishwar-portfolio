"""
Project ka theme chunna (cover pe kaunsa illustration lage).

1. Pehle Groq AI project ka title/description/tags padhke ek theme chunta hai
   (jaise TripMate -> travel (hawai jahaz), YojanaSaathi -> people (students/log)).
2. AI band ho, limit khatam ho ya jawab samajh na aaye to keywords se chunta hai.
3. Kuch bhi match na ho to "ai" (sparkle).
"""

import re

from fastapi import HTTPException

from .ai import call_groq
from .cover_svg import THEMES, build_cover_svg

# Keyword -> theme. Pehle jo theme zyada keywords match kare wahi jeetega.
KEYWORDS: dict[str, list[str]] = {
    "travel": ["trip", "travel", "tour", "flight", "hotel", "itinerary", "vacation", "journey", "airline", "booking"],
    "people": ["yojana", "scheme", "sarkari", "government", "welfare", "citizen", "student", "scholarship", "saathi", "education", "school", "learning", "community"],
    "security": ["incident", "security", "threat", "cyber", "vulnerab", "alert", "soc", "attack", "fraud", "risk"],
    "research": ["research", "paper", "literature", "arxiv", "summar", "knowledge", "reading"],
    "chat": ["chat", "gpt", "assistant", "bot", "conversation", "companion", "support"],
    "code": ["code", "developer", "github", "review", "compiler", "sdk", "devops"],
    "agent": ["agent", "langgraph", "workflow", "automation", "multi-agent", "orchestr", "pipeline"],
    "data": ["analytics", "dashboard", "data", "visual", "chart", "report", "metrics"],
    "document": ["resume", "cv", "job", "career", "interview", "hiring", "document", "pdf", "recruit"],
    "web": ["website", "studio", "design", "landing", "portfolio", "frontend", "nextjs", "ui"],
    "finance": ["finance", "stock", "money", "expense", "budget", "bank", "invest", "payment"],
    "health": ["health", "medical", "doctor", "fitness", "disease", "hospital", "wellness"],
    "voice": ["voice", "speech", "audio", "whisper", "call", "podcast", "transcri"],
    "location": ["map", "location", "navigation", "gps", "route", "nearby"],
}


def keyword_theme(text: str) -> str | None:
    text = text.lower()
    best_theme = None
    best_score = 0

    for theme, words in KEYWORDS.items():
        score = sum(1 for word in words if word in text)

        if score > best_score:
            best_theme, best_score = theme, score

    return best_theme


async def detect_theme(
    title: str,
    category: str = "",
    tags: str = "",
    description: str = "",
) -> str:
    """AI se theme chuno, nahi chala toh keywords, warna 'ai'."""
    fallback = keyword_theme(f"{title} {category} {tags} {description}") or "ai"

    try:
        reply = await call_groq(
            [
                {
                    "role": "system",
                    "content": (
                        "You pick ONE icon theme for a software project's cover image. "
                        f"Allowed themes: {', '.join(THEMES)}. "
                        "Hints: travel=trips/flights/tourism, people=students/citizens/welfare/"
                        "government schemes, security=incident/cyber, research=papers/search, "
                        "chat=chatbots/assistants, code=developer tools, agent=agent workflows, "
                        "data=analytics, document=resume/jobs, web=websites/design, "
                        "finance=money, health=medical, voice=speech/audio, location=maps, "
                        "ai=anything else. Reply with ONLY the theme word."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Title: {title}\nCategory: {category}\n"
                        f"Tags: {tags}\nDescription: {description[:500]}"
                    ),
                },
            ],
            max_tokens=200,
            temperature=0,
        )
    except (HTTPException, Exception):
        return fallback

    words = re.findall(r"[a-z]+", (reply or "").lower())

    for word in words:
        if word in THEMES:
            return word

    return fallback


async def build_cover_bytes(
    title: str,
    category: str,
    tags: str,
    description: str,
    variant: int = 0,
    icon: str | None = None,
) -> tuple[bytes, str]:
    """(svg bytes, icon naam). icon nahi diya toh AI se chunega."""
    if icon not in THEMES:
        icon = await detect_theme(title, category, tags, description)

    svg = build_cover_svg(title, category, tags, variant, icon)

    return svg.encode("utf-8"), icon
