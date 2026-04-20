from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from config import settings
from models.user import User
from models.issue import Issue
from models.timeline import TimelineEntry
from models.proposal import Proposal
from models.counter import Counter

async def init_db():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(
        database=client[settings.database_name],
        document_models=[
            User,
            Issue,
            TimelineEntry,
            Proposal,
            Counter
        ]
    )
