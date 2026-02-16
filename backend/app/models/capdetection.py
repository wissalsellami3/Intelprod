from pydantic import BaseModel


class CapDetection(BaseModel):
    cap_id: str
    exists: bool
    defected: bool
    image_path: str
