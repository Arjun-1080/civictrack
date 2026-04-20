from beanie import Document, PydanticObjectId
from datetime import datetime

class Proposal(Document):
    issue_id: PydanticObjectId
    submitted_by: PydanticObjectId
    description: str
    estimated_timeline_days: int
    estimated_budget: float
    status: str = "Pending"
    auditor_note: str | None = None
    submitted_at: datetime = datetime.utcnow()
    reviewed_at: datetime | None = None
    reviewed_by: PydanticObjectId | None = None
    version: int = 1

    class Settings:
        name = "proposals"
        indexes = [
            "issue_id"
        ]
