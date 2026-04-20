from models.counter import Counter

async def get_next_sequence(counter_id: str) -> int:
    counter = await Counter.find_one(Counter.id == counter_id)
    if not counter:
        counter = Counter(id=counter_id, seq=1)
        await counter.insert()
        return 1
    
    counter.seq += 1
    await counter.save()
    return counter.seq

async def generate_readable_id(role: str) -> str:
    if role == "worker":
        seq = await get_next_sequence("worker_counter")
        return f"WRK-{seq:03d}"
    elif role == "auditor":
        seq = await get_next_sequence("auditor_counter")
        return f"AUD-{seq:03d}"
    else:
        # citizens don't strictly need a counter based ID in this schema, but let's give them one for consistency if needed, or use their email prefix.
        seq = await get_next_sequence("citizen_counter")
        return f"CTZ-{seq:04d}"
