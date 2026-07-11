from fastapi import APIRouter, UploadFile, File
from typing import List
import os
import uuid

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    return {"url": f"/uploads/{file_name}", "filename": file_name}

@router.post("/upload/batch")
async def upload_images(files: List[UploadFile] = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    results = []
    for file in files:
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        results.append({"url": f"/uploads/{file_name}", "filename": file_name})
    
    return {"files": results}
