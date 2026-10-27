from typing import Optional

from pydantic import BaseModel


# ============================================================
# PROJECT
# ============================================================

class ProjectBase(BaseModel):
    title: str
    description: str
    category: str
    tags: str = ""
    live_url: str = ""
    github_url: str = ""
    image_url: str = ""
    featured: bool = False
    display_order: int = 0


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    live_url: Optional[str] = None
    github_url: Optional[str] = None
    image_url: Optional[str] = None
    featured: Optional[bool] = None
    display_order: Optional[int] = None


class ProjectResponse(ProjectBase):
    id: int

    class Config:
        from_attributes = True


# ============================================================
# STACK / TECH STACK
# ============================================================

class StackCreate(BaseModel):
    name: str
    display_order: int = 0


class StackResponse(StackCreate):
    id: int

    class Config:
        from_attributes = True


# ============================================================
# PROFILE
# ============================================================

class ProfileCreate(BaseModel):
    name: str = ""
    headline: str = ""
    bio: str = ""
    email: str = ""
    github: str = ""
    linkedin: str = ""
    availability: str = ""


class ProfileResponse(ProfileCreate):
    id: int

    class Config:
        from_attributes = True


# ============================================================
# RESUME
# ============================================================

class ResumeResponse(BaseModel):
    id: int
    file_url: str = ""
    file_name: str = ""

    class Config:
        from_attributes = True