from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routes import router


# =========================
# DATABASE
# =========================

Base.metadata.create_all(bind=engine)


# =========================
# APP
# =========================

app = FastAPI(
    title="Ishwar Portfolio API",
    description="Backend API for Ishwar Dhakad's portfolio",
    version="1.0.0",
)


# =========================
# STATIC FILES
# =========================

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# API ROUTES
# =========================

app.include_router(
    router,
    prefix="/api",
)


# =========================
# ROOT
# =========================

@app.get("/")
def root():
    return {
        "message": "Ishwar Portfolio API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }