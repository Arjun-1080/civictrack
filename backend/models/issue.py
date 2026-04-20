from beanie import Document, PydanticObjectId
from datetime import datetime

class Issue(Document):
    issue_number: str
    title: str
    description: str
    category: str
    location: dict
    photos: list[str] = [] # Base64 encoded images
    status: str
    reported_by: PydanticObjectId
    assigned_auditor: PydanticObjectId | None = None
    assigned_worker: PydanticObjectId | None = None
    rejection_reason: str | None = None
    estimated_budget: float | None = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "issues"
        indexes = [
            "status",
            "reported_by",
            "assigned_worker",
            "assigned_auditor"
        ]
