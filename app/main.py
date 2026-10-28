import hmac
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .ai import router as ai_router
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
# ADMIN AUTH
# =========================
# Public GET routes khule rahenge. /api ke under koi bhi write request
# (POST / PUT / PATCH / DELETE) tabhi chalegi jab X-Admin-Key sahi ho.
# Ye key sirf Next.js server (Vercel) ke paas hoti hai, browser ke paas nahi.
# NOTE: ye CORS se pehle add hona zaroori hai, taaki CORS iske upar rahe.

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

# Ye POST routes public hain (visitor chatbot / JD match). Inka apna rate limit hai (app/ai.py).
PUBLIC_POST_PATHS = {"/api/chat", "/api/jd-match"}


@app.middleware("http")
async def require_admin_key(request: Request, call_next):
    if (
        request.method not in SAFE_METHODS
        and request.url.path.startswith("/api")
        and request.url.path.rstrip("/") not in PUBLIC_POST_PATHS
    ):
        expected = os.getenv("ADMIN_API_KEY", "")
        provided = request.headers.get("x-admin-key", "")

        if not expected:
            return JSONResponse(
                {"detail": "Admin API key is not configured on the server."},
                status_code=503,
            )

        if not hmac.compare_digest(provided.encode(), expected.encode()):
            return JSONResponse(
                {"detail": "Unauthorized"},
                status_code=401,
            )

    return await call_next(request)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    # Is project ke saare Vercel URLs allow (production, git-branch, preview)
    allow_origin_regex=r"https://ishwar-portfolio[a-z0-9-]*\.vercel\.app",
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

app.include_router(
    ai_router,
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