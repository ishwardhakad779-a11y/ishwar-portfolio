from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from .database import get_db
from .cover_svg import AUTO_COVER_NAME
from .cover_theme import build_cover_bytes
from .models import Project, Profile, Resume, Stack, StoredFile
from .schemas import (
    ProfileCreate,
    ProfileResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    ResumeResponse,
    StackCreate,
    StackResponse,
)

router = APIRouter()


# ============================================================
# UPLOAD DIRECTORIES
# ============================================================

# main.py ka /uploads mount chalne ke liye folder zaroori hai.
# Nayi files ab database mein save hoti hain (neeche helpers dekho).
Path("uploads").mkdir(parents=True, exist_ok=True)


# ============================================================
# FILE STORAGE (database mein)
# ============================================================

FILE_URL_PREFIX = "/api/files/"


def save_file(db: Session, content: bytes, content_type: str, filename: str) -> str:
    file_id = uuid4().hex

    db.add(
        StoredFile(
            id=file_id,
            filename=filename or "",
            content_type=content_type,
            data=content,
        )
    )

    return f"{FILE_URL_PREFIX}{file_id}"


def delete_file(db: Session, url: str | None) -> None:
    if not url or not url.startswith(FILE_URL_PREFIX):
        return

    stored = (
        db.query(StoredFile)
        .filter(StoredFile.id == url[len(FILE_URL_PREFIX):])
        .first()
    )

    if stored:
        db.delete(stored)


@router.get("/files/{file_id}")
def get_file(file_id: str, db: Session = Depends(get_db)):
    stored = (
        db.query(StoredFile)
        .filter(StoredFile.id == file_id)
        .first()
    )

    if not stored:
        raise HTTPException(status_code=404, detail="File not found")

    headers = {"Cache-Control": "public, max-age=31536000, immutable"}

    if stored.content_type == "application/pdf":
        safe_name = "".join(
            c for c in (stored.filename or "Resume.pdf")
            if c.isascii() and c not in '"\\\r\n'
        ) or "Resume.pdf"
        headers["Content-Disposition"] = f'inline; filename="{safe_name}"'

    return Response(
        content=stored.data,
        media_type=stored.content_type,
        headers=headers,
    )


# ============================================================
# PROJECTS
# ============================================================

@router.get("/projects", response_model=list[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return (
        db.query(Project)
        .order_by(
            Project.display_order.asc(),
            Project.id.desc(),
        )
        .all()
    )


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project


@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
):
    project = Project(
        **project_data.model_dump()
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    # Image nahi di toh automatic cover lag jaye (baad me admin se badal sakte ho)
    if not project.image_url:
        try:
            svg_bytes, _icon = await build_cover_bytes(
                project.title,
                project.category,
                project.tags,
                project.description,
            )
            project.image_url = save_file(
                db,
                svg_bytes,
                "image/svg+xml",
                AUTO_COVER_NAME,
            )
            db.commit()
            db.refresh(project)
        except Exception:
            db.rollback()
            db.refresh(project)

    return project


@router.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    update_data = project_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)

    return project


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    delete_file(db, project.image_url)

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }


# ============================================================
# PROJECT IMAGE UPLOAD
# ============================================================

@router.post("/projects/{project_id}/image")
async def upload_project_image(
    project_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    allowed_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, WEBP and GIF images are allowed",
        )

    content = await image.read()

    # 5 MB maximum
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image must be smaller than 5 MB",
        )

    # Delete old image when replacing
    delete_file(db, project.image_url)

    project.image_url = save_file(
        db,
        content,
        image.content_type,
        image.filename or "image",
    )

    db.commit()
    db.refresh(project)

    return {
        "message": "Image uploaded successfully",
        "image_url": project.image_url,
        "project": project,
    }


@router.delete("/projects/{project_id}/image")
def delete_project_image(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    delete_file(db, project.image_url)

    project.image_url = ""

    db.commit()
    db.refresh(project)

    return {
        "message": "Project image removed successfully"
    }


# ============================================================
# STACK / TECH STACK
# ============================================================

@router.get("/stack", response_model=list[StackResponse])
def get_stack(
    db: Session = Depends(get_db),
):
    return (
        db.query(Stack)
        .order_by(
            Stack.display_order.asc(),
            Stack.id.asc(),
        )
        .all()
    )


@router.post("/stack", response_model=StackResponse)
def create_stack(
    stack_data: StackCreate,
    db: Session = Depends(get_db),
):
    stack = Stack(
        **stack_data.model_dump()
    )

    db.add(stack)
    db.commit()
    db.refresh(stack)

    return stack


@router.put("/stack/{stack_id}", response_model=StackResponse)
def update_stack(
    stack_id: int,
    stack_data: StackCreate,
    db: Session = Depends(get_db),
):
    stack = (
        db.query(Stack)
        .filter(Stack.id == stack_id)
        .first()
    )

    if not stack:
        raise HTTPException(
            status_code=404,
            detail="Stack item not found",
        )

    stack.name = stack_data.name
    stack.display_order = stack_data.display_order

    db.commit()
    db.refresh(stack)

    return stack


@router.delete("/stack/{stack_id}")
def delete_stack(
    stack_id: int,
    db: Session = Depends(get_db),
):
    stack = (
        db.query(Stack)
        .filter(Stack.id == stack_id)
        .first()
    )

    if not stack:
        raise HTTPException(
            status_code=404,
            detail="Stack item not found",
        )

    db.delete(stack)
    db.commit()

    return {
        "message": "Stack item deleted successfully"
    }


# ============================================================
# PROFILE
# ============================================================

@router.get(
    "/profile",
    response_model=ProfileResponse | None,
)
def get_profile(
    db: Session = Depends(get_db),
):
    return db.query(Profile).first()


@router.post(
    "/profile",
    response_model=ProfileResponse,
)
def create_profile(
    profile_data: ProfileCreate,
    db: Session = Depends(get_db),
):
    existing_profile = db.query(Profile).first()

    if existing_profile:
        for key, value in profile_data.model_dump().items():
            setattr(
                existing_profile,
                key,
                value,
            )

        db.commit()
        db.refresh(existing_profile)

        return existing_profile

    profile = Profile(
        **profile_data.model_dump()
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


# ============================================================
# RESUME
# ============================================================

@router.get(
    "/resume",
    response_model=ResumeResponse | None,
)
def get_resume(
    db: Session = Depends(get_db),
):
    """
    Get the currently uploaded resume.
    """

    resume = (
        db.query(Resume)
        .order_by(Resume.id.desc())
        .first()
    )

    return resume


@router.post(
    "/resume/upload",
    response_model=ResumeResponse,
)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload or replace the portfolio resume.

    Only PDF files are accepted.
    Maximum file size: 10 MB.
    """

    # --------------------------------------------------------
    # Validate PDF
    # --------------------------------------------------------

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Resume file is empty.",
        )

    # --------------------------------------------------------
    # 10 MB limit
    # --------------------------------------------------------

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Resume must be smaller than 10 MB.",
        )

    # --------------------------------------------------------
    # Get existing resume
    # --------------------------------------------------------

    existing_resume = (
        db.query(Resume)
        .order_by(Resume.id.desc())
        .first()
    )

    # --------------------------------------------------------
    # Delete old physical file
    # --------------------------------------------------------

    if existing_resume:
        delete_file(db, existing_resume.file_url)

    # --------------------------------------------------------
    # Create unique filename
    # --------------------------------------------------------

    original_filename = (
        file.filename
        if file.filename
        else "Resume.pdf"
    )

    # --------------------------------------------------------
    # Save PDF (database mein)
    # --------------------------------------------------------

    file_url = save_file(
        db,
        content,
        "application/pdf",
        original_filename,
    )

    # --------------------------------------------------------
    # Update existing database record
    # --------------------------------------------------------

    if existing_resume:
        existing_resume.file_url = file_url
        existing_resume.file_name = original_filename
        existing_resume.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(existing_resume)

        return existing_resume

    # --------------------------------------------------------
    # Create new database record
    # --------------------------------------------------------

    resume = Resume(
        file_url=file_url,
        file_name=original_filename,
        updated_at=datetime.utcnow(),
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


# ============================================================
# DELETE RESUME
# ============================================================

@router.delete("/resume")
def delete_resume(
    db: Session = Depends(get_db),
):
    """
    Delete the current resume from disk and database.
    """

    resume = (
        db.query(Resume)
        .order_by(Resume.id.desc())
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found.",
        )

    # --------------------------------------------------------
    # Delete physical PDF
    # --------------------------------------------------------

    delete_file(db, resume.file_url)

    # --------------------------------------------------------
    # Delete database record
    # --------------------------------------------------------

    db.delete(resume)
    db.commit()

    return {
        "message": "Resume deleted successfully"
    }