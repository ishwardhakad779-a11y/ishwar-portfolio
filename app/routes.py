from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .database import get_db
from .models import Project, Profile, Resume, Stack
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

PROJECT_UPLOAD_DIR = Path("uploads/projects")
RESUME_UPLOAD_DIR = Path("uploads/resume")

PROJECT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESUME_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
):
    project = Project(
        **project_data.model_dump()
    )

    db.add(project)
    db.commit()
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

    # Delete project image from disk
    if project.image_url:
        filename = Path(project.image_url).name
        file_path = PROJECT_UPLOAD_DIR / filename

        if file_path.exists():
            file_path.unlink()

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
    if project.image_url:
        old_filename = Path(project.image_url).name
        old_file = PROJECT_UPLOAD_DIR / old_filename

        if old_file.exists():
            old_file.unlink()

    extension = allowed_types[image.content_type]
    filename = f"{uuid4().hex}{extension}"

    file_path = PROJECT_UPLOAD_DIR / filename

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    project.image_url = f"/uploads/projects/{filename}"

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

    if project.image_url:
        filename = Path(project.image_url).name
        file_path = PROJECT_UPLOAD_DIR / filename

        if file_path.exists():
            file_path.unlink()

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

    if existing_resume and existing_resume.file_url:
        old_filename = Path(
            existing_resume.file_url
        ).name

        old_file = (
            RESUME_UPLOAD_DIR / old_filename
        )

        if old_file.exists():
            old_file.unlink()

    # --------------------------------------------------------
    # Create unique filename
    # --------------------------------------------------------

    filename = f"{uuid4().hex}.pdf"

    file_path = (
        RESUME_UPLOAD_DIR / filename
    )

    # --------------------------------------------------------
    # Save PDF
    # --------------------------------------------------------

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    file_url = f"/uploads/resume/{filename}"

    original_filename = (
        file.filename
        if file.filename
        else "Resume.pdf"
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

    if resume.file_url:
        filename = Path(
            resume.file_url
        ).name

        file_path = (
            RESUME_UPLOAD_DIR / filename
        )

        if file_path.exists():
            file_path.unlink()

    # --------------------------------------------------------
    # Delete database record
    # --------------------------------------------------------

    db.delete(resume)
    db.commit()

    return {
        "message": "Resume deleted successfully"
    }