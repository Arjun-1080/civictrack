from beanie import Document

class Counter(Document):
    id: str # The name of the counter (e.g. "issue_counter")
    seq: int = 0

    class Settings:
        name = "counters"
