# app/routers/users_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from pydantic import BaseModel, Field
from typing import Optional
from pymongo import MongoClient
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
router = APIRouter()  # pas de prefix ⇒ route = /me

mongo = MongoClient(settings.MONGO_URI)
users_col = mongo[settings.MONGO_DB]["users"]


# --- Schemas -----------------------------------------------------------------
class UserProfile(BaseModel):
    id: str = Field(..., description="user identifier")
    name: str
    email: str  # <-- plus de validation EmailStr
    avatar_url: Optional[str] = None
    role: str = "USER"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None


# --- Helper: current user id (extrait du JWT) --------------------------------
def current_uid(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        uid = payload.get("sub") or payload.get("email")
        if not uid:
            raise HTTPException(401, "Invalid token payload")
        return uid
    except JWTError:
        raise HTTPException(401, "Cannot validate token")


# --- GET /me -----------------------------------------------------------------
@router.get("/me", response_model=UserProfile)
async def read_me(uid: str = Depends(current_uid)):
    doc = users_col.find_one({"id": uid}, {"_id": 0})
    if not doc:
        # ne mets NI name NI email = uid
        doc = {
            "id": uid,
            "name": "",
            "email": "",
            "avatar_url": None,
            "role": "USER",
        }
        users_col.insert_one(doc)
    return doc


# --- PUT /me -----------------------------------------------------------------
@router.put("/me", response_model=UserProfile)
async def update_me(upd: UserUpdate, uid: str = Depends(current_uid)):
    data = {k: v for k, v in upd.dict().items() if v is not None}
    if not data:
        raise HTTPException(400, "No fields provided")
    doc = users_col.find_one_and_update(
        {"id": uid},
        {"$set": data},
        projection={"_id": 0},
        return_document=True,
    )
    if not doc:
        raise HTTPException(404, "User not found")
    return doc


# --- DELETE /me (optionnel) ---------------------------------------------------
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(uid: str = Depends(current_uid)):
    res = users_col.delete_one({"id": uid})
    if res.deleted_count == 0:
        raise HTTPException(404, "User not found")
    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT)
