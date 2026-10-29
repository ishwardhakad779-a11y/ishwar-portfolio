"""
Project cover endpoints (admin only, kyunki POST hain aur main.py ka X-Admin-Key
middleware non-GET requests ko rokta hai).

    POST /api/projects/{id}/cover     naya auto cover (Regenerate). Har click pe rang/pattern badalta hai.
    POST /api/projects/covers/fill    jin projects me image nahi hai unko auto cover do

Upload ki hui image ko Regenerate galti se na hata de, isliye agar project me
upload ki hui image hai to pehle 409 aata hai, aur confirm karne par
`{"replace_upload": true}` bhejne se hi replace hota hai.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .cover_svg import AUTO_COVER_NAME, build_cover_svg, read_variant
from .database import get_db
from .models import Project, StoredFile
from .routes import FILE_URL_PREFIX, delete_file, save_file

router = APIRouter(tags=["project-cover"])


class CoverRequest(BaseModel):
    replace_upload: bool = False


def _stored(db: Session, url: str | None) -> StoredFile | None:
    if not url or not url.startswith(FILE_URL_PREFIX):
        return None

    return (
        db.query(StoredFile)
        .filter(StoredFile.id == url[len(FILE_URL_PREFIX):])
        .first()
    )


def _is_auto_cover(stored: StoredFile | None) -> bool:
    return bool(stored and stored.filename == AUTO_COVER_NAME)


def _attach_cover(db: Session, project: Project, variant: int) -> None:
    svg = build_cover_svg(
        project.title,
        project.category,
        project.tags,
        variant,
    )

    delete_file(db, project.image_url)

    project.image_url = save_file(
        db,
        svg.encode("utf-8"),
        "image/svg+xml",
        AUTO_COVER_NAME,
    )


@router.post("/projects/{project_id}/cover")
def regenerate_cover(
    project_id: int,
    payload: CoverRequest | None = None,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    current = _stored(db, project.image_url)
    replace_upload = bool(payload and payload.replace_upload)

    # Upload ki hui image hai aur user ne abhi confirm nahi kiya
    if project.image_url and not _is_auto_cover(current) and not replace_upload:
        raise HTTPException(
            status_code=409,
            detail="Is project me aapki upload ki hui image lagi hai.",
        )

    # Pichle cover ka agla variant lo, taaki har click pe rang/pattern pakka badle
    previous = read_variant(current.data) if _is_auto_cover(current) else None
    variant = (previous + 1) if previous is not None else 0

    _attach_cover(db, project, variant)

    db.commit()
    db.refresh(project)

    return {"message": "Cover updated", "image_url": project.image_url}


@router.post("/projects/covers/fill")
def fill_missing_covers(db: Session = Depends(get_db)):
    projects = db.query(Project).filter(
        (Project.image_url.is_(None)) | (Project.image_url == "")
    ).all()

    for project in projects:
        _attach_cover(db, project, 0)

    db.commit()

    return {"created": len(projects)}
