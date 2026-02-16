from pydantic import BaseModel
from typing import Any, List


class CapRecord(BaseModel):
    id: str
    predictions: List[Any]
