from typing import Any, Dict
from inference_sdk import InferenceHTTPClient
from PIL import Image
import io

# --- Clés Roboflow ---
API_KEY = "JRYzs2zxrjPb5eow0PLQ"
MODEL_ID = "bottle-cap-iuzcs/2"

_client: InferenceHTTPClient | None = None


def _get_client() -> InferenceHTTPClient:
    global _client
    if _client is None:
        _client = InferenceHTTPClient(
            api_url="https://detect.roboflow.com",
            api_key=API_KEY,
        )
    return _client


def detect_cap_cloud(image_bytes: bytes) -> Dict[str, Any]:
    """
    Exécute l’inférence Roboflow et renvoie le JSON brut :
    {
        "predictions": [...],
        "image": "https://..."
    }
    """
    # conversion et compression en JPEG
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    buf.seek(0)

    # appel Roboflow
    client = _get_client()
    result = client.infer(buf, model_id=MODEL_ID)  # type: ignore[arg-type]

    return result
