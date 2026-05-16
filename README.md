# CivicTrack — Civic Issue Tracker

CivicTrack is a full-stack web application that lets citizens report civic issues (potholes, broken streetlights, garbage, water leakage, etc.) and track their resolution end-to-end. Auditors validate and coordinate; workers execute and report progress. Every action is logged in an immutable public timeline.

Built for **SIH 2025 — Government of Jharkhand (Problem Statement SIH25031)**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python), Beanie ODM, Motor async driver |
| Database | MongoDB (Atlas M0 free tier recommended) |
| Frontend | React 19, Vite, Tailwind CSS v3, React Router |
| Auth | JWT (24h expiry), bcrypt password hashing |
| Testing | Playwright E2E |

---

## Roles

There are three roles. Role is assigned at registration based on the email address used.

### Citizen (default)
Any email not in the special lists below.
Can report issues, track their own submissions, and view the public board.

### Worker
Register using one of the pre-configured worker emails:

| Email | Password (demo) |
|---|---|
| worker1@example.com | _(set when you first registered)_ |
| worker2@example.com | _(set when you first registered)_ |
| worker3@example.com | _(set when you first registered)_ |
| worker4@example.com | _(set when you first registered)_ |
| worker5@example.com | _(set when you first registered)_ |

Can submit work proposals (budget + timeline) for assigned issues and update field progress.

### Auditor
Register using one of the pre-configured auditor emails:

| Email | Password (demo) |
|---|---|
| auditor1@example.com | _(set when you first registered)_ |
| auditor2@example.com | _(set when you first registered)_ |
| auditor3@example.com | _(set when you first registered)_ |
| auditor4@example.com | _(set when you first registered)_ |
| auditor5@example.com | _(set when you first registered)_ |

Can validate/reject issues, assign workers, approve proposals, and give final sign-off.

> **Adding more privileged accounts:** Edit `AUDITOR_EMAILS` or `WORKER_EMAILS` in `backend/.env` and restart the backend. The new emails will get the corresponding role when they register.

---

## Setup

You need two terminal windows — one for the backend, one for the frontend.

### Prerequisites
- Python 3.10+
- Node.js 18+
- A MongoDB connection string (see Database section below)

### Database

**Option A — MongoDB Atlas (recommended, no install needed)**
1. Create a free account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free **M0** cluster
3. Create a database user and allow network access from `0.0.0.0/0`
4. Copy the `mongodb+srv://...` connection string

**Option B — Local MongoDB**
Install MongoDB Community Edition and ensure it is running on `localhost:27017`.

### Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate          # macOS / Linux
# .\venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env              # if it doesn't exist, create .env manually
# Edit .env and set MONGODB_URI to your connection string
```

**`backend/.env` reference:**

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<app>
DATABASE_NAME=civictrack
SECRET_KEY=replace-with-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
AUDITOR_EMAILS=["auditor1@example.com","auditor2@example.com","auditor3@example.com","auditor4@example.com","auditor5@example.com"]
WORKER_EMAILS=["worker1@example.com","worker2@example.com","worker3@example.com","worker4@example.com","worker5@example.com"]
```

Start the server:

```bash
uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**. Swagger docs at **http://localhost:8000/docs**.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**.

---

## Demo Walkthrough

Follow this order to demonstrate the full issue lifecycle:

**1. Register accounts first**

Before the demo, register all three role accounts so they exist in the database:

| Step | Email to use | Role you get |
|---|---|---|
| Register | any new email | Citizen |
| Register | auditor1@example.com | Auditor |
| Register | worker1@example.com | Worker |

**2. Citizen — report an issue**
- Sign in as the citizen
- Go to Dashboard → fill in the issue form (title, category, area, description, optional photo)
- Submit — the issue appears in "My Reported Issues" and on the Public Board

**3. Auditor — validate and assign**
- Sign in as the auditor → Dashboard shows the Issue Queue
- Click **Mark Valid** on the submitted issue, add a note
- Select a worker from the dropdown → click **Assign**

**4. Worker — submit a proposal**
- Sign in as the worker → Dashboard shows Assigned Tasks
- Click **Submit Proposal**, fill in estimated days and budget
- Submit — status moves to "Proposal Submitted"

**5. Auditor — approve proposal**
- Sign in as the auditor → click **Approve** on the proposal
- Budget is now locked and visible to the citizen on the issue detail page

**6. Worker — update field progress**
- Sign in as the worker → click **Update Status**
- Change to "In Progress", then later to "Completed"

**7. Auditor — final sign-off**
- Sign in as the auditor → click **Resolve Issue**
- Issue is now permanently marked **Resolved**

**8. Public timeline**
- Go to the Public Board (no login needed) → click the resolved issue
- The Progress Timeline shows every step with timestamps and actor names

---

## Running E2E Tests

Tests cover the full lifecycle (happy path) and 28 edge/error cases.

```bash
cd e2e-tests
npm install
npx playwright install chromium   # first time only

# Both backend and frontend must be running before this
npm test
```

**Important:** The test suite registers `auditor1@example.com` and `worker1@example.com` automatically during setup. If those accounts already exist in your database, the setup script verifies the password matches. If it fails, follow the printed instructions.

Run a specific suite:

```bash
npm run test:lifecycle   # full issue lifecycle (14 tests)
npm run test:errors      # standalone error/validation tests (15 tests)
```

View the HTML report after a run:

```bash
npm run report
```

---

## Architecture Notes

**Role assignment** happens once at registration. The backend checks the registering email against the `AUDITOR_EMAILS` / `WORKER_EMAILS` lists in `.env` and writes the role into the user document. Subsequent logins inherit the role from the DB, not from the email list.

**Immutable timeline** — every status transition appends a `TimelineEntry` document. Nothing is ever deleted or updated. This gives a permanent audit trail.

**Image storage** — photos are stored as Base64 strings inside MongoDB documents. This works for demo scale (5 MB limit per photo enforced on the frontend). For production, replace with Cloudinary or S3.

**Human-readable IDs** — issues get `INC-2026-XXXX`, workers get `WRK-001`, auditors get `AUD-001`. Generated using an atomic counter collection.

---

## Project Structure

```
civictrack/
├── backend/
│   ├── .env                  # secrets and config (not committed)
│   ├── main.py               # FastAPI app entry point
│   ├── config.py             # pydantic-settings config loader
│   ├── database.py           # MongoDB / Beanie initialisation
│   ├── models/               # User, Issue, Proposal, Timeline, Counter
│   ├── routers/              # auth, issues, auditor, worker
│   ├── middleware/           # JWT auth + role checker
│   └── services/             # password hashing, ID generation
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Modal, Toast
│   │   ├── pages/            # Login, Register, Board, Dashboard, IssueDetail
│   │   ├── context/          # AuthContext
│   │   ├── api/              # axios instance
│   │   └── utils/            # status badge helpers
│   └── tailwind.config.js
├── e2e-tests/
│   ├── playwright.config.js
│   ├── global-setup.js
│   └── tests/
│       ├── lifecycle.spec.js
│       └── errors.spec.js
└── docs/
    └── CivicTrack_BRD_v1.md
```
