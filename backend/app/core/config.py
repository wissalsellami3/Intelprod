from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "IntelProd API"
    API_V1_PREFIX: str = "/api/v1"

    MONGO_URI: str = "mongodb+srv://ala:ala123@cluster0.tojwjkt.mongodb.net/wow?retryWrites=true&w=majority&appName=Cluster0"
    MONGO_DB: str = "intelprod"
    ROBOFLOW_API_KEY: str
    ROBOFLOW_WORKSPACE: str
    ROBOFLOW_PROJECT: str
    ROBOFLOW_VERSION: str = "1"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
