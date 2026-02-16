from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
from bson import ObjectId, errors as bson_errors
from pymongo import ASCENDING, DESCENDING

from ..core.database import db
from ..core.security import decode_token
from ..models.machine import MachineCreate, MachineUpdate, MachineOut

router = APIRouter(prefix="/machines", tags=["machines"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


# ───────── helpers ─────────
def to_oid(value: str) -> ObjectId:
    try:
        return ObjectId(value.strip())
    except (bson_errors.InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid id")


def doc_to_out(doc: dict) -> MachineOut:
    return MachineOut(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description"),
        status=doc["status"],
        model=doc.get("model"),
        serialNumber=doc.get("serialNumber"),
        installationDate=doc.get("installationDate"),
        temperature=doc.get("temperature"),
        lastMaintenance=doc.get("lastMaintenance"),
    )


# ───────── C R U D ─────────


# CREATE
@router.post(
    "",
    response_model=MachineOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_machine(machine_in: MachineCreate):
    res = await db["machines"].insert_one(machine_in.model_dump())
    doc = await db["machines"].find_one({"_id": res.inserted_id})
    return doc_to_out(doc)


# LIST (pagination optionnelle)
@router.get("", response_model=List[MachineOut])
async def list_machines(
    page: int = Query(0, ge=0),
    size: int = Query(10, ge=1, le=100),
    sort: str = Query("id,asc"),
):
    field, order = sort.split(",") if "," in sort else (sort, "asc")
    if field == "id":
        field = "_id"
    direction = DESCENDING if order.lower() == "desc" else ASCENDING

    cursor = db["machines"].find().sort(field, direction).skip(page * size).limit(size)
    docs = await cursor.to_list(length=size)
    return [doc_to_out(d) for d in docs]


# READ ONE
@router.get("/{machine_id}", response_model=MachineOut)
async def get_machine(machine_id: str):
    doc = await db["machines"].find_one({"_id": to_oid(machine_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Machine not found")
    return doc_to_out(doc)


# UPDATE
@router.put("/{machine_id}", response_model=MachineOut)
async def update_machine(machine_id: str, machine_upd: MachineUpdate):
    upd = {k: v for k, v in machine_upd.model_dump().items() if v is not None}
    if not upd:
        raise HTTPException(status_code=400, detail="No update data provided")

    res = await db["machines"].update_one({"_id": to_oid(machine_id)}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Machine not found")

    doc = await db["machines"].find_one({"_id": to_oid(machine_id)})
    return doc_to_out(doc)


# DELETE
@router.delete("/{machine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_machine(machine_id: str):
    res = await db["machines"].delete_one({"_id": to_oid(machine_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Machine not found")
