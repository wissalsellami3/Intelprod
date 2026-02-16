# app/models/sensor.py
from pydantic import BaseModel, Field
from typing import Optional, Literal

# ────── Enum du type de capteur ──────
SensorType = Literal["TEMPERATURE", "HUMIDITY", "VIBRATION", "LUMINOSITY"]


# ────── Modèles Pydantic ──────
class SensorBase(BaseModel):
    name: str
    sensor_type: SensorType


class SensorCreate(SensorBase):
    """Payload de création"""

    pass


class SensorUpdate(BaseModel):
    """Payload de mise à jour (tous facultatifs)"""

    name: Optional[str] = None
    sensor_type: Optional[SensorType] = None


class SensorOut(SensorBase):
    """Réponse publique (id string)"""

    id: str = Field(alias="id")  # alias pour l’export

    class Config:
        populate_by_name = True
