import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Render pe DATABASE_URL (Neon Postgres) set hoga.
# Local pe set nahi hai toh SQLite use hoga.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./portfolio.db").strip()

# Neon "postgresql://" deta hai, SQLAlchemy ko driver ka naam chahiye
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://", "postgresql+psycopg2://", 1
    )
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg2://", 1
    )

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # pool_pre_ping: Neon idle hone pe connection band kar deta hai,
    # isse purane connection automatically reconnect ho jaate hain
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
    )

print(f"[db] using {engine.dialect.name}", flush=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()