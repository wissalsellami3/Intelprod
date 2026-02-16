# scripts/fix_bad_emails.py
import asyncio, re

from email_validator import EmailNotValidError
from pydantic import validate_email
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://ala:ala123@cluster0.tojwjkt.mongodb.net/testing?retryWrites=true&w=majority&appName=Cluster0"  # adapte
DB_NAME = "intelprod"  # adapte
EMAIL_RX = re.compile(r".+@.+")


async def main():
    db = AsyncIOMotorClient(MONGO_URI)[DB_NAME]
    async for u in db["users"].find():
        email = str(u.get("email", ""))
        try:
            validate_email(email, check_deliverability=False)
        except EmailNotValidError:
            fixed = f"user_{u['_id']}@example.com"  # ✅ domaine accepté
            print("✏️  patch :", email, "→", fixed)
            await db["users"].update_one({"_id": u["_id"]}, {"$set": {"email": fixed}})


asyncio.run(main())
