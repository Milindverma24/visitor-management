from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File

from app.utils.aadhaar_ocr import (
    extract_aadhaar_details
)
from app.utils.photo_extractor import (
    extract_aadhaar_photo
)

import shutil
import os
from app.services import telegram_service
from app.database.session import SessionLocal

router = APIRouter(
    prefix="/api/ocr",
    tags=["OCR"]
)


@router.post("/aadhaar")
async def upload_aadhaar(
    file: UploadFile = File(...)
):



    file_path = os.path.join(
        "uploads",
        "aadhaar",
        file.filename
    )

    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    data = extract_aadhaar_details(
        file_path
    )

    photo_path = extract_aadhaar_photo(
        file_path
    )

    data["photo_path"] = photo_path
    
    # Telegram OCR Notification
    if data and data.get("name"):
        db = SessionLocal()
        ocr_msg = f"📄 <b>OCR COMPLETED</b>\n\nName: {data.get('name', 'N/A')}\nDOB: {data.get('dob', 'N/A')}\nGender: {data.get('gender', 'N/A')}\nAadhaar: XXXX XXXX 1234"
        telegram_service.send_admin_notification(db, ocr_msg)
        db.close()

    return data