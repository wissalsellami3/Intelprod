from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal["ADMIN", "USER"] = "USER"
    phone: Optional[str] = None  # ✅ maintenant optionnel

class UserCreate(UserBase):
    password: str  # mot de passe clair reçu lors de l'inscription

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[Literal["ADMIN", "USER"]] = None
    phone: Optional[str] = None  # ✅ supporté dans la mise à jour

class UserOut(UserBase):
    id: str

class UserDB(UserBase):
    id: Optional[str] = Field(alias="_id")
    hashed_password: str

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
