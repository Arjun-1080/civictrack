from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from models.issue import Issue
from models.timeline import TimelineEntry
from models.user import User
from models.proposal import Proposal
from middleware.auth import RoleChecker
from beanie import PydanticObjectId
from datetime import datetime

router = APIRouter(prefix="/worker", tags=["worker"])

class ProposalData(BaseModel):
    description: str
    estimated_timeline_days: int
    estimated_budget: float

class StatusUpdateData(BaseModel):
    status: str # "Started", "In Progress", "Completed"
    note: Optional[str] = None
    photos: List[str] = []

@router.get("/issues")
async def get_worker_issues(current_user: User = Depends(RoleChecker(["worker"]))):
    issues = await Issue.find({"assigned_worker": current_user.id}).sort("-updated_at").to_list()
    return issues

@router.post("/issues/{issue_id}/proposal")
async def submit_proposal(issue_id: PydanticObjectId, data: ProposalData, current_user: User = Depends(RoleChecker(["worker"]))):
    issue = await Issue.get(issue_id)
    if not issue or issue.assigned_worker != current_user.id:
        raise HTTPException(status_code=404, detail="Issue not found or not assigned to you")
        
    existing_proposal = await Proposal.find_one({"issue_id": issue_id})
    if existing_proposal:
        raise HTTPException(status_code=400, detail="Proposal already exists for this issue. Use PUT to update if rejected.")
        
    proposal = Proposal(
        issue_id=issue_id,
        submitted_by=current_user.id,
        description=data.description,
        estimated_timeline_days=data.estimated_timeline_days,
        estimated_budget=data.estimated_budget,
    )
    await proposal.insert()
    
    issue.status = "Proposal Submitted"
    issue.updated_at = datetime.utcnow()
    await issue.save()
    
    timeline = TimelineEntry(
        issue_id=issue.id,
        stage="Proposal Submitted",
        status_to="Proposal Submitted",
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        note=f"Budget: ₹{data.estimated_budget}, Time: {data.estimated_timeline_days} days. {data.description}"
    )
    await timeline.insert()
    
    return {"message": "Proposal submitted"}

@router.put("/issues/{issue_id}/proposal")
async def update_proposal(issue_id: PydanticObjectId, data: ProposalData, current_user: User = Depends(RoleChecker(["worker"]))):
    issue = await Issue.get(issue_id)
    if not issue or issue.assigned_worker != current_user.id:
        raise HTTPException(status_code=404, detail="Issue not found or not assigned to you")
        
    proposal = await Proposal.find_one({"issue_id": issue_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    if proposal.status != "Rejected":
        raise HTTPException(status_code=400, detail="Can only update rejected proposals")
        
    proposal.description = data.description
    proposal.estimated_timeline_days = data.estimated_timeline_days
    proposal.estimated_budget = data.estimated_budget
    proposal.status = "Pending"
    proposal.version += 1
    proposal.submitted_at = datetime.utcnow()
    await proposal.save()
    
    issue.status = "Proposal Submitted"
    issue.updated_at = datetime.utcnow()
    await issue.save()
    
    timeline = TimelineEntry(
        issue_id=issue.id,
        stage="Proposal Resubmitted",
        status_to="Proposal Submitted",
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        note=f"Revised Budget: ₹{data.estimated_budget}, Time: {data.estimated_timeline_days} days. {data.description}"
    )
    await timeline.insert()
    
    return {"message": "Proposal updated"}

@router.patch("/issues/{issue_id}/status")
async def update_status(issue_id: PydanticObjectId, data: StatusUpdateData, current_user: User = Depends(RoleChecker(["worker"]))):
    issue = await Issue.get(issue_id)
    if not issue or issue.assigned_worker != current_user.id:
        raise HTTPException(status_code=404, detail="Issue not found or not assigned to you")
        
    if data.status not in ["Started", "In Progress", "Completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    issue.status = data.status
    issue.updated_at = datetime.utcnow()
    await issue.save()
    
    timeline = TimelineEntry(
        issue_id=issue.id,
        stage=data.status,
        status_to=data.status,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        note=data.note,
        photos=data.photos
    )
    await timeline.insert()
    
    return {"message": "Status updated"}

@router.get("/issues/{issue_id}/proposal")
async def get_proposal(issue_id: PydanticObjectId, current_user: User = Depends(RoleChecker(["worker", "auditor"]))):
    proposal = await Proposal.find_one({"issue_id": issue_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal
