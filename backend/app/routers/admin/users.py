from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from typing import List

from bson import ObjectId
from email_validator import validate_email, EmailNotValidError
from pydantic import ValidationError

from ...core.database import db
from ...core.security import decode_token, hash_password
from ...models.user import UserOut, UserUpdate

import logging

logger = logging.getLogger("users")

router = APIRouter(prefix="/admin/users", tags=["users"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ---------- Auth guard (any user) ----------
async def any_user(token: str = Depends(oauth2_scheme)):
    if not decode_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )


# ========== LIST ALL USERS ==========
@router.get("", response_model=List[UserOut], dependencies=[Depends(any_user)])
async def get_all_users():
    cursor = db["users"].find()
    users: list[UserOut] = []

    async for doc in cursor:
        try:
            validate_email(doc.get("email", ""), check_deliverability=False)
            doc["id"] = str(doc["_id"])
            users.append(UserOut(**doc))
        except (EmailNotValidError, ValidationError):
            logger.warning("Utilisateur ignoré (email invalide) : %s", doc.get("_id"))
            continue

    return users


# ========== GET ONE USER ==========
@router.get("/{user_id}", response_model=UserOut, dependencies=[Depends(any_user)])
async def get_user(user_id: str):
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = await db["users"].find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        validate_email(user["email"], check_deliverability=False)
    except EmailNotValidError:
        raise HTTPException(status_code=500, detail="Corrupted user (invalid email)")

    return UserOut(
        id=user_id,
        email=user["email"],
        full_name=user.get("full_name", ""),
        role=user["role"],
    )


# ========== UPDATE USER ==========
@router.put("/{user_id}", response_model=UserOut, dependencies=[Depends(any_user)])
async def update_user(user_id: str, data: UserUpdate):
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = await db["users"].find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data: dict = {}
    if data.full_name:
        update_data["full_name"] = data.full_name
    if data.password:
        update_data["hashed_password"] = hash_password(data.password)
    if data.role:
        update_data["role"] = data.role

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    await db["users"].update_one({"_id": obj_id}, {"$set": update_data})
    user.update(update_data)

    return UserOut(
        id=user_id,
        email=user["email"],
        full_name=user.get("full_name", ""),
        role=user.get("role", "USER"),
    )


# ========== DELETE USER ==========
@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(any_user)],
)
async def delete_user(user_id: str):
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    result = await db["users"].delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
