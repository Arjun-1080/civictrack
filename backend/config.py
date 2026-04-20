from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "civictrack"
    secret_key: str = "supersecretkey_for_demo_purposes_only"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440 # 24 hours

    # Hardcoded lists for role assignment
    auditor_emails: list[str] = ["auditor1@example.com", "auditor2@example.com"]
    worker_emails: list[str] = ["worker1@example.com", "worker2@example.com"]

    class Config:
        env_file = ".env"

settings = Settings()
