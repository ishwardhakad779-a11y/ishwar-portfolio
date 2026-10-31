"""
Project cover generator.

Title, category aur tags se designed SVG cover banata hai: gradient + pattern +
category pill + bada title + tag chips + project ke theme ka bada illustration
(hawai jahaz, shield, log, magnifier...).

Theme ka chunav cover_theme.py karta hai (AI ya keywords). Ye vector illustrations hain,
asli photos nahi. `variant` badalne par rang aur pattern badalta hai.
"""

import hashlib
import re
from xml.sax.saxutils import escape

# Auto-generated covers isi filename se pehchane jaate hain
# (taaki upload ki hui image ko galti se na hata diya jaye)
AUTO_COVER_NAME = "auto-cover.svg"

VARIANT_RE = re.compile(rb"<!--variant:(\d+)-->")
ICON_RE = re.compile(rb"<!--icon:([a-z]+)-->")

# (gradient start, gradient end, accent)
PALETTES = [
    ("#0b1220", "#0e7490", "#67e8f9"),  # cyan
    ("#17123a", "#6d28d9", "#c4b5fd"),  # violet
    ("#04210f", "#047857", "#6ee7b7"),  # emerald
    ("#2a0f06", "#c2410c", "#fdba74"),  # orange
    ("#2b0530", "#be185d", "#f9a8d4"),  # pink
    ("#0b1737", "#1d4ed8", "#93c5fd"),  # blue
    ("#1a1405", "#a16207", "#fde047"),  # amber
]

# Har icon 100x100 ke dabbe me bana hai. @A@ = accent color.
ICONS: dict[str, str] = {
    "travel": (
        '<path d="M10 92 Q 24 64 44 66" stroke-dasharray="2 7" stroke-opacity="0.7"/>'
        '<g transform="translate(50 50) rotate(45) translate(-50 -50)">'
        '<path transform="scale(4.1667)" stroke="none" fill="@A@" '
        'd="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>'
        "</g>"
    ),
    "people": (
        '<circle cx="18" cy="50" r="8" fill="@A@" fill-opacity="0.18"/>'
        '<path d="M4 82 C4 70 9 64 18 64 C22 64 25 65 28 67"/>'
        '<circle cx="82" cy="50" r="8" fill="@A@" fill-opacity="0.18"/>'
        '<path d="M96 82 C96 70 91 64 82 64 C78 64 75 65 72 67"/>'
        '<circle cx="50" cy="42" r="12" fill="@A@" fill-opacity="0.22"/>'
        '<path d="M26 86 C26 68 38 60 50 60 C62 60 74 68 74 86 Z" fill="@A@" fill-opacity="0.16"/>'
        '<polygon points="33,30 50,22 67,30 50,38" fill="@A@" stroke-width="2.5"/>'
        '<path d="M67 30 V41"/>'
    ),
    "security": (
        '<path d="M50 8 L88 22 V48 C88 72 72 88 50 94 C28 88 12 72 12 48 V22 Z" fill="@A@" fill-opacity="0.15"/>'
        '<path d="M50 34 V58"/>'
        '<circle cx="50" cy="71" r="3.5" fill="@A@" stroke="none"/>'
    ),
    "research": (
        '<circle cx="42" cy="42" r="28" fill="@A@" fill-opacity="0.12"/>'
        '<path d="M62 62 L90 90" stroke-width="6"/>'
        '<path d="M28 38 H56"/><path d="M28 50 H46"/>'
    ),
    "chat": (
        '<path d="M14 18 H86 A8 8 0 0 1 94 26 V62 A8 8 0 0 1 86 70 H48 L28 88 V70 H14 A8 8 0 0 1 6 62 V26 A8 8 0 0 1 14 18 Z" fill="@A@" fill-opacity="0.15"/>'
        '<circle cx="30" cy="44" r="4" fill="@A@" stroke="none"/>'
        '<circle cx="50" cy="44" r="4" fill="@A@" stroke="none"/>'
        '<circle cx="70" cy="44" r="4" fill="@A@" stroke="none"/>'
    ),
    "code": (
        '<rect x="8" y="16" width="84" height="68" rx="8" fill="@A@" fill-opacity="0.12"/>'
        '<path d="M8 32 H92"/>'
        '<path d="M24 46 L38 58 L24 70"/><path d="M46 70 H68"/>'
    ),
    "agent": (
        '<path d="M50 50 L18 22"/><path d="M50 50 L82 22"/>'
        '<path d="M50 50 L18 78"/><path d="M50 50 L82 78"/>'
        '<circle cx="50" cy="50" r="12" fill="@A@" fill-opacity="0.3"/>'
        '<circle cx="18" cy="22" r="8" fill="@A@" fill-opacity="0.15"/>'
        '<circle cx="82" cy="22" r="8" fill="@A@" fill-opacity="0.15"/>'
        '<circle cx="18" cy="78" r="8" fill="@A@" fill-opacity="0.15"/>'
        '<circle cx="82" cy="78" r="8" fill="@A@" fill-opacity="0.15"/>'
    ),
    "data": (
        '<rect x="14" y="56" width="14" height="30" rx="3" fill="@A@" fill-opacity="0.22"/>'
        '<rect x="36" y="38" width="14" height="48" rx="3" fill="@A@" fill-opacity="0.22"/>'
        '<rect x="58" y="20" width="14" height="66" rx="3" fill="@A@" fill-opacity="0.22"/>'
        '<rect x="80" y="44" width="14" height="42" rx="3" fill="@A@" fill-opacity="0.22"/>'
        '<path d="M8 92 H98"/>'
    ),
    "document": (
        '<rect x="20" y="8" width="56" height="84" rx="6" fill="@A@" fill-opacity="0.12"/>'
        '<path d="M32 28 H64"/><path d="M32 42 H64"/><path d="M32 56 H52"/>'
        '<circle cx="70" cy="76" r="15" fill="@A@" fill-opacity="0.3"/>'
        '<path d="M62 76 L68 82 L79 70"/>'
    ),
    "web": (
        '<rect x="8" y="14" width="84" height="72" rx="8" fill="@A@" fill-opacity="0.12"/>'
        '<path d="M8 34 H92"/>'
        '<circle cx="20" cy="24" r="2.5" fill="@A@" stroke="none"/>'
        '<circle cx="30" cy="24" r="2.5" fill="@A@" stroke="none"/>'
        '<circle cx="40" cy="24" r="2.5" fill="@A@" stroke="none"/>'
        '<rect x="18" y="44" width="30" height="32" rx="4" fill="@A@" fill-opacity="0.2"/>'
        '<path d="M58 48 H82"/><path d="M58 60 H82"/><path d="M58 72 H74"/>'
    ),
    "finance": (
        '<circle cx="50" cy="50" r="38" fill="@A@" fill-opacity="0.12"/>'
        '<circle cx="50" cy="50" r="28"/>'
        '<text x="50" y="65" text-anchor="middle" font-size="40" font-weight="700" '
        'font-family="Segoe UI, Arial, sans-serif" fill="@A@" stroke="none">&#8377;</text>'
    ),
    "health": (
        '<path d="M50 86 C10 58 14 24 34 24 C44 24 50 32 50 32 C50 32 56 24 66 24 C86 24 90 58 50 86 Z" fill="@A@" fill-opacity="0.15"/>'
        '<path d="M20 50 H38 L44 36 L54 64 L60 50 H80"/>'
    ),
    "voice": (
        '<rect x="38" y="8" width="24" height="46" rx="12" fill="@A@" fill-opacity="0.15"/>'
        '<path d="M24 46 C24 66 36 74 50 74 C64 74 76 66 76 46"/>'
        '<path d="M50 74 V90"/><path d="M36 90 H64"/>'
    ),
    "location": (
        '<path d="M50 94 C18 58 20 12 50 12 C80 12 82 58 50 94 Z" fill="@A@" fill-opacity="0.15"/>'
        '<circle cx="50" cy="44" r="12" fill="@A@" fill-opacity="0.3"/>'
    ),
    "ai": (
        '<path d="M50 8 L60 40 L92 50 L60 60 L50 92 L40 60 L8 50 L40 40 Z" fill="@A@" fill-opacity="0.18"/>'
        '<path d="M80 4 L83 14 L93 17 L83 20 L80 30 L77 20 L67 17 L77 14 Z" fill="@A@" stroke="none"/>'
    ),
}

THEMES = list(ICONS.keys())

WIDTH = 1200
HEIGHT = 675
FONT = "Space Grotesk, Segoe UI, Helvetica, Arial, sans-serif"

_BAD_XML = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def read_variant(svg_bytes: bytes | None) -> int | None:
    if not svg_bytes:
        return None

    match = VARIANT_RE.search(svg_bytes[:400])
    return int(match.group(1)) if match else None


def read_icon(svg_bytes: bytes | None) -> str | None:
    if not svg_bytes:
        return None

    match = ICON_RE.search(svg_bytes[:400])
    name = match.group(1).decode() if match else None
    return name if name in ICONS else None


def _clean(text: str | None, limit: int) -> str:
    text = _BAD_XML.sub("", text or "")
    return " ".join(text.split())[:limit]


def _wrap(text: str, max_chars: int, max_lines: int = 2) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""

    for word in words:
        word = word[:max_chars]
        candidate = f"{current} {word}".strip()

        if len(candidate) <= max_chars:
            current = candidate
            continue

        lines.append(current)
        current = word

        if len(lines) == max_lines:
            lines[-1] = lines[-1][: max_chars - 1].rstrip() + "…"
            return lines

    if current:
        lines.append(current)

    return lines[:max_lines] or [""]


def _pattern(kind: int, accent: str) -> str:
    if kind == 0:
        return (
            '<pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse">'
            '<circle cx="3" cy="3" r="2" fill="#ffffff" fill-opacity="0.12"/>'
            "</pattern>"
            f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#p)"/>'
        )

    if kind == 1:
        return (
            '<pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse" '
            'patternTransform="rotate(45)">'
            '<rect width="1.5" height="44" fill="#ffffff" fill-opacity="0.07"/>'
            "</pattern>"
            f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#p)"/>'
        )

    return "".join(
        f'<circle cx="1040" cy="120" r="{r}" fill="none" stroke="{accent}" '
        f'stroke-opacity="0.14" stroke-width="2"/>'
        for r in (110, 190, 270, 350, 430)
    )


def build_cover_svg(
    title: str,
    category: str = "",
    tags: str = "",
    variant: int = 0,
    icon: str = "ai",
) -> str:
    title = _clean(title, 80) or "Project"
    category = _clean(category, 28).upper()
    tag_list = [_clean(t, 18) for t in (tags or "").split(",")]
    tag_list = [t for t in tag_list if t][:4]

    if icon not in ICONS:
        icon = "ai"

    seed = int(hashlib.sha1(title.encode("utf-8")).hexdigest()[:8], 16)
    c1, c2, accent = PALETTES[(seed + variant) % len(PALETTES)]
    pattern_kind = variant % 3

    if len(title) <= 24:
        size, max_chars = 72, 15
    else:
        size, max_chars = 54, 20

    lines = _wrap(title, max_chars)
    line_height = int(size * 1.16)
    title_y = 290 if len(lines) == 2 else 330

    parts: list[str] = []

    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
        f'viewBox="0 0 {WIDTH} {HEIGHT}">'
    )
    parts.append(f"<!--variant:{variant}--><!--icon:{icon}-->")
    parts.append(
        "<defs>"
        '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/>'
        "</linearGradient>"
        '<radialGradient id="glow" cx="0.8" cy="0.45" r="0.6">'
        f'<stop offset="0" stop-color="{accent}" stop-opacity="0.35"/>'
        f'<stop offset="1" stop-color="{accent}" stop-opacity="0"/>'
        "</radialGradient>"
        "</defs>"
    )
    parts.append(f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#bg)"/>')
    parts.append(f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#glow)"/>')
    parts.append(_pattern(pattern_kind, accent))

    icon_markup = ICONS[icon].replace("@A@", accent)
    parts.append(
        f'<circle cx="950" cy="335" r="240" fill="{accent}" fill-opacity="0.08"/>'
    )
    parts.append(
        f'<circle cx="950" cy="335" r="240" fill="none" stroke="{accent}" '
        f'stroke-opacity="0.25" stroke-width="2"/>'
    )
    parts.append(
        '<g transform="translate(745 130) scale(4.1)" fill="none" '
        f'stroke="{accent}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'
        f"{icon_markup}</g>"
    )

    if category:
        pill_w = min(len(category) * 15 + 52, 520)
        parts.append(
            f'<rect x="60" y="56" width="{pill_w}" height="46" rx="23" '
            f'fill="{accent}" fill-opacity="0.16" stroke="{accent}" stroke-opacity="0.55"/>'
        )
        parts.append(
            f'<text x="{60 + pill_w / 2}" y="86" text-anchor="middle" font-family="{FONT}" '
            f'font-size="22" font-weight="600" letter-spacing="3" fill="{accent}">'
            f"{escape(category)}</text>"
        )

    for i, line in enumerate(lines):
        parts.append(
            f'<text x="60" y="{title_y + i * line_height}" font-family="{FONT}" '
            f'font-size="{size}" font-weight="700" letter-spacing="-1.5" fill="#ffffff">'
            f"{escape(line)}</text>"
        )

    underline_y = title_y + (len(lines) - 1) * line_height + 40
    parts.append(
        f'<rect x="60" y="{underline_y}" width="90" height="7" rx="3.5" fill="{accent}"/>'
    )

    x = 60
    for tag in tag_list:
        chip_w = len(tag) * 13 + 44

        if x + chip_w > WIDTH - 60:
            break

        parts.append(
            f'<rect x="{x}" y="580" width="{chip_w}" height="44" rx="22" '
            f'fill="#000000" fill-opacity="0.28" stroke="#ffffff" stroke-opacity="0.22"/>'
        )
        parts.append(
            f'<text x="{x + chip_w / 2}" y="609" text-anchor="middle" font-family="{FONT}" '
            f'font-size="21" fill="#ffffff" fill-opacity="0.92">{escape(tag)}</text>'
        )
        x += chip_w + 14

    parts.append("</svg>")

    return "".join(parts)
