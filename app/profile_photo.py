"""
Profile photo (admin panel se upload / badalna).

Photo database ke `stored_files` table mein save hoti hai (resume aur project images
jaise), isliye Render restart pe delete nahi hoti aur koi naya table nahi chahiye.

    GET    /api/profile-photo   public, photo dikhane ke liye (404 agar photo nahi)
    POST   /api/profile-photo   admin only (main.py ka X-Admin-Key middleware rokta hai)
    DELETE /api/profile-photo   admin only
"""

from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from .database import get_db
from .models import StoredFile

router = APIRouter(tags=["profile-photo"])

# Ek hi fixed id: hamesha sirf ek profile photo rehti hai
PHOTO_ID = "profile_photo"

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 3 * 1024 * 1024  # 3 MB


@router.get("/profile-photo")
def get_profile_photo(db: Session = Depends(get_db)):
    stored = db.query(StoredFile).filter(StoredFile.id == PHOTO_ID).first()

    if not stored:
        raise HTTPException(status_code=404, detail="No profile photo")

    return Response(
        content=stored.data,
        media_type=stored.content_type,
        # Photo badalne pe jaldi update dikhe, isliye lamba cache nahi
        headers={"Cache-Control": "public, max-age=60"},
    )


@router.post("/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Sirf JPG, PNG ya WEBP photo allowed hai.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Photo file khali hai.")

    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Photo 3 MB se chhoti honi chahiye.",
        )

    existing = db.query(StoredFile).filter(StoredFile.id == PHOTO_ID).first()

    if existing:
        existing.filename = file.filename or "profile"
        existing.content_type = file.content_type
        existing.data = content
        existing.created_at = datetime.utcnow()
    else:
        db.add(
            StoredFile(
                id=PHOTO_ID,
                filename=file.filename or "profile",
                content_type=file.content_type,
                data=content,
            )
        )

    db.commit()

    return {"message": "Profile photo updated"}


@router.delete("/profile-photo")
def delete_profile_photo(db: Session = Depends(get_db)):
    stored = db.query(StoredFile).filter(StoredFile.id == PHOTO_ID).first()

    if not stored:
        raise HTTPException(status_code=404, detail="No profile photo")

    db.delete(stored)
    db.commit()

    return {"message": "Profile photo removed"}
