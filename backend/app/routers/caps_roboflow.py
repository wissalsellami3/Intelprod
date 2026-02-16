from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import base64
from inference_sdk import InferenceHTTPClient
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

router = APIRouter(prefix="/caps", tags=["caps"])

ROBOFLOW_API_KEY = "JRYzs2zxrjPb5eow0PLQ"
ROBOFLOW_MODEL_ID = "bottle-cap-iuzcs-ejnxf/1"
ROBOFLOW_WORKSPACE = "ala-onfo5"
ROBOFLOW_WORKFLOW_ID = "custom-workflow"

mongo_client = AsyncIOMotorClient("mongodb+srv://ala:ala123@cluster0.tojwjkt.mongodb.net/?retryWrites=true&w=majority")
db = mongo_client["intelprod"]
caps_collection = db["caps_ai"]

rf_client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=ROBOFLOW_API_KEY
)

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
        "cap_id": id,
        "timestamp": datetime.utcnow(),
        "predictions": predictions,
        "raw_result": result
    }
    await caps_collection.insert_one(doc)

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
