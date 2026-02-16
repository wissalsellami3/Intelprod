from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import auth, sensors, machines, caps_roboflow, caps_router, users_router
from app.routers.admin import users as admin_users

app = FastAPI(title="IntelProd API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # 👈 ton frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/api/v1")

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(users_router.router, prefix="/api/v1")
app.include_router(caps_roboflow.router, prefix="/api/v1")
app.include_router(caps_router.router, prefix="/api/v1")
app.include_router(sensors.router, prefix="/api/v1")
app.include_router(machines.router, prefix="/api/v1")
app.include_router(admin_users.router, prefix="/api/v1")


# app.include_router(detection.router, prefix="/api/v1")


@app.get("/")
async def health():
    return {"status": "ok"}
