from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import List

from bson import ObjectId, errors as bson_errors

from ..models.sensor import SensorCreate, SensorUpdate, SensorOut
from ..core.database import db
from ..core.security import decode_token

router = APIRouter(prefix="/sensors", tags=["sensors"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def to_oid(raw: str) -> ObjectId:
    try:
        return ObjectId(raw.strip())
    except (bson_errors.InvalidId, TypeError):
        raise HTTPException(400, detail="Invalid id")


def doc_to_out(doc: dict) -> SensorOut:
    return SensorOut(
        id=str(doc["_id"]),
        name=doc["name"],
        sensor_type=doc["sensor_type"],
    )


# ─────────────────────────────────────────────
# Auth Guard
# ─────────────────────────────────────────────
async def any_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(401, detail="Authentication required")
    if not decode_token(token):
        raise HTTPException(401, detail="Invalid or expired token")


# ─────────────────────────────────────────────
# CRUD
# ─────────────────────────────────────────────
@router.post(
    "", status_code=201, response_model=SensorOut, dependencies=[Depends(any_user)]
)
async def create_sensor(payload: SensorCreate):
    result = await db["sensors"].insert_one(payload.model_dump())
    doc = await db["sensors"].find_one({"_id": result.inserted_id})
    return doc_to_out(doc)


@router.get("", response_model=List[SensorOut], dependencies=[Depends(any_user)])
async def list_sensors():
    docs = await db["sensors"].find().to_list(length=500)
    return [doc_to_out(d) for d in docs]


@router.get("/{sensor_id}", response_model=SensorOut, dependencies=[Depends(any_user)])
async def get_sensor(sensor_id: str):
    doc = await db["sensors"].find_one({"_id": to_oid(sensor_id)})
    if not doc:
        raise HTTPException(404, detail="Sensor not found")
    return doc_to_out(doc)


@router.put("/{sensor_id}", response_model=SensorOut, dependencies=[Depends(any_user)])
async def update_sensor(sensor_id: str, payload: SensorUpdate):
    changes = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not changes:
        raise HTTPException(400, detail="No update data provided")

    res = await db["sensors"].update_one({"_id": to_oid(sensor_id)}, {"$set": changes})
    if res.matched_count == 0:
        raise HTTPException(404, detail="Sensor not found")

    doc = await db["sensors"].find_one({"_id": to_oid(sensor_id)})
    return doc_to_out(doc)


@router.delete("/{sensor_id}", status_code=204, dependencies=[Depends(any_user)])
async def delete_sensor(sensor_id: str):
    res = await db["sensors"].delete_one({"_id": to_oid(sensor_id)})
    if res.deleted_count == 0:
        raise HTTPException(404, detail="Sensor not found")
