from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from inference_sdk import InferenceHTTPClient
from pymongo import MongoClient
from PIL import Image
import numpy as np
import cv2, io

from app.core.config import settings

router = APIRouter()

# --- Roboflow singleton ---
_rf_client: InferenceHTTPClient | None = None


def get_rf_client() -> InferenceHTTPClient:
    global _rf_client
    if _rf_client is None:
        _rf_client = InferenceHTTPClient(
            api_url="https://detect.roboflow.com", api_key=settings.ROBOFLOW_API_KEY
        )
    return _rf_client


# --- MongoDB ---
mongo = MongoClient(settings.MONGO_URI)
db = mongo[settings.MONGO_DB]
caps_col = db["caps"]


# --- Isolation via HoughCircles ---
def isolate_cap(image_bytes: bytes) -> bytes:
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (9, 9), 2)

    circles = cv2.HoughCircles(
        blur,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=gray.shape[0] / 8,
        param1=100,
        param2=30,
        minRadius=20,
        maxRadius=int(gray.shape[0] / 3),
    )
    if circles is not None:
        x, y, r = np.round(circles[0][0]).astype(int)
        h, w = img.shape[:2]
        x1, y1 = max(x - r, 0), max(y - r, 0)
        x2, y2 = min(x + r, w), min(y + r, h)
        crop = img[y1:y2, x1:x2]
        _, buf = cv2.imencode(".jpg", crop)
        return buf.tobytes()
    # fallback
    return image_bytes


# --- Roboflow inference ---
def rf_infer(image_bytes: bytes):
    pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    pil.save("temp.jpg")
    try:
        res = get_rf_client().infer(
            "temp.jpg",
            model_id=f"{settings.ROBOFLOW_PROJECT}/{settings.ROBOFLOW_VERSION}",
        )
    except Exception as e:
        raise HTTPException(500, f"Inference failed: {e}")
    return res.get("predictions", [])


# --- Route unique ---
@router.post("/api/detect-cap")
async def detect_cap(cap_id: str = Form(...), file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(400, "Invalid image type")

    img_bytes = await file.read()

    # 1) isolation du bouchon
    cropped = isolate_cap(img_bytes)
    # 2) inférence
    preds = rf_infer(cropped)
    # 3) statut
    defected = any(p["class"] != "Good Cap" for p in preds)
    # 4) sauvegarde minimale
    caps_col.insert_one({"cap_id": cap_id, "defected": defected})

    # 5) réponse
    return JSONResponse({"predictions": preds})
