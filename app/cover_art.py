"""
Project cover illustrations.

Project ke title / category / tags se uska "meaning" pehchaan ke ek matching
illustration banata hai (TripMate -> airplane, YojanaSaathi -> students, ...).

Har illustration 400x400 ke box me bani hai. cover_svg.py use cover ke right side
me lagata hai. Rang (`a` = accent, `d` = dark) palette se aate hain, isliye har
Regenerate pe illustration ke rang bhi badalte hain.
"""

import re

# (theme, regex). Upar wala pehle match hota hai. Pehle title check hota hai,
# phir category + tags.
THEMES: list[tuple[str, str]] = [
    ("travel", r"trip|travel|tour|flight|itinerar|holiday|vacation|airline|journey"),
    (
        "students",
        r"yojana|scheme|student|education|school|college|learn|course|govt|government"
        r"|citizen|welfare|saathi|sarkari",
    ),
    ("incident", r"incident|sre\b|devops|outage|alert|monitor|cyber|security|server|response"),
    ("research", r"research|\brag\b|document|retriev|paper|knowledge|search|pdf|vector|chroma"),
    ("voice", r"jarvis|voice|speech|\bmic\b|alexa|siri"),
    ("dairy", r"dairy|farm|milk|cattle|\bcow\b|agri"),
    ("career", r"\bjob|resume|recruit|career|hiring|\bhire|outreach|internship|\bcv\b"),
    ("tasks", r"journal|task|todo|planner|notes|habit|diary|calendar"),
    ("chat", r"chat|gpt|\bbot\b|conversation"),
    ("web", r"website|\bweb\b|portfolio|studio|landing|frontend|ecommerce|\bshop"),
]


def pick_theme(title: str, category: str = "", tags: str = "") -> str:
    for text in ((title or "").lower(), f"{category} {tags}".lower()):
        for theme, pattern in THEMES:
            if re.search(pattern, text):
                return theme

    return "network"


# ------------------------------------------------------------
# helpers
# ------------------------------------------------------------


def _backdrop(a: str) -> str:
    return (
        f'<circle cx="200" cy="200" r="196" fill="{a}" fill-opacity="0.08"/>'
        f'<circle cx="200" cy="200" r="196" fill="none" stroke="{a}" '
        f'stroke-opacity="0.25" stroke-width="2" stroke-dasharray="3 10" stroke-linecap="round"/>'
    )


def _sparkle(x: float, y: float, r: float, fill: str, op: float = 0.9) -> str:
    k = r * 0.28
    return (
        f'<path d="M{x} {y - r} Q{x + k} {y - k} {x + r} {y} Q{x + k} {y + k} {x} {y + r} '
        f'Q{x - k} {y + k} {x - r} {y} Q{x - k} {y - k} {x} {y - r}Z" '
        f'fill="{fill}" fill-opacity="{op}"/>'
    )


def _lines(x: float, y: float, widths: list[float], color: str, op: float, gap: int = 18, h: int = 8) -> str:
    return "".join(
        f'<rect x="{x}" y="{y + i * gap}" width="{w}" height="{h}" rx="{h / 2}" '
        f'fill="{color}" fill-opacity="{op}"/>'
        for i, w in enumerate(widths)
    )


# ------------------------------------------------------------
# illustrations
# ------------------------------------------------------------


def travel(a: str, d: str) -> str:
    def cloud(x: float, y: float, s: float) -> str:
        return (
            f'<g transform="translate({x} {y}) scale({s})" fill="#ffffff" fill-opacity="0.22">'
            '<circle cx="0" cy="0" r="18"/><circle cx="22" cy="-10" r="24"/>'
            '<circle cx="46" cy="2" r="18"/><rect x="-18" y="0" width="82" height="20" rx="10"/></g>'
        )

    return (
        f'<circle cx="200" cy="215" r="150" fill="#ffffff" fill-opacity="0.06" stroke="{a}" '
        f'stroke-opacity="0.5" stroke-width="2"/>'
        f'<ellipse cx="200" cy="215" rx="150" ry="52" fill="none" stroke="{a}" stroke-opacity="0.28"/>'
        f'<ellipse cx="200" cy="215" rx="68" ry="150" fill="none" stroke="{a}" stroke-opacity="0.28"/>'
        f'<line x1="50" y1="215" x2="350" y2="215" stroke="{a}" stroke-opacity="0.28"/>'
        f'<line x1="200" y1="65" x2="200" y2="365" stroke="{a}" stroke-opacity="0.28"/>'
        + cloud(70, 120, 1.0)
        + cloud(250, 330, 0.8)
        + cloud(318, 170, 0.6)
        + f'<path d="M44 342 C112 330 128 196 250 136 C282 120 308 104 332 84" fill="none" '
        f'stroke="{a}" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round"/>'
        f'<g transform="translate(44 342)"><path d="M0 0 C-16 -22 -22 -34 -22 -44 a22 22 0 1 1 44 0 '
        f'C22 -34 16 -22 0 0Z" fill="{a}"/><circle cy="-44" r="8" fill="{d}"/></g>'
        '<g transform="translate(338 78) rotate(52) scale(0.8)">'
        '<path d="M0 -62 C6 -62 9 -52 9 -40 L9 -18 L62 14 L62 28 L9 12 L9 40 L26 54 L26 64 '
        'L0 58 L-26 64 L-26 54 L-9 40 L-9 12 L-62 28 L-62 14 L-9 -18 L-9 -40 C-9 -52 -6 -62 0 -62Z" '
        'fill="#ffffff"/></g>'
        + _sparkle(330, 300, 14, a, 0.8)
    )


def _student(cx: float, base: float, skin: str, shirt: str, hair: str, a: str, cap: bool, s: float = 1.0) -> str:
    hy = -120  # head center (local)
    parts = [
        f'<g transform="translate({cx} {base}) scale({s})">',
        # body
        f'<path d="M-40 0 C-40 -56 -24 -90 0 -90 C24 -90 40 -56 40 0Z" fill="{shirt}"/>',
        # neck
        f'<rect x="-8" y="-100" width="16" height="16" rx="6" fill="{skin}"/>',
        # head
        f'<circle cx="0" cy="{hy}" r="25" fill="{skin}"/>',
    ]

    if cap:
        parts += [
            f'<path d="M-25 {hy - 2} C-25 {hy - 30} 25 {hy - 30} 25 {hy - 2} C12 {hy - 14} -12 {hy - 14} -25 {hy - 2}Z" fill="{hair}"/>',
            f'<polygon points="-44,{hy - 22} 0,{hy - 40} 44,{hy - 22} 0,{hy - 6}" fill="#111827"/>',
            f'<path d="M-24 {hy - 20} V{hy - 8} C-10 {hy - 1} 10 {hy - 1} 24 {hy - 8} V{hy - 20} L0 {hy - 12}Z" fill="#1f2937"/>',
            f'<path d="M38 {hy - 20} V{hy + 4}" stroke="{a}" stroke-width="3" stroke-linecap="round"/>',
            f'<circle cx="38" cy="{hy + 7}" r="5" fill="{a}"/>',
        ]
    else:
        parts.append(
            f'<path d="M-26 {hy + 2} C-30 {hy - 34} 30 {hy - 34} 26 {hy + 2} C14 {hy - 14} -14 {hy - 14} -26 {hy + 2}Z" fill="{hair}"/>'
        )

    parts += [
        f'<circle cx="-9" cy="{hy + 2}" r="2.6" fill="#1f2937"/><circle cx="9" cy="{hy + 2}" r="2.6" fill="#1f2937"/>',
        f'<path d="M-8 {hy + 12} Q0 {hy + 19} 8 {hy + 12}" fill="none" stroke="#7c2d12" stroke-width="2.4" stroke-linecap="round"/>',
        # book
        f'<rect x="-24" y="-52" width="48" height="32" rx="4" fill="{a}"/>',
        f'<rect x="-24" y="-52" width="24" height="32" rx="4" fill="#ffffff" fill-opacity="0.28"/>',
        '<line x1="0" y1="-52" x2="0" y2="-20" stroke="#0f172a" stroke-opacity="0.35" stroke-width="2"/>',
        "</g>",
    ]

    return "".join(parts)


def students(a: str, d: str) -> str:
    cols = "".join(
        f'<rect x="{x}" y="196" width="22" height="104" rx="4" fill="#ffffff" fill-opacity="0.12"/>'
        for x in (96, 146, 232, 282)
    )

    return (
        # government-style building
        f'<path d="M64 196 L200 112 L336 196Z" fill="#ffffff" fill-opacity="0.10" stroke="{a}" stroke-opacity="0.55" stroke-width="2"/>'
        f'<circle cx="200" cy="168" r="12" fill="{a}" fill-opacity="0.7"/>'
        f'<rect x="70" y="196" width="260" height="14" rx="4" fill="#ffffff" fill-opacity="0.16"/>'
        + cols
        + f'<rect x="60" y="300" width="280" height="18" rx="5" fill="#ffffff" fill-opacity="0.16"/>'
        + f'<rect x="46" y="318" width="308" height="16" rx="5" fill="#ffffff" fill-opacity="0.10"/>'
        # students
        + _student(112, 392, "#f1c9a5", "#6366f1", "#1f2937", a, False, 1.0)
        + _student(288, 392, "#b9805a", "#0ea5e9", "#111827", a, False, 1.0)
        + _student(200, 400, "#d9a679", "#ffffff", "#3b2417", a, True, 1.15)
        # scheme card
        + f'<g transform="translate(262 34) rotate(8)"><rect width="112" height="74" rx="12" fill="#ffffff" fill-opacity="0.95"/>'
        f'<circle cx="30" cy="37" r="17" fill="{a}"/>'
        '<path d="M21 37 L28 44 L40 29" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
        '<rect x="56" y="24" width="42" height="8" rx="4" fill="#0f172a" fill-opacity="0.45"/>'
        '<rect x="56" y="42" width="30" height="8" rx="4" fill="#0f172a" fill-opacity="0.25"/></g>'
        + _sparkle(52, 90, 13, a, 0.9)
    )


def incident(a: str, d: str) -> str:
    units = ""

    for i in range(3):
        y = 104 + i * 80
        led = "#f87171" if i == 1 else "#4ade80"
        units += (
            f'<rect x="40" y="{y}" width="200" height="66" rx="12" fill="#ffffff" fill-opacity="0.09" '
            f'stroke="#ffffff" stroke-opacity="0.28" stroke-width="2"/>'
            f'<circle cx="68" cy="{y + 33}" r="8" fill="{led}"/>'
            + _lines(92, y + 18, [110, 76], "#ffffff", 0.35, 18, 8)
            + f'<rect x="196" y="{y + 20}" width="28" height="26" rx="6" fill="{a}" fill-opacity="0.35"/>'
        )

    return (
        f'<polyline points="14,372 120,372 142,334 170,396 198,350 220,372 386,372" fill="none" '
        f'stroke="{a}" stroke-opacity="0.75" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
        + units
        # shield
        + f'<path d="M280 118 L362 148 V232 C362 292 326 336 280 356 C234 336 198 292 198 232 V148 Z" '
        f'fill="{d}" fill-opacity="0.85"/>'
        f'<path d="M280 118 L362 148 V232 C362 292 326 336 280 356 C234 336 198 292 198 232 V148 Z" '
        f'fill="{a}" fill-opacity="0.28" stroke="{a}" stroke-width="5" stroke-linejoin="round"/>'
        '<path d="M242 238 L270 266 L320 206" fill="none" stroke="#ffffff" stroke-width="14" '
        'stroke-linecap="round" stroke-linejoin="round"/>'
        # alert badge
        + '<g transform="translate(70 52)"><polygon points="0,-34 36,28 -36,28" fill="#fbbf24" stroke="#ffffff" '
        'stroke-width="4" stroke-linejoin="round"/><rect x="-4" y="-14" width="8" height="24" rx="4" fill="#1f2937"/>'
        '<circle cx="0" cy="18" r="5" fill="#1f2937"/></g>'
    )


def research(a: str, d: str) -> str:
    def page(rot: float, op: float, bar: bool) -> str:
        return (
            f'<g transform="rotate({rot} 150 200)">'
            f'<rect x="70" y="80" width="160" height="210" rx="14" fill="#ffffff" fill-opacity="{op}" '
            f'stroke="#ffffff" stroke-opacity="0.3"/>'
            + (f'<rect x="88" y="98" width="70" height="12" rx="6" fill="{a}"/>' if bar else "")
            + _lines(88, 128, [124, 108, 124, 84, 116], "#0f172a" if op > 0.5 else "#ffffff", 0.28 if op > 0.5 else 0.3, 24, 9)
            + "</g>"
        )

    return (
        page(-10, 0.10, False)
        + page(-4, 0.16, False)
        + page(2, 0.94, True)
        # RAG nodes
        + f'<g stroke="{a}" stroke-opacity="0.7" stroke-width="3"><line x1="296" y1="62" x2="352" y2="104"/>'
        '<line x1="296" y1="62" x2="262" y2="116"/><line x1="352" y1="104" x2="326" y2="150"/></g>'
        + f'<circle cx="296" cy="62" r="13" fill="{a}"/><circle cx="352" cy="104" r="10" fill="#ffffff"/>'
        f'<circle cx="262" cy="116" r="9" fill="#ffffff" fill-opacity="0.85"/>'
        # magnifier
        + f'<line x1="282" y1="282" x2="352" y2="352" stroke="{a}" stroke-width="24" stroke-linecap="round"/>'
        f'<circle cx="236" cy="236" r="82" fill="{d}" fill-opacity="0.55"/>'
        f'<circle cx="236" cy="236" r="82" fill="#ffffff" fill-opacity="0.10" stroke="{a}" stroke-width="15"/>'
        + _sparkle(236, 236, 34, "#ffffff", 0.95)
        + _sparkle(272, 196, 11, a, 0.95)
    )


def voice(a: str, d: str) -> str:
    def waves(side: int) -> str:
        sx = 200 + side * 1
        out = ""

        for i, (dx, op, w) in enumerate(((96, 0.8, 9), (136, 0.5, 8), (176, 0.28, 7))):
            x = 200 + side * dx
            spread = 34 + i * 26
            out += (
                f'<path d="M{x} {170 - spread} C{x + side * 26} {200 - spread / 2} {x + side * 26} {200 + spread / 2} {x} {230 + spread}" '
                f'fill="none" stroke="{a}" stroke-opacity="{op}" stroke-width="{w}" stroke-linecap="round" '
                f'transform="translate(0 0)"/>'
            )

        return out

    bars = "".join(
        f'<rect x="{60 + i * 24}" y="{372 - h}" width="12" height="{h}" rx="6" fill="{a}" fill-opacity="{0.35 + (h % 3) * 0.15}"/>'
        for i, h in enumerate((22, 40, 62, 34, 78, 46, 58, 30, 70, 38, 52, 26, 44))
    )

    return (
        waves(1)
        + waves(-1)
        + f'<rect x="156" y="70" width="88" height="160" rx="44" fill="#ffffff" fill-opacity="0.95"/>'
        + "".join(
            f'<line x1="168" y1="{104 + i * 22}" x2="232" y2="{104 + i * 22}" stroke="{d}" stroke-opacity="0.35" stroke-width="5" stroke-linecap="round"/>'
            for i in range(5)
        )
        + f'<path d="M118 190 C118 280 282 280 282 190" fill="none" stroke="{a}" stroke-width="13" stroke-linecap="round"/>'
        f'<line x1="200" y1="268" x2="200" y2="306" stroke="{a}" stroke-width="13" stroke-linecap="round"/>'
        f'<rect x="148" y="300" width="104" height="16" rx="8" fill="{a}"/>'
        + bars
    )


def dairy(a: str, d: str) -> str:
    def wheat(x: float, h: float) -> str:
        grains = "".join(
            f'<ellipse cx="{x - 9}" cy="{330 - h + i * 17}" rx="6" ry="11" fill="{a}" fill-opacity="0.8" transform="rotate(-28 {x - 9} {330 - h + i * 17})"/>'
            f'<ellipse cx="{x + 9}" cy="{330 - h + i * 17}" rx="6" ry="11" fill="{a}" fill-opacity="0.8" transform="rotate(28 {x + 9} {330 - h + i * 17})"/>'
            for i in range(4)
        )
        return (
            f'<line x1="{x}" y1="{330 - h}" x2="{x}" y2="340" stroke="{a}" stroke-opacity="0.8" stroke-width="4" stroke-linecap="round"/>'
            + grains
        )

    return (
        f'<circle cx="300" cy="96" r="44" fill="{a}" fill-opacity="0.35"/>'
        f'<path d="M0 316 C80 276 150 288 214 312 C278 336 340 296 400 312 V400 H0Z" fill="{a}" fill-opacity="0.28"/>'
        f'<path d="M0 352 C90 322 170 340 240 352 C300 362 350 340 400 350 V400 H0Z" fill="{a}" fill-opacity="0.4"/>'
        + wheat(70, 150)
        + wheat(332, 120)
        + '<path d="M166 60 H234 V104 C234 130 276 138 276 182 V324 Q276 350 250 350 H150 Q124 350 124 324 V182 '
        'C124 138 166 130 166 104 Z" fill="#ffffff" fill-opacity="0.95"/>'
        f'<rect x="160" y="40" width="80" height="24" rx="8" fill="{a}"/>'
        f'<rect x="124" y="196" width="152" height="100" fill="{a}" fill-opacity="0.22"/>'
        f'<path d="M200 214 C222 244 234 258 234 272 a34 34 0 0 1 -68 0 C166 258 178 244 200 214Z" fill="{a}"/>'
        '<path d="M142 150 C142 140 152 134 162 128" fill="none" stroke="#0f172a" stroke-opacity="0.12" stroke-width="8" stroke-linecap="round"/>'
        + _sparkle(318, 224, 14, "#ffffff", 0.9)
        + _sparkle(84, 96, 11, a, 0.9)
    )


def career(a: str, d: str) -> str:
    return (
        # trail
        f'<path d="M250 210 C300 190 270 140 330 120" fill="none" stroke="{a}" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>'
        # resume
        + '<rect x="50" y="64" width="190" height="264" rx="16" fill="#ffffff" fill-opacity="0.95"/>'
        f'<circle cx="104" cy="118" r="30" fill="{a}"/>'
        '<circle cx="104" cy="110" r="10" fill="#ffffff"/>'
        '<path d="M86 138 C88 120 120 120 122 138Z" fill="#ffffff"/>'
        '<rect x="148" y="100" width="70" height="11" rx="5" fill="#0f172a" fill-opacity="0.55"/>'
        '<rect x="148" y="122" width="48" height="9" rx="4.5" fill="#0f172a" fill-opacity="0.28"/>'
        + f'<rect x="70" y="170" width="60" height="10" rx="5" fill="{a}"/>'
        + _lines(70, 194, [150, 130, 150], "#0f172a", 0.25, 20, 8)
        + f'<rect x="70" y="262" width="60" height="10" rx="5" fill="{a}"/>'
        + _lines(70, 284, [140, 100], "#0f172a", 0.25, 18, 8)
        # check badge
        + f'<g transform="translate(222 70)"><circle r="24" fill="#22c55e" stroke="#ffffff" stroke-width="4"/>'
        '<path d="M-10 0 L-3 8 L11 -8" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>'
        # paper plane
        + f'<g transform="translate(300 250) rotate(-18)"><path d="M-86 -6 L96 -52 L40 74 L8 22 Z" fill="{a}"/>'
        '<path d="M8 22 L96 -52 L-18 6 Z" fill="#ffffff" fill-opacity="0.85"/>'
        '<path d="M8 22 L-6 70 L40 74Z" fill="#ffffff" fill-opacity="0.45"/></g>'
        + _sparkle(340, 330, 14, a, 0.85)
        + _sparkle(334, 80, 11, "#ffffff", 0.9)
    )


def tasks(a: str, d: str) -> str:
    rows = ""

    for i in range(4):
        y = 116 + i * 58
        done = i < 3
        rows += (
            f'<rect x="124" y="{y}" width="38" height="38" rx="10" fill="{a if done else "none"}" '
            f'fill-opacity="{0.9 if done else 0}" stroke="{a}" stroke-width="3.5"/>'
        )

        if done:
            rows += (
                f'<path d="M133 {y + 20} L141 {y + 28} L154 {y + 11}" fill="none" stroke="{d}" stroke-width="6" '
                'stroke-linecap="round" stroke-linejoin="round"/>'
            )

        rows += _lines(178, y + 7, [100 - i * 8, 64], "#ffffff", 0.55 if done else 0.3, 17, 8)

    return (
        '<rect x="92" y="62" width="216" height="300" rx="22" fill="#ffffff" fill-opacity="0.10" '
        'stroke="#ffffff" stroke-opacity="0.32" stroke-width="2"/>'
        f'<rect x="146" y="44" width="108" height="40" rx="12" fill="{a}"/>'
        '<circle cx="200" cy="64" r="7" fill="#ffffff" fill-opacity="0.9"/>'
        + rows
        + _sparkle(330, 120, 16, a, 0.9)
        + _sparkle(64, 300, 12, "#ffffff", 0.8)
        + f'<g transform="translate(316 292)"><circle r="40" fill="{d}" fill-opacity="0.8" stroke="{a}" stroke-width="5"/>'
        f'<path d="M0 -22 V0 L16 10" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>'
    )


def chat(a: str, d: str) -> str:
    return (
        # user bubble
        '<path d="M70 86 H236 a28 28 0 0 1 28 28 V150 a28 28 0 0 1 -28 28 H112 L74 212 L80 178 '
        'a28 28 0 0 1 -38 -28 V114 a28 28 0 0 1 28 -28Z" fill="#ffffff" fill-opacity="0.14" '
        'stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>'
        + _lines(66, 114, [156, 110], "#ffffff", 0.5, 22, 10)
        # AI bubble
        + f'<path d="M150 214 H332 a30 30 0 0 1 30 30 V292 a30 30 0 0 1 -30 30 H326 L338 360 L292 322 H150 '
        f'a30 30 0 0 1 -30 -30 V244 a30 30 0 0 1 30 -30Z" fill="{a}" fill-opacity="0.92"/>'
        + _lines(150, 246, [170, 120], d, 0.55, 24, 11)
        + f'<circle cx="162" cy="296" r="7" fill="{d}" fill-opacity="0.55"/><circle cx="186" cy="296" r="7" fill="{d}" fill-opacity="0.55"/>'
        f'<circle cx="210" cy="296" r="7" fill="{d}" fill-opacity="0.55"/>'
        + _sparkle(330, 120, 24, "#ffffff", 0.95)
        + _sparkle(362, 170, 12, a, 0.9)
        + _sparkle(62, 292, 13, "#ffffff", 0.7)
    )


def web(a: str, d: str) -> str:
    cards = "".join(
        f'<rect x="{64 + i * 98}" y="244" width="86" height="66" rx="10" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-opacity="0.22"/>'
        f'<rect x="{74 + i * 98}" y="256" width="40" height="8" rx="4" fill="{a}"/>'
        + _lines(74 + i * 98, 276, [64, 46], "#ffffff", 0.35, 15, 6)
        for i in range(3)
    )

    return (
        '<rect x="40" y="70" width="320" height="262" rx="18" fill="#ffffff" fill-opacity="0.08" '
        'stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>'
        '<path d="M40 88 a18 18 0 0 1 18 -18 H342 a18 18 0 0 1 18 18 V112 H40Z" fill="#ffffff" fill-opacity="0.14"/>'
        '<circle cx="64" cy="91" r="6" fill="#f87171"/><circle cx="84" cy="91" r="6" fill="#fbbf24"/>'
        '<circle cx="104" cy="91" r="6" fill="#4ade80"/>'
        '<rect x="132" y="82" width="190" height="18" rx="9" fill="#ffffff" fill-opacity="0.16"/>'
        f'<rect x="64" y="132" width="170" height="86" rx="12" fill="{a}" fill-opacity="0.35"/>'
        + _lines(78, 148, [120, 90], "#ffffff", 0.7, 24, 12)
        + f'<rect x="78" y="196" width="56" height="14" rx="7" fill="{a}"/>'
        + f'<circle cx="294" cy="176" r="44" fill="{a}" fill-opacity="0.28" stroke="{a}" stroke-opacity="0.8" stroke-width="3"/>'
        + _sparkle(294, 176, 22, "#ffffff", 0.9)
        + cards
        + '<path d="M286 262 L286 322 L303 306 L316 334 L328 328 L315 301 L338 299Z" fill="#ffffff" '
        f'stroke="{d}" stroke-width="3" stroke-linejoin="round"/>'
    )


def network(a: str, d: str) -> str:
    layers = [(64, [110, 200, 290]), (148, [76, 156, 244, 324]), (252, [76, 156, 244, 324]), (336, [140, 260])]
    edges = ""
    nodes = ""

    for li in range(len(layers) - 1):
        x1, ys1 = layers[li]
        x2, ys2 = layers[li + 1]

        for y1 in ys1:
            for y2 in ys2:
                edges += f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>'

    for li, (x, ys) in enumerate(layers):
        for ni, y in enumerate(ys):
            hot = (li + ni) % 3 == 0
            nodes += (
                f'<circle cx="{x}" cy="{y + 20}" r="{17 if hot else 13}" '
                f'fill="{a if hot else d}" fill-opacity="{1 if hot else 0.9}" stroke="{a if not hot else "#ffffff"}" stroke-width="3"/>'
            )

    shifted = edges.replace('y1="', 'y1="').replace("<line", "<line")

    return (
        f'<g transform="translate(0 20)" stroke="{a}" stroke-opacity="0.32" stroke-width="2">{shifted}</g>'
        + nodes
        + _sparkle(330, 60, 20, "#ffffff", 0.95)
        + _sparkle(70, 345, 14, a, 0.85)
    )


ART = {
    "travel": travel,
    "students": students,
    "incident": incident,
    "research": research,
    "voice": voice,
    "dairy": dairy,
    "career": career,
    "tasks": tasks,
    "chat": chat,
    "web": web,
    "network": network,
}


def build_art(theme: str, accent: str, dark: str) -> str:
    draw = ART.get(theme, network)

    return _backdrop(accent) + draw(accent, dark)