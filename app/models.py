from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from .database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    tags = Column(Text, default="")
    live_url = Column(String(500), default="")
    github_url = Column(String(500), default="")
    image_url = Column(String(500), default="")
    featured = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class Stack(Base):
    __tablename__ = "stack"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Profile(Base):
    __tablename__ = "profile"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="")
    headline = Column(String(200), default="")
    bio = Column(Text, default="")
    email = Column(String(200), default="")
    github = Column(String(500), default="")
    linkedin = Column(String(500), default="")
    availability = Column(String(200), default="")


class Resume(Base):
    __tablename__ = "resume"

    id = Column(Integer, primary_key=True, index=True)
    file_url = Column(String(500), default="")
    file_name = Column(String(200), default="")
    updated_at = Column(DateTime, default=datetime.utcnow)