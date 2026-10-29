"""
Project cover generator.

Title, category aur tags se ek designed SVG cover banata hai (gradient + pattern +
category pill + bada title + tag chips). Ye AI image nahi, designed cover hai:
hamesha chalta hai, koi bahari service nahi, aur har project ek jaisa saaf dikhta hai.

`variant` badalne par rang aur pattern badal jaata hai (Regenerate button isi se chalta hai).
"""

import hashlib
import re
from xml.sax.saxutils import escape

from .cover_art import build_art, pick_theme

# Auto-generated covers isi filename se pehchane jaate hain
# (taaki upload ki hui image ko galti se na hata diya jaye)
AUTO_COVER_NAME = "auto-cover.svg"

VARIANT_RE = re.compile(rb"<!--variant:(\d+)-->")

# Illustration wale covers (v2) is marker se pehchane jaate hain. Marker na ho toh
# purana text-only cover hai, jise startup pe upgrade kar diya jaata hai.
COVER_VERSION_MARK = b"<!--cover:v2-->"

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

WIDTH = 1200
HEIGHT = 675
FONT = "Space Grotesk, Segoe UI, Helvetica, Arial, sans-serif"

# XML me allowed na hone wale control characters
_BAD_XML = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def read_variant(svg_bytes: bytes | None) -> int | None:
    """Pehle bane hue cover ka variant number padho (Regenerate agla number lega)."""
    if not svg_bytes:
        return None

    match = VARIANT_RE.search(svg_bytes[:400])
    return int(match.group(1)) if match else None


def _clean(text: str | None, limit: int) -> str:
    text = _BAD_XML.sub("", text or "")
    return " ".join(text.split())[:limit]


def _wrap(text: str, max_chars: int, max_lines: int = 2) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""

    for index, word in enumerate(words):
        word = word[:max_chars]
        candidate = f"{current} {word}".strip()

        if len(candidate) <= max_chars:
            current = candidate
            continue

        lines.append(current)
        current = word

        if len(lines) == max_lines:
            # Title bahut lamba hai, aakhri line ko "…" se kaat do
            lines[-1] = lines[-1][: max_chars - 1].rstrip() + "…"
            return lines

    if current:
        lines.append(current)

    return lines[:max_lines] or [""]


def _pattern(kind: int, accent: str) -> str:
    if kind == 0:
        return (
            '<pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse">'
            '<circle cx="3" cy="3" r="2" fill="#ffffff" fill-opacity="0.14"/>'
            "</pattern>"
            f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#p)"/>'
        )

    if kind == 1:
        return (
            '<pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse" '
            'patternTransform="rotate(45)">'
            '<rect width="1.5" height="44" fill="#ffffff" fill-opacity="0.08"/>'
            "</pattern>"
            f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#p)"/>'
        )

    rings = "".join(
        f'<circle cx="1040" cy="120" r="{r}" fill="none" stroke="{accent}" '
        f'stroke-opacity="0.18" stroke-width="2"/>'
        for r in (110, 190, 270, 350, 430)
    )
    return rings


def build_cover_svg(
    title: str,
    category: str = "",
    tags: str = "",
    variant: int = 0,
) -> str:
    title = _clean(title, 80) or "Project"
    category = _clean(category, 28).upper()
    tag_list = [_clean(t, 18) for t in (tags or "").split(",")]
    tag_list = [t for t in tag_list if t][:4]

    seed = int(hashlib.sha1(title.encode("utf-8")).hexdigest()[:8], 16)
    c1, c2, accent = PALETTES[(seed + variant) % len(PALETTES)]
    pattern_kind = variant % 3

    # Title
    # Right side illustration ke liye jagah chhodni hai (x = 745 se)
    if len(title) <= 30:
        size, max_chars = 62, 16
    else:
        size, max_chars = 50, 21

    lines = _wrap(title, max_chars)
    line_height = int(size * 1.16)
    title_y = 290 if len(lines) == 2 else 330

    parts: list[str] = []

    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
        f'viewBox="0 0 {WIDTH} {HEIGHT}">'
    )
    parts.append(f"<!--variant:{variant}-->")
    parts.append(COVER_VERSION_MARK.decode())
    parts.append(
        "<defs>"
        '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/>'
        "</linearGradient>"
        '<radialGradient id="glow" cx="0.85" cy="0.1" r="0.7">'
        f'<stop offset="0" stop-color="{accent}" stop-opacity="0.45"/>'
        f'<stop offset="1" stop-color="{accent}" stop-opacity="0"/>'
        "</radialGradient>"
        "</defs>"
    )
    parts.append(f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#bg)"/>')
    parts.append(f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#glow)"/>')
    parts.append(_pattern(pattern_kind, accent))

    # Illustration (title / category / tags se matching theme)
    theme = pick_theme(title, category, tags)
    parts.append(f"<!--theme:{theme}-->")
    parts.append(f'<g transform="translate(745 112)">{build_art(theme, accent, c1)}</g>')

    # Category pill
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

    # Title
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

    # Tag chips
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