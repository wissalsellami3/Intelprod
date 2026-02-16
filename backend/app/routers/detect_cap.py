from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
import base64
from inference_sdk import InferenceHTTPClient
import httpx

router = APIRouter()

# Roboflow config
ROBOFLOW_API_KEY = "JRYzs2zxrjPb5eow0PLQ"
ROBOFLOW_MODEL_ID = "bottle-cap-iuzcs-h0su8/1"
ROBOFLOW_WORKSPACE = "ala-onfo5"
ROBOFLOW_WORKFLOW_ID = "custom-workflow-2"

# Roboflow client
rf_client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=ROBOFLOW_API_KEY
)

# Internal FastAPI route for saving to DB
INTERNAL_SAVE_URL = "http://localhost:8000/caps"  # change port if needed

@router.post("/detect-cap-workflow")
async def detect_cap_workflow(id: str = Form(...), file: UploadFile = File(...)):
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

    # Envoie des résultats vers /caps pour enregistrement
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(INTERNAL_SAVE_URL, json={
                "id": id,
                "predictions": predictions
            })
            if response.status_code != 201:
                raise HTTPException(status_code=500, detail=f"DB error: {response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB insert error: {e}")

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
