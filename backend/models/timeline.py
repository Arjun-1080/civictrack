from beanie import Document, PydanticObjectId
from datetime import datetime

class TimelineEntry(Document):
    issue_id: PydanticObjectId
    stage: str
    status_to: str
    actor_id: PydanticObjectId
    actor_name: str
    actor_role: str
    note: str | None = None
    photos: list[str] = [] # Base64 encoded images
    timestamp: datetime = datetime.utcnow()

    class Settings:
        name = "progress_timeline"
        indexes = [
            "issue_id"
        ]
