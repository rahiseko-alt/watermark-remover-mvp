"""
FastAPI Server for watermarks-remover service
Provides /health, /capabilities, /inspect, /clean HTTP endpoints
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from engine import inspect_text, clean_text, clean_image_bytes

app = FastAPI(title="watermarks-remover-service", version="0.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextPayload(BaseModel):
    text: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "watermarks-remover", "version": "0.5.0"}

@app.get("/capabilities")
def capabilities():
    return {
        "version": "0.5.0",
        "mvpScope": {
            "layer1_metadata": True,
            "layer2_invisible_characters": True,
            "layer3_statistical_text": False,
            "layer4_image_pixel_synthid": False
        },
        "supportedInputs": ["text", "image/png", "image/jpeg", "image/webp", "docx", "pdf"]
    }

@app.post("/inspect")
async def inspect_endpoint(
    text_body: Optional[TextPayload] = None,
    file: Optional[UploadFile] = File(None)
):
    if text_body and text_body.text:
        res = inspect_text(text_body.text)
        return {"mode": "text", "inspection": res}
    elif file:
        content = await file.read()
        res = inspect_text(content.decode("utf-8", errors="ignore"))
        return {"mode": "file", "filename": file.filename, "inspection": res}
    else:
        raise HTTPException(status_code=400, detail="No content provided")

@app.post("/clean")
async def clean_endpoint(
    text_body: Optional[TextPayload] = None,
    file: Optional[UploadFile] = File(None)
):
    if text_body and text_body.text:
        cleaned, before, after = clean_text(text_body.text)
        return {
            "mode": "text",
            "cleanedText": cleaned,
            "inspectionBefore": before,
            "inspectionAfter": after
        }
    elif file:
        content = await file.read()
        filename = file.filename or "uploaded.png"
        cleaned_bytes, before, after = clean_image_bytes(content, filename)
        return {
            "mode": "file",
            "filename": filename,
            "outputFilename": f"cleaned_{filename}",
            "inspectionBefore": before,
            "inspectionAfter": after
        }
    else:
        raise HTTPException(status_code=400, detail="No content provided")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
