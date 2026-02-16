import cv2
import numpy as np
import uuid
import os
from ultralytics import YOLO
from typing import Tuple

MODEL_PATH = "models/cap_yolov8.pt"
ANNOT_DIR = "static/annotated"
os.makedirs(ANNOT_DIR, exist_ok=True)

_model = None


def _load_model():
    global _model
    if _model is None:
        _model = YOLO(MODEL_PATH)
    return _model


def detect_from_image(image_bytes: bytes) -> Tuple[bool, bool, str]:
    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image")

    model = _load_model()
    results = model(img, conf=0.25, verbose=False)[0]

    exists = False
    defected = False

    for box in results.boxes:
        cls = int(box.cls[0])
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
        color = (0, 255, 0)
        label = "cap"

        if cls == 0:
            exists = True
        elif cls == 1:
            exists = True
            defected = True
            color = (0, 0, 255)
            label = "cap_defect"

        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        cv2.putText(img, label, (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    filename = f"{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(ANNOT_DIR, filename)
    cv2.imwrite(filepath, img)
    return exists, defected, f"/static/annotated/{filename}"
