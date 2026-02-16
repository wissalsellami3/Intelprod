from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

MachineStatus = Literal["RUNNING", "STOPPED", "MAINTENANCE"]


class MachineBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: MachineStatus = "STOPPED"
    last_service: Optional[datetime] = None


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[MachineStatus] = None
    last_service: Optional[datetime] = None


class MachineOut(MachineBase):
    id: str = Field(alias="id")

    class Config:
        populate_by_name = True
