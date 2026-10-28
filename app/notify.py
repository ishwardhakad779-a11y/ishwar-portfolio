"""
Owner ko Telegram alert (optional).

Jab koi visitor JD Match chalata hai, Ishwar ko Telegram pe ek chhota message aata hai.
Ye tabhi chalta hai jab Render pe ye env variables set hon, warna chupchaap skip:

    TELEGRAM_BOT_TOKEN   (BotFather se milta hai)
    TELEGRAM_CHAT_ID     (tera chat id)
    NOTIFY_MIN_MATCH     (optional, default 0. Jaise 70 rakhoge toh sirf 70%+ match pe alert)

Privacy: IP ya koi personal data nahi bheja jaata. JD ka sirf pehle 200 characters jaate hain,
aur frontend pe visitor ko bataya jaata hai ki owner ko notification mil sakti hai.
"""

import asyncio
import os

import httpx

# create_task ka reference rakhna padta hai warna task beech me garbage-collect ho sakta hai
_tasks: set[asyncio.Task] = set()


def _build_message(jd_text: str, result) -> str:
    skills = ", ".join(result.matching_skills[:5]) or "-"
    projects = ", ".join(p.title for p in result.relevant_projects) or "-"
    snippet = " ".join(jd_text.split())[:200]

    return (
        "JD match chala portfolio pe\n"
        f"Match: {result.match_percent}%\n"
        f"Matching skills: {skills}\n"
        f"Relevant projects: {projects}\n\n"
        f"JD snippet: {snippet}"
    )


async def _send(token: str, chat_id: str, text: str) -> None:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "disable_web_page_preview": True,
                },
            )
    except Exception as error:
        # Sirf error ka type print karo. Message me URL (aur token) aa sakta hai.
        print(f"[notify] telegram failed: {type(error).__name__}", flush=True)


def notify_owner_jd(jd_text: str, result) -> None:
    """Fire-and-forget: user ke response ko slow nahi karta."""
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()

    if not token or not chat_id:
        return

    try:
        min_match = int(os.getenv("NOTIFY_MIN_MATCH", "0"))
    except ValueError:
        min_match = 0

    if result.match_percent < min_match:
        return

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return

    task = loop.create_task(_send(token, chat_id, _build_message(jd_text, result)))
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)
