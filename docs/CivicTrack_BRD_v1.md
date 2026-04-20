# CivicTrack — Business Requirements Document

**Version 1.0 · SIH25031 · April 2026**
**Status: Draft — For Team Review**

> **Prepared for:** Internship Final Presentation — End-to-End Software Demo
> **Problem Statement:** SIH 2025 — Government of Jharkhand
> **Tech Stack:** FastAPI (Python) · React (Vite + Tailwind) · MongoDB (Beanie ODM)
> **Spec Format:** Aligned to Kiro Spec-Driven Development

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Objectives](#2-objectives)
3. [Scope](#3-scope)
4. [Roles & Access Model](#4-roles--access-model)
5. [Functional Requirements](#5-functional-requirements)
6. [Issue Lifecycle & Status States](#6-issue-lifecycle--status-states)
7. [Data Schema — MongoDB Collections](#7-data-schema--mongodb-collections)
8. [API Specification](#8-api-specification)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [User Stories](#10-user-stories)
11. [Kiro Spec-Driven Development Alignment](#11-kiro-spec-driven-development-alignment)
12. [Open Items & Decisions](#12-open-items--decisions)
13. [Glossary](#13-glossary)

---

## 1. Problem Statement

**SIH25031 — Crowdsourced Civic Issue Reporting and Resolution System (Government of Jharkhand)**

Citizens in urban and semi-urban areas face recurring civic problems such as potholes, broken streetlights, garbage accumulation, water leakage, and sewage overflow. Currently, there is no structured, transparent mechanism for citizens to report these issues, track their resolution, and hold responsible authorities accountable.

This system addresses that gap by providing a three-role platform where citizens report issues, auditors validate and coordinate resolution, and workers execute and update field progress — with full transparency of each stage visible to the reporter through a real-time progress tracker.

---

## 2. Objectives

- Enable citizens to report civic issues with photo evidence, location, and category.
- Provide auditors with tools to validate, reject, assign, and close issues.
- Allow workers to submit resolution proposals and update real-time field progress.
- Give every reporter full visibility of their issue's lifecycle via a per-issue progress timeline.
- Maintain a permanent, immutable audit log of every action taken on every issue.
- Present a public board of all issues — searchable and filterable — similar to GitLab's issue tracker.

---

## 3. Scope

### 3.1 In Scope — V1

- User registration (default Citizen role) and pre-seeded Auditor / Worker accounts
- Full issue lifecycle: Submit → Review → Assign → Propose → Approve → Work → Resolve
- Role-based unified dashboard with component-level visibility control
- Per-issue progress timeline (GitLab-style) visible to all roles
- Public issue board — all issues visible to all authenticated users
- Proposal submission and single-proposal-per-issue model
- Human-readable IDs for issues (`INC-2026-XXXX`) and users (`WRK-001`, `AUD-001`)
- Photo upload on issue submission and worker field updates (Cloudinary)
- Estimated budget field visible to citizens on approved proposals
- Immutable issue log — no deletions allowed

### 3.2 Out of Scope — V1

- Map / GPS integration
- Email or push notifications
- Department / team management module
- Region-based issue filtering
- Super admin panel for user management
- SLA tracking or escalation workflows
- Mobile application

---

## 4. Roles & Access Model

### 4.1 Role Hierarchy

The system uses an **additive role hierarchy**. Higher roles inherit all capabilities of lower roles.

| Role | Inherits From | Account Creation | Human-readable ID |
|---|---|---|---|
| **Citizen** (Reporter) | — | Self-registration (default) | Auto (email-based) |
| **Worker** | Citizen | Pre-seeded by system (hard-coded email) | `WRK-001`, `WRK-002` … |
| **Auditor** | Citizen + Worker | Pre-seeded by system (hard-coded email) | `AUD-001`, `AUD-002` … |

> **Registration rule:** Any new self-registration is assigned the Citizen role automatically. Worker and Auditor accounts are pre-seeded in the database with known emails. On login, the system detects the role from the user record and renders the appropriate dashboard view.

### 4.2 Unified Dashboard — Component Visibility

All roles share a **single dashboard layout**. Components are shown or hidden based on the authenticated user's role. The Auditor view is the reference (most access); Worker and Citizen views are the same layout with restricted components.

| Dashboard Component | Citizen | Worker | Auditor |
|---|---|---|---|
| Public issue board (read) | ✅ Visible | ✅ Visible | ✅ Visible |
| My Issues list | ✅ Visible | ✅ Visible | ✅ Visible |
| Submit new issue button | ✅ Visible | ✅ Visible | ✅ Visible |
| Per-issue progress timeline | ✅ Visible | ✅ Visible | ✅ Visible |
| Assigned issues queue | ❌ Hidden | ✅ Visible | ✅ Visible |
| Submit / update proposal | ❌ Hidden | ✅ Visible | ✅ Visible |
| Update work status + field notes | ❌ Hidden | ✅ Visible | ✅ Visible |
| All issues admin queue | ❌ Hidden | ❌ Hidden | ✅ Visible |
| Validate / reject issue | ❌ Hidden | ❌ Hidden | ✅ Visible |
| Assign worker to issue | ❌ Hidden | ❌ Hidden | ✅ Visible |
| Approve / reject proposal | ❌ Hidden | ❌ Hidden | ✅ Visible |
| Final issue closure | ❌ Hidden | ❌ Hidden | ✅ Visible |
| Analytics panel | ❌ Hidden | ❌ Hidden | ✅ Visible |

---

## 5. Functional Requirements

### 5.1 Authentication & User Management

| ID | Requirement | Role | Priority |
|---|---|---|---|
| FR-AU-01 | Any visitor can self-register with name, email, and password. Role defaults to Citizen. | All | Must |
| FR-AU-02 | Pre-seeded Worker and Auditor accounts exist in DB with designated emails and human-readable IDs. | System | Must |
| FR-AU-03 | Login returns a JWT token containing `user_id`, `role`, and `readable_id`. | All | Must |
| FR-AU-04 | All protected routes validate JWT and enforce role-based access. | All | Must |
| FR-AU-05 | A user's role is not editable via the UI in V1. | System | Must |

### 5.2 Issue Submission

| ID | Requirement | Role | Priority |
|---|---|---|---|
| FR-IS-01 | Citizen can submit an issue with: title, description, category, area/landmark, and up to 3 photos. | Citizen+ | Must |
| FR-IS-02 | On submission, system assigns a human-readable ID (`INC-2026-XXXX`) and sets status to `Submitted`. | System | Must |
| FR-IS-03 | Issue is immediately visible on the public board after submission. | System | Must |
| FR-IS-04 | Issues can never be deleted by any role. Only status changes are permitted. | System | Must |
| FR-IS-05 | Category options: Pothole, Garbage, Streetlight, Water Leakage, Sewage, Tree Fall, Other. | Citizen+ | Must |

### 5.3 Public Issue Board

| ID | Requirement | Role | Priority |
|---|---|---|---|
| FR-PB-01 | All authenticated users can view a paginated board of all public issues. | All | Must |
| FR-PB-02 | Board shows: INC ID, title, category, area, status badge, date submitted. | All | Must |
| FR-PB-03 | Board is filterable by status and category. | All | Should |
| FR-PB-04 | Clicking an issue opens the full detail page with the progress timeline. | All | Must |
| FR-PB-05 | User can filter to view only their own submitted issues. | All | Must |

### 5.4 Progress Timeline (Per Issue)

| ID | Requirement | Role | Priority |
|---|---|---|---|
| FR-PT-01 | Every issue detail page shows a chronological, vertical progress timeline. | All | Must |
| FR-PT-02 | Each timeline entry shows: stage name, actor name, actor role, timestamp, optional note, optional photo. | All | Must |
| FR-PT-03 | Timeline is append-only — no entry can be edited or deleted. | System | Must |
| FR-PT-04 | If issue is rejected, timeline shows the rejection stage with the auditor's reason note. | All | Must |
| FR-PT-05 | Estimated budget appears in the timeline at the `Proposal Approved` stage. | All | Must |
| FR-PT-06 | Assigned auditor name and assigned worker name are visible on the issue detail. | All | Must |

### 5.5 Auditor Functions

| ID | Requirement | Role | Priority |
|---|---|---|---|
| FR-AD-01 | Auditor sees a queue of all issues, sortable by date and filterable by status. | Auditor | Must |
| FR-AD-02 | Auditor can open any issue and mark it as Valid or Invalid. | Auditor | Must |
| FR-AD-03 | If Invalid: auditor must provide a rejection reason. Status → `Invalid/Closed`. Timeline updated. | Auditor | Must |
| FR-AD-04 | If Valid: auditor can assign the issue to a registered worker (selected from a dropdown of WRK-IDs). | Auditor | Must |
| FR-AD-05 | After assignment, status → `Assigned`. Timeline entry created. | System | Must |
| FR-AD-06 | Auditor receives the worker's proposal and can Approve or Reject it with a note. | Auditor | Must |
| FR-AD-07 | On proposal rejection: worker can update the single existing proposal and resubmit. | Auditor + Worker | Must |
| FR-AD-08 | On proposal approval: status → `Proposal Approved`. Estimated budget written to issue record. | System | Must |
| FR-AD-09 | Auditor performs final review when worker marks work as `Completed`. | Auditor | Must |
| FR-AD-10 | On final approval: status → `Resolved`. Timeline closed. Issue remains readable forever. | Auditor | Must |
| FR-AD-11 | Auditor can view analytics: issue count by status, by category, average resolution time. | Auditor | Should |

### 5.6 Worker Functions

| ID | Requirement | Role | Priority |
|---|---|---|---|
| FR-WK-01 | Worker sees a queue of issues assigned to them. | Worker+ | Must |
| FR-WK-02 | Worker submits one proposal per issue: description, estimated timeline (days), estimated budget (₹). | Worker+ | Must |
| FR-WK-03 | If auditor rejects the proposal, the same worker can edit and resubmit it (single proposal model). | Worker+ | Must |
| FR-WK-04 | Once proposal is approved, worker can update work status: Started → In Progress → Completed. | Worker+ | Must |
| FR-WK-05 | Each status update can include a field note and optional photo upload. | Worker+ | Must |
| FR-WK-06 | Marking status as `Completed` triggers the auditor's final review step. | System | Must |

---

## 6. Issue Lifecycle & Status States

### 6.1 Complete Status Flow

```
Submitted
  └─► Under Review
        ├─► Invalid / Closed         (Auditor rejects — reason note required)
        └─► Assigned
              └─► Proposal Submitted
                    ├─► Proposal Rejected  (Worker revises same proposal and resubmits)
                    └─► Proposal Approved
                          └─► Started
                                └─► In Progress
                                      └─► Completed
                                            ├─► Needs Rework  (back to In Progress)
                                            └─► Resolved / Closed
```

> **Immutability rule:** Issues can never be deleted. Every status change writes an append-only entry to `progress_timeline`.

### 6.2 Status Reference Table

| Status | Set By | Trigger | Visible To |
|---|---|---|---|
| `Submitted` | System (on creation) | Citizen submits issue form | All |
| `Under Review` | System (auto on Auditor open) | Auditor opens the issue | All |
| `Invalid / Closed` | Auditor | Auditor rejects issue with reason | All |
| `Assigned` | Auditor | Auditor selects and assigns worker | All |
| `Proposal Submitted` | Worker | Worker submits proposal | All |
| `Proposal Rejected` | Auditor | Auditor rejects proposal with note | All |
| `Proposal Approved` | Auditor | Auditor approves proposal | All |
| `Started` | Worker | Worker begins ground work | All |
| `In Progress` | Worker | Worker posts a field update | All |
| `Completed` | Worker | Worker marks work as done | All |
| `Needs Rework` | Auditor | Auditor not satisfied with completion | All |
| `Resolved` | Auditor | Auditor gives final sign-off | All |

---

## 7. Data Schema — MongoDB Collections

> **ODM:** Beanie (async Pydantic-based MongoDB ODM, built for FastAPI)

### 7.1 `users`

```python
class User(Document):
    readable_id:    str           # WRK-001 / AUD-001 / email prefix for citizens
    name:           str
    email:          str           # unique index
    password_hash:  str           # bcrypt
    role:           str           # "citizen" | "worker" | "auditor"
    area:           str | None    # optional, for future region filtering
    is_active:      bool          # default True
    created_at:     datetime
```

### 7.2 `issues`

```python
class Issue(Document):
    issue_number:       str           # INC-2026-0001, auto-incremented via counters
    title:              str
    description:        str
    category:           str           # Pothole | Garbage | Streetlight | Water Leakage
                                      # | Sewage | Tree Fall | Other
    location:           dict          # { area: str, landmark: str }
    photos:             list[str]     # Cloudinary URLs, max 3
    status:             str           # full set from Section 6.2
    reported_by:        PydanticObjectId   # → users
    assigned_auditor:   PydanticObjectId | None
    assigned_worker:    PydanticObjectId | None
    rejection_reason:   str | None    # set on Invalid/Closed or Needs Rework
    estimated_budget:   float | None  # populated from approved proposal
    created_at:         datetime
    updated_at:         datetime
```

### 7.3 `progress_timeline`

> Append-only. One document per event. Powers the per-issue tracker UI.

```python
class TimelineEntry(Document):
    issue_id:       PydanticObjectId   # → issues
    stage:          str           # human label e.g. "Issue Validated", "Proposal Approved"
    status_to:      str           # the status the issue moved to after this event
    actor_id:       PydanticObjectId   # who performed the action
    actor_name:     str           # denormalized for fast display
    actor_role:     str           # "citizen" | "worker" | "auditor"
    note:           str | None    # rejection reason, proposal note, field note
    photos:         list[str]     # optional field update photos
    timestamp:      datetime      # auto
```

### 7.4 `proposals`

> One proposal per issue (unique index on `issue_id`). Worker edits the same document on resubmission.

```python
class Proposal(Document):
    issue_id:                PydanticObjectId   # unique — one proposal per issue
    submitted_by:            PydanticObjectId   # → users (worker)
    description:             str
    estimated_timeline_days: int
    estimated_budget:        float              # ₹ — copied to issue on approval
    status:                  str               # "Pending" | "Approved" | "Rejected"
    auditor_note:            str | None        # reason if rejected
    submitted_at:            datetime          # updated on each resubmission
    reviewed_at:             datetime | None
    reviewed_by:             PydanticObjectId | None   # auditor who reviewed
    version:                 int               # increments on each resubmission, starts at 1
```

### 7.5 `counters`

> Single-document collection for auto-incrementing human-readable IDs. Updated atomically via `findOneAndUpdate` with `$inc`.

```python
# Documents in this collection:
{ "_id": "issue_counter",   "seq": 0 }
{ "_id": "worker_counter",  "seq": 0 }
{ "_id": "auditor_counter", "seq": 0 }
```

### Indexes

```
issues:             status, reported_by, assigned_worker, assigned_auditor
progress_timeline:  issue_id
proposals:          issue_id (unique)
users:              email (unique), readable_id (unique)
```

---

## 8. API Specification

> **Base URL:** `/api/v1`
> **Auth:** `Bearer <JWT>` on all routes except `/auth`
> **Docs:** Auto-generated OpenAPI (Swagger) at `/docs`

### 8.1 Auth Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Self-register. Role = `citizen` always. |
| `POST` | `/auth/login` | Public | Returns JWT + user info + role. |
| `GET` | `/auth/me` | All | Returns current user profile. |

### 8.2 Issue Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/issues` | Citizen+ | Submit new issue. Returns INC ID. |
| `GET` | `/issues` | All | Public board. Query params: `status`, `category`, `page`, `limit`. |
| `GET` | `/issues/my` | All | Issues submitted by the authenticated user. |
| `GET` | `/issues/{issue_id}` | All | Full issue detail including assigned names and estimated budget. |
| `GET` | `/issues/{issue_id}/timeline` | All | Full append-only progress timeline for the issue. |

### 8.3 Auditor Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/auditor/issues` | Auditor | All issues queue with filters. |
| `PATCH` | `/auditor/issues/{id}/review` | Auditor | Body: `{ valid: bool, reason?: str }`. Sets status. |
| `PATCH` | `/auditor/issues/{id}/assign` | Auditor | Body: `{ worker_id }`. Status → `Assigned`. |
| `GET` | `/auditor/workers` | Auditor | List all registered workers with WRK-IDs for assignment dropdown. |
| `PATCH` | `/auditor/issues/{id}/proposal/review` | Auditor | Body: `{ approved: bool, note?: str }`. |
| `PATCH` | `/auditor/issues/{id}/final-review` | Auditor | Body: `{ resolved: bool, note?: str }`. Closes or sends back for rework. |
| `GET` | `/auditor/analytics` | Auditor | Returns counts by status, category, avg resolution time. |

### 8.4 Worker Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/worker/issues` | Worker+ | Issues assigned to the authenticated worker. |
| `POST` | `/worker/issues/{id}/proposal` | Worker+ | Submit proposal. Errors if one already exists. |
| `PUT` | `/worker/issues/{id}/proposal` | Worker+ | Update (resubmit) existing proposal after rejection. Increments `version`. |
| `PATCH` | `/worker/issues/{id}/status` | Worker+ | Body: `{ status, note?, photos? }`. Updates work status + appends timeline entry. |

---

## 9. Non-Functional Requirements

### 9.1 Security

- All passwords hashed with **bcrypt** (min 12 rounds).
- JWT expiry: **24 hours**. No refresh token in V1.
- Role enforcement on every API route via FastAPI **dependency injection**.
- Cloudinary upload uses signed URLs — direct client upload not permitted.
- No issue can be deleted via any API endpoint. `DELETE` method not implemented on issues.

### 9.2 Performance (Demo targets)

- API response time < 500ms for all list endpoints (paginated, max 20 per page).
- Photo upload max size: 5MB per image.
- MongoDB indexes on: `issues.status`, `issues.reported_by`, `issues.assigned_worker`, `progress_timeline.issue_id`.

### 9.3 Reliability

- Timeline entries written atomically with status updates using MongoDB sessions where possible.
- Counter increments use `findOneAndUpdate` with `$inc` for race-condition-safe IDs.

### 9.4 Developer Experience

- FastAPI auto-generates OpenAPI (Swagger) docs at `/docs` — used for demo API walkthrough.
- Beanie ODM provides Pydantic model validation on all DB writes.
- CORS configured for local dev (`localhost:5173`) and Vercel production URL.

---

## 10. User Stories

> Format: *As a [role], I want to [action], so that [outcome].*

### Citizen

- As a citizen, I want to register and log in, so that I can report civic issues under my name.
- As a citizen, I want to submit an issue with photos and location, so that the problem is clearly documented.
- As a citizen, I want to see all reported issues in my city, so that I know what problems others have flagged.
- As a citizen, I want to track my issue's progress stage by stage, so that I am never left wondering what happened.
- As a citizen, I want to see why my issue was rejected (if it was), so that I understand the outcome.
- As a citizen, I want to see the estimated budget and assigned team on my issue, so that I know it is being taken seriously.

### Worker

- As a worker, I want to see only issues assigned to me, so that my queue is focused and uncluttered.
- As a worker, I want to submit a proposal with timeline and budget, so that the auditor can approve my plan before I start.
- As a worker, I want to update work status and post field notes with photos, so that progress is transparently logged.
- As a worker, I want to resubmit a revised proposal if rejected, so that I can address the auditor's concerns and proceed.

### Auditor

- As an auditor, I want to see all submitted issues in a queue, so that I can review them promptly.
- As an auditor, I want to validate or reject issues with a reason, so that only genuine issues enter the resolution pipeline.
- As an auditor, I want to assign issues to specific workers by their WRK-ID, so that accountability is clear.
- As an auditor, I want to approve or reject worker proposals, so that I control the budget and approach before work begins.
- As an auditor, I want to do a final review before closing an issue, so that I verify the work is actually done.
- As an auditor, I want to view analytics on issue volumes and resolution times, so that I can assess system performance.

---

## 11. Kiro Spec-Driven Development Alignment

### Recommended Spec Files

| Spec File | Covers | Dependencies |
|---|---|---|
| `auth.md` | FR-AU-01 to FR-AU-05, User schema, JWT middleware | None — implement first |
| `issues.md` | FR-IS-01 to FR-IS-05, Issue schema, counter logic, Cloudinary upload | `auth.md` |
| `public-board.md` | FR-PB-01 to FR-PB-05, public listing, filter, pagination | `issues.md` |
| `progress-timeline.md` | FR-PT-01 to FR-PT-06, timeline schema, append logic, UI component | `issues.md` |
| `auditor.md` | FR-AD-01 to FR-AD-11, all auditor API routes and review flows | `issues.md`, `progress-timeline.md` |
| `worker.md` | FR-WK-01 to FR-WK-06, proposal schema, status update routes | `auditor.md` |
| `dashboard.md` | Unified dashboard, role-based component visibility, analytics panel | All above |

### Requirements Traceability Matrix

| BRD Section | Kiro Spec | FastAPI Router | React Component |
|---|---|---|---|
| 5.1 Auth | `auth.md` | `/routers/auth.py` | `LoginPage`, `RegisterPage` |
| 5.2 Issue Submit | `issues.md` | `/routers/issues.py` | `IssueForm`, `PhotoUpload` |
| 5.3 Public Board | `public-board.md` | `/routers/issues.py` | `IssueBoard`, `IssueCard`, `FilterBar` |
| 5.4 Progress Timeline | `progress-timeline.md` | `/routers/issues.py` | `TimelinePanel`, `TimelineEntry` |
| 5.5 Auditor | `auditor.md` | `/routers/auditor.py` | `AuditorQueue`, `ReviewPanel`, `AssignModal` |
| 5.6 Worker | `worker.md` | `/routers/worker.py` | `WorkerQueue`, `ProposalForm`, `StatusUpdate` |
| 6. Lifecycle | `issues.md` + `auditor.md` | Shared status service | `StatusBadge` |
| 7. Schema | All specs | `/models/*.py` (Beanie) | — |
| 8. API | All specs | `/routers/*.py` | `api/` (Axios services) |

### Suggested Project Structure

```
civictrack/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── user.py
│   │   ├── issue.py
│   │   ├── proposal.py
│   │   └── timeline.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── issues.py
│   │   ├── auditor.py
│   │   └── worker.py
│   ├── services/
│   │   ├── status_service.py    # all status transitions + timeline writes
│   │   ├── counter_service.py   # INC / WRK / AUD ID generation
│   │   └── cloudinary_service.py
│   └── middleware/
│       └── auth.py              # JWT decode + role dependency
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── IssueBoard.jsx
    │   │   ├── IssueDetail.jsx
    │   │   └── Dashboard.jsx
    │   ├── components/
    │   │   ├── IssueCard.jsx
    │   │   ├── TimelinePanel.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── auditor/
    │   │   │   ├── AuditorQueue.jsx
    │   │   │   ├── ReviewPanel.jsx
    │   │   │   └── AssignModal.jsx
    │   │   └── worker/
    │   │       ├── WorkerQueue.jsx
    │   │       ├── ProposalForm.jsx
    │   │       └── StatusUpdate.jsx
    │   ├── api/
    │   │   └── axios.js         # base Axios instance + interceptors
    │   └── context/
    │       └── AuthContext.jsx  # JWT storage + role context
    └── vite.config.js
```

---

## 12. Open Items & Decisions

| # | Item | Decision Needed From | Priority |
|---|---|---|---|
| OI-01 | Final list of pre-seeded worker and auditor emails for DB seed script | Team | 🔴 High — needed before dev starts |
| OI-02 | Cloudinary account credentials (free tier sufficient for demo) | Team | 🔴 High — needed for photo upload |
| OI-03 | Confirm INC ID format: `INC-2026-0001` or simpler `INC-0001` | Team | 🟡 Low |
| OI-04 | Confirm which 3–4 charts to show on auditor analytics dashboard for demo | Team | 🟠 Medium |
| OI-05 | Deployment: confirm Render (backend) + Vercel (frontend) or alternate | Team | 🟠 Medium |

---

## 13. Glossary

| Term | Definition |
|---|---|
| **INC ID** | Human-readable issue identifier, e.g. `INC-2026-0001` |
| **WRK-ID** | Human-readable worker identifier, e.g. `WRK-001` |
| **AUD-ID** | Human-readable auditor identifier, e.g. `AUD-001` |
| **Progress Timeline** | Append-only, per-issue chronological log of all actions — visible to all roles |
| **Proposal** | Single document per issue where worker declares approach, timeline, and budget estimate |
| **Auditor Queue** | Auditor's view of all issues pending review or action |
| **Beanie** | Async MongoDB ODM for Python, built on Pydantic — used with FastAPI |
| **Kiro** | Spec-driven development tool — specs in this BRD map 1:1 to Kiro spec files |
| **Role Hierarchy** | Additive access model: Auditor ⊃ Worker ⊃ Citizen |
| **Immutable Log** | No issue or timeline entry can ever be deleted — enforced at API layer |
| **Single Proposal Model** | One proposal document per issue — edited and resubmitted in place, with version tracking |

---

*CivicTrack v1.0 BRD · SIH25031 · April 2026 · For Kiro Spec-Driven Development*
