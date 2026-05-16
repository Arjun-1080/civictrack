"""
CivicTrack seed script — registers all demo accounts and creates sample issues.

Usage:
    cd backend
    source venv/bin/activate
    python seed.py

Prerequisites: backend must be running on http://localhost:8000
All accounts are created with password: mallikarjun
"""

import json
import urllib.request
import urllib.error

BASE = "http://localhost:8000/api/v1"
PASSWORD = "mallikarjun"

ACCOUNTS = [
    # Citizens
    {"name": "Ananya Sharma",   "email": "citizen1@example.com"},
    {"name": "Rohit Verma",     "email": "citizen2@example.com"},
    {"name": "Priya Gupta",     "email": "citizen3@example.com"},
    # Auditors
    {"name": "Mallikarjun Rao", "email": "auditor1@example.com"},
    {"name": "Sunita Devi",     "email": "auditor2@example.com"},
    {"name": "Ramesh Prasad",   "email": "auditor3@example.com"},
    {"name": "Kavitha Nair",    "email": "auditor4@example.com"},
    {"name": "Suresh Kumar",    "email": "auditor5@example.com"},
    # Workers
    {"name": "Arjun Singh",     "email": "worker1@example.com"},
    {"name": "Deepak Yadav",    "email": "worker2@example.com"},
    {"name": "Lakshmi Patel",   "email": "worker3@example.com"},
    {"name": "Vivek Mishra",    "email": "worker4@example.com"},
    {"name": "Sanjay Tiwari",   "email": "worker5@example.com"},
]

ISSUES = [
    {
        "title": "Large pothole on Albert Ekka Chowk",
        "description": "A 40cm-deep pothole near the traffic signal is causing accidents and vehicle damage. Urgent repair needed.",
        "category": "Pothole",
        "location": {"area": "Albert Ekka Chowk, Ranchi", "landmark": "Near main traffic signal"},
    },
    {
        "title": "Street lights out for 3 weeks on Kanke Road",
        "description": "Three consecutive streetlights have been non-functional since last month, creating safety concerns at night.",
        "category": "Streetlight",
        "location": {"area": "Kanke Road, Ranchi", "landmark": "Between km 4 and km 5"},
    },
    {
        "title": "Garbage dumping on Harmu Road footpath",
        "description": "Residents are illegally dumping construction waste on the footpath. Needs clearing and awareness boards.",
        "category": "Garbage",
        "location": {"area": "Harmu Road, Ranchi", "landmark": "Opposite Harmu Colony gate"},
    },
    {
        "title": "Water pipeline leakage near Lalpur Chowk",
        "description": "A major water line has been leaking for 5 days, wasting potable water and making the road slippery.",
        "category": "Water Leakage",
        "location": {"area": "Lalpur, Ranchi", "landmark": "Near Lalpur Chowk flyover"},
    },
    {
        "title": "Overflowing drain on Doranda Main Road",
        "description": "Sewage drain overflowing after rains, causing foul smell and public health hazard in the area.",
        "category": "Sewage",
        "location": {"area": "Doranda, Ranchi", "landmark": "Near Doranda bus stand"},
    },
    {
        "title": "Fallen tree blocking Circular Road",
        "description": "A large neem tree fell during last night's storm and is partially blocking traffic. Emergency clearance needed.",
        "category": "Tree Fall",
        "location": {"area": "Circular Road, Ranchi", "landmark": "In front of Bihar Club"},
    },
    {
        "title": "Open manhole on Kokar Industrial Road",
        "description": "Manhole cover missing for over a week, posing serious accident risk for two-wheelers especially at night.",
        "category": "Sewage",
        "location": {"area": "Kokar, Ranchi", "landmark": "Near Kokar police station"},
    },
    {
        "title": "Broken footpath tiles on Main Road, Morabadi",
        "description": "Multiple tiles broken and uplifted on the pedestrian footpath, causing trip hazards for elderly and children.",
        "category": "Other",
        "location": {"area": "Morabadi, Ranchi", "landmark": "Opposite Morabadi ground"},
    },
]


def post(url, payload, token=None):
    body = json.dumps(payload).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def register_or_verify(account):
    payload = {**account, "password": PASSWORD}
    status, data = post(f"{BASE}/auth/register", payload)
    if status == 200:
        print(f"  ✓ Registered  {account['email']}")
        return data["access_token"]

    # Account exists — try login
    status, data = post(f"{BASE}/auth/login", {"email": account["email"], "password": PASSWORD})
    if status == 200:
        print(f"  ~ Already exists: {account['email']}")
        return data["access_token"]

    print(f"  ✗ FAILED {account['email']}: {data}")
    return None


def main():
    # Verify backend is reachable
    try:
        with urllib.request.urlopen("http://localhost:8000/") as r:
            r.read()
    except Exception:
        print("ERROR: Cannot reach backend at http://localhost:8000")
        print("       Start the backend first: uvicorn main:app --reload")
        return

    print("\n=== Registering accounts ===")
    tokens = {}
    for account in ACCOUNTS:
        token = register_or_verify(account)
        if token:
            tokens[account["email"]] = token

    citizen_tokens = [
        tokens.get("citizen1@example.com"),
        tokens.get("citizen2@example.com"),
        tokens.get("citizen3@example.com"),
    ]
    citizen_tokens = [t for t in citizen_tokens if t]

    if not citizen_tokens:
        print("\nNo citizen tokens — skipping issue creation.")
        return

    print("\n=== Creating sample issues ===")
    for i, issue in enumerate(ISSUES):
        token = citizen_tokens[i % len(citizen_tokens)]
        status, data = post(f"{BASE}/issues", issue, token=token)
        if status == 200:
            print(f"  ✓ Created {data.get('issue_number', '?')}: {issue['title'][:55]}")
        else:
            print(f"  ~ Skipped / error: {issue['title'][:55]} ({status})")

    print("\n=== Done ===")
    print("All accounts use password: mallikarjun")
    print("Login at http://localhost:5173/login")


if __name__ == "__main__":
    main()
