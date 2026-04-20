from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from models.issue import Issue
from models.timeline import TimelineEntry
from models.user import User
from middleware.auth import RoleChecker, get_current_user
from services.counter_service import get_next_sequence
from beanie import PydanticObjectId
from datetime import datetime

router = APIRouter(prefix="/issues", tags=["issues"])

class IssueCreate(BaseModel):
    title: str
    description: str
    category: str
    location: dict
    photos: List[str] = []

@router.post("", response_model=dict)
async def create_issue(issue_data: IssueCreate, current_user: User = Depends(RoleChecker(["citizen", "worker", "auditor"]))):
    seq = await get_next_sequence("issue_counter")
    issue_number = f"INC-2026-{seq:04d}"
    
    issue = Issue(
        issue_number=issue_number,
        title=issue_data.title,
        description=issue_data.description,
        category=issue_data.category,
        location=issue_data.location,
        photos=issue_data.photos,
        status="Submitted",
        reported_by=current_user.id
    )
    await issue.insert()
    
    timeline = TimelineEntry(
        issue_id=issue.id,
        stage="Issue Submitted",
        status_to="Submitted",
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        note="Citizen reported the issue"
    )
    await timeline.insert()
    
    return {"message": "Issue created", "issue_id": str(issue.id), "issue_number": issue_number}

@router.get("")
async def get_issues(status: Optional[str] = Query(None), category: Optional[str] = Query(None)):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
        
    issues = await Issue.find(query).sort("-created_at").to_list()
    # Need to enrich with reporter name potentially, but let's keep it simple for listing
    return issues

@router.get("/my")
async def get_my_issues(current_user: User = Depends(get_current_user)):
    issues = await Issue.find({"reported_by": current_user.id}).sort("-created_at").to_list()
    return issues

@router.get("/{issue_id}")
async def get_issue(issue_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    issue = await Issue.get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    # Auto status update to Under Review if Auditor opens it and it's Submitted
    if current_user.role == "auditor" and issue.status == "Submitted":
        issue.status = "Under Review"
        issue.updated_at = datetime.utcnow()
        await issue.save()
        
        timeline = TimelineEntry(
            issue_id=issue.id,
            stage="Under Review",
            status_to="Under Review",
            actor_id=current_user.id,
            actor_name=current_user.name,
            actor_role=current_user.role,
            note="Auditor started review"
        )
        await timeline.insert()
        
    return issue

@router.get("/{issue_id}/timeline")
async def get_issue_timeline(issue_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    timeline = await TimelineEntry.find({"issue_id": issue_id}).sort("timestamp").to_list()
    return timeline
