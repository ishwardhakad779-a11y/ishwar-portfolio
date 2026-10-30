"""
Project cover endpoints (admin only: POST hain, main.py ka middleware key maangta hai).

    POST /api/projects/{id}/cover   {"replace_upload": bool, "next_icon": bool}
        Regenerate: rang/pattern badalta hai, icon wahi rehta hai.
        next_icon=true: icon agla theme ho jata hai ("Change icon" button).
        Upload ki hui image ho toh pehle 409, confirm par replace_upload=true.
    POST /api/projects/covers/fill  {"refresh_auto": bool}
        Image-less projects ko cover do; refresh_auto=true se purane auto covers
        (bina icon wale) ko bhi theme icon ke saath update karta hai.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .cover_svg import AUTO_COVER_NAME, THEMES, read_icon, read_variant
from .cover_theme import build_cover_bytes
from .database import get_db
from .models import Project, StoredFile
from .routes import FILE_URL_PREFIX, delete_file, save_file

router = APIRouter(tags=["project-cover"])


class CoverRequest(BaseModel):
    replace_upload: bool = False
    next_icon: bool = False


class FillRequest(BaseModel):
    refresh_auto: bool = False


def _stored(db: Session, url: str | None) -> StoredFile | None:
    if not url or not url.startswith(FILE_URL_PREFIX):
        return None

    return (
        db.query(StoredFile)
        .filter(StoredFile.id == url[len(FILE_URL_PREFIX):])
        .first()
    )


def _is_auto(stored: StoredFile | None) -> bool:
    return bool(stored and stored.filename == AUTO_COVER_NAME)


async def _attach(
    db: Session,
    project: Project,
    variant: int,
    icon: str | None,
) -> None:
    svg_bytes, _ = await build_cover_bytes(
        project.title,
        project.category,
        project.tags,
        project.description,
        variant,
        icon,
    )

    delete_file(db, project.image_url)
    project.image_url = save_file(db, svg_bytes, "image/svg+xml", AUTO_COVER_NAME)


@router.post("/projects/{project_id}/cover")
async def regenerate_cover(
    project_id: int,
    payload: CoverRequest | None = None,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    payload = payload or CoverRequest()
    current = _stored(db, project.image_url)
    auto = _is_auto(current)

    if project.image_url and not auto and not payload.replace_upload:
        raise HTTPException(
            status_code=409,
            detail="Is project me aapki upload ki hui image lagi hai.",
        )

    previous_variant = read_variant(current.data) if auto else None
    variant = (previous_variant + 1) if previous_variant is not None else 0
    icon = read_icon(current.data) if auto else None

    if payload.next_icon:
        if icon is None:
            # Pehle AI se theme pata karo, phir uske agla wala lo
            _, icon = await build_cover_bytes(
                project.title, project.category, project.tags, project.description
            )
        icon = THEMES[(THEMES.index(icon) + 1) % len(THEMES)]

    await _attach(db, project, variant, icon)

    db.commit()
    db.refresh(project)

    return {"message": "Cover updated", "image_url": project.image_url}


@router.post("/projects/covers/fill")
async def fill_covers(
    payload: FillRequest | None = None,
    db: Session = Depends(get_db),
):
    refresh = bool(payload and payload.refresh_auto)
    changed = 0

    for project in db.query(Project).all():
        if not project.image_url:
            await _attach(db, project, 0, None)
            changed += 1
            continue

        if refresh:
            current = _stored(db, project.image_url)

            if _is_auto(current) and read_icon(current.data) is None:
                await _attach(db, project, read_variant(current.data) or 0, None)
                changed += 1

    db.commit()

    return {"created": changed}
