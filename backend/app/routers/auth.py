from fastapi import APIRouter, HTTPException, Depends
from ..core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)
from ..core.database import db
from ..models.user import UserCreate, UserDB, UserLogin, UserUpdate, UserBase
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ---------- REGISTER ----------------------------------------
@router.post("/register", response_model=UserDB)
async def register(user_in: UserCreate):
    if await db["users"].find_one({"email": user_in.email}):
        raise HTTPException(400, "User already exists")

    if not user_in.phone:
        raise HTTPException(400, "Phone number is required")

    user_doc = {
        "email": user_in.email,
        "full_name": user_in.full_name,
        "role": user_in.role,
        "phone": user_in.phone,
        "password": user_in.password,
        "hashed_password": hash_password(user_in.password),
    }

    result = await db["users"].insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)

    return UserDB(**user_doc)


# ---------- LOGIN -------------------------------------------
@router.post("/login")
async def login(user_in: UserLogin):
    user = await db["users"].find_one({"email": user_in.email})
    if not user or not verify_password(user_in.password, user["hashed_password"]):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "phone": user.get("phone")  # ✅ ajouté ici
    }


# ---------- ME ----------------------------------------------
@router.get("/me", response_model=UserBase)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    user = await db["users"].find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")

    return {
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "phone": user.get("phone")  # ✅ ajouté ici aussi
    }


# ---------- UPDATE PROFILE ----------------------------------
@router.put("/me", response_model=UserBase)
async def update_profile(data: UserUpdate, token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    user = await db["users"].find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")

    update_data = {}
    if data.full_name:
        update_data["full_name"] = data.full_name
    if data.password:
        update_data["hashed_password"] = hash_password(data.password)
    if data.phone:
        update_data["phone"] = data.phone

    if update_data:
        await db["users"].update_one({"_id": user_id}, {"$set": update_data})

    user.update(update_data)
    return {
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "phone": user.get("phone")
    }
