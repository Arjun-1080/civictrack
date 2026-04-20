from beanie import Document
from datetime import datetime

class User(Document):
    readable_id: str
    name: str
    email: str
    password_hash: str
    role: str
    area: str | None = None
    is_active: bool = True
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"
        indexes = [
            "email",
            "readable_id"
        ]
