from fastapi import APIRouter, HTTPException, status, Body, UploadFile, File, Form
from datetime import datetime
from typing import List
from pymongo import MongoClient
import base64
from inference_sdk import InferenceHTTPClient
from app.core.config import settings

router = APIRouter(prefix="/caps", tags=["caps"])

# MongoDB setup
mongo_client = MongoClient(settings.MONGO_URI)
db = mongo_client[settings.MONGO_DB]
collection = db["caps"]

# Roboflow setup
ROBOFLOW_API_KEY = "JRYzs2zxrjPb5eow0PLQ"
ROBOFLOW_MODEL_ID = "bottle-cap-iuzcs-h0su8/1"
ROBOFLOW_WORKSPACE = "ala-onfo5"
ROBOFLOW_WORKFLOW_ID = "custom-workflow-2"

rf_client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=ROBOFLOW_API_KEY
)

# ROUTE: Détection avec Roboflow Workflow
@router.post("/detect-cap-workflow")
async def detect_cap_workflow(file: UploadFile = File(...), id: str = Form(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    image_bytes = await file.read()
    b64_str = base64.b64encode(image_bytes).decode("utf-8")

    try:
        result = rf_client.run_workflow(
            workspace_name=ROBOFLOW_WORKSPACE,
            workflow_id=ROBOFLOW_WORKFLOW_ID,
            images={"image": b64_str},
            use_cache=True,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Roboflow error: {e}")

    predictions = result[0]["predictions"]["predictions"] if isinstance(result, list) else []

    doc = {
        "id": id,
        "timestamp": datetime.utcnow(),
        "predictions": predictions,
        "source": "workflow"
    }
    collection.insert_one(doc)

    return {
        "version": "1.0",
        "inputs": [{"type": "InferenceImage", "name": "image"}],
        "steps": [
            {
                "type": "roboflow_core/roboflow_object_detection_model@v1",
                "name": "model",
                "images": "$inputs.image",
                "model_id": ROBOFLOW_MODEL_ID,
            }
        ],
        "outputs": [
            {
                "type": "JsonField",
                "name": "predictions",
                "coordinates_system": "own",
                "selector": "$steps.model.predictions",
            }
        ],
        "predictions": predictions,
    }

# ROUTE: Sauvegarde via client Angular
@router.post("/save-from-client", status_code=status.HTTP_201_CREATED)
async def save_from_client(data: dict = Body(...)):
    if not isinstance(data.get("cap_id"), str):
        raise HTTPException(status_code=400, detail="Missing or invalid 'cap_id'")
    if not isinstance(data.get("predictions"), list):
        raise HTTPException(status_code=400, detail="Missing or invalid 'predictions'")

    doc = {
        "id": data["cap_id"],
        "predictions": data["predictions"],
        "timestamp": datetime.utcnow(),
        "source": "client"
    }
    collection.insert_one(doc)
    return {"message": "Saved successfully"}

# ROUTES: CRUD classiques
from pydantic import BaseModel

class CapRecord(BaseModel):
    id: str
    predictions: List[dict]

class CapCreate(CapRecord):
    pass

class CapUpdate(BaseModel):
    predictions: List[dict]

class CapBulkCreate(BaseModel):
    records: List[CapCreate]

@router.post("", response_model=CapRecord, status_code=status.HTTP_201_CREATED)
async def create_cap(record: CapCreate):
    collection.insert_one(record.dict())
    return record

@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def create_caps_bulk(data: CapBulkCreate):
    cleaned = [rec.dict() for rec in data.records]
    if cleaned:
        collection.insert_many(cleaned)
    return {"inserted": len(cleaned)}

@router.get("", response_model=List[CapRecord])
async def list_caps():
    docs = collection.find({}, {"_id": 0, "id": 1, "predictions": 1})
    return list(docs)

@router.get("/{id}", response_model=CapRecord)
async def get_cap(id: str):
    doc = collection.find_one({"id": id}, {"_id": 0, "id": 1, "predictions": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Cap not found")
    return doc

@router.get("/{id}/exists")
async def cap_exists(id: str):
    exists = collection.count_documents({"id": id}) > 0
    return {"id": id, "exists": exists}

@router.get("/defected", response_model=List[CapRecord])
async def list_defected_caps():
    docs = collection.find({"predictions.defected": True}, {"_id": 0, "id": 1, "predictions": 1})
    return list(docs)

@router.get("/count")
async def count_caps():
    total = collection.count_documents({})
    return {"count": total}

@router.put("/{id}", response_model=CapRecord)
async def update_cap(id: str, upd: CapUpdate):
    updated = collection.find_one_and_update(
        {"id": id},
        {"$set": {"predictions": upd.predictions}},
        projection={"_id": 0, "id": 1, "predictions": 1},
        return_document=True,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Cap not found")
    return updated

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cap(id: str):
    result = collection.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cap not found")
