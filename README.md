# CivicTrack - End-to-End Civic Issue Tracker

CivicTrack is a fully functional web application designed to help citizens report civic issues (like potholes, broken streetlights, or garbage accumulation) and track their resolution process. It features a robust role-based access system for Citizens, Auditors, and Workers, complete with dynamic progress timelines.

This project was built for the SIH 2025 Internship Presentation and focuses on demonstrating end-to-end workflows in a local environment.

## 🚀 Tech Stack

- **Backend**: FastAPI (Python), Motor (Async MongoDB Driver), Beanie (ODM)
- **Frontend**: React (Vite), Tailwind CSS v3, React Router
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## 🧠 High-Level Architecture & Implementation Logic

The application follows a decoupled client-server architecture:

1. **Role-Based Access Control (RBAC)**
   - **Citizen**: Can report issues and view the public board. This is the default role for any new sign-ups.
   - **Auditor**: Responsible for validating reported issues, assigning them to workers, approving worker proposals, and giving the final sign-off (Resolution).
   - **Worker**: Receives assigned issues, submits budget/time proposals, and updates the status of the work (Started, In Progress, Completed).
   - *Role Assignment*: Handled securely on the backend. When a user registers, the API checks their email against the `auditor_emails` and `worker_emails` lists defined in `backend/config.py`.

2. **Immutable Progress Timeline**
   - Every time an issue changes state (e.g., from "Submitted" to "Assigned"), the backend creates a `TimelineEntry` record.
   - The frontend consumes this data to render a sequential, GitLab-style tracking timeline on the Issue Detail page, providing full transparency to the citizen.

3. **Database Schema & Image Storage**
   - We utilize MongoDB collections for `Users`, `Issues`, `Proposals`, and `ProgressTimeline`.
   - **Images**: To simplify the demo and remove cloud dependencies, images uploaded by citizens and workers are converted to **Base64 encoded strings** and saved directly within the MongoDB `Issue` and `TimelineEntry` documents.

4. **Human-Readable Identifiers**
   - The system utilizes a `Counters` collection to generate unique, sequential identifiers (e.g., `INC-2026-0001` for issues, `WRK-001` for workers) to make tracking easier.

---

## 💻 Setup and Run Instructions

To run this application on your local machine, you will need two separate terminal windows. Ensure you have **Python**, **Node.js**, and **MongoDB** installed.

### 1. Database Setup
Make sure your local MongoDB server is running on the default port `27017`. The application will automatically create the `civictrack` database upon initialization.

### 2. Backend Setup & Run

Open a terminal and navigate to the `backend` directory:

```bash
cd backend
```

Create and activate a virtual environment (Windows):
```bash
python -m venv venv
.\venv\Scripts\activate
```
*(On macOS/Linux: `source venv/bin/activate`)*

Install the required Python dependencies:
```bash
pip install -r requirements.txt
```

Start the FastAPI server:
```bash
uvicorn main:app --reload
```
The API is now running at **http://localhost:8000**.
*(You can view the auto-generated Swagger API documentation at http://localhost:8000/docs).*

### 3. Frontend Setup & Run

Open a **new** terminal window and navigate to the `frontend` directory:

```bash
cd frontend
```

Install the required Node.js dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The Frontend UI is now running at **http://localhost:5173**.

---

## 🧪 Demo Walkthrough Guide

Follow these steps to demonstrate the full lifecycle of an issue:

1. **Setup Auditor/Worker Accounts**: 
   - Before running the demo, open `backend/config.py` and ensure your desired demo emails are listed under `auditor_emails` and `worker_emails`.
   
2. **Citizen Submission**: 
   - Open `http://localhost:5173`.
   - Register a new account (use an email *not* in the config file to become a Citizen).
   - Use the Dashboard to fill out the issue form, attach an image, and submit it.

3. **Auditor Review & Assignment**:
   - Log out. Register a new account using an email from your `auditor_emails` list.
   - Go to your Dashboard, view the Auditor Queue, mark the new issue as "Valid", and assign it to a Worker ID.

4. **Worker Proposal**:
   - Log out. Register a new account using an email from your `worker_emails` list.
   - Go to your Dashboard, view your Assigned Tasks, and submit a proposal (budget and timeline) for the assigned issue.

5. **Approval & Resolution**:
   - Log back in as the Auditor to **approve** the proposal.
   - Log back in as the Worker to update the status to **Completed** (attach a resolution photo if you like).
   - Log back in as the Auditor to perform the **Final Review** and resolve the issue.
   
6. **Timeline Review**:
   - Go to the "Public Board" and click on the resolved issue to view the beautifully generated, immutable progress timeline showcasing every step of the process.
