from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "LinJing API"
    jwt_secret: str = "linjing-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expires_seconds: int = 60 * 60 * 24
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:5666,http://127.0.0.1:5666"
    )
    db_path: str = "data/linjing.db"


settings = Settings()
