from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from models.issue import Issue
from models.timeline import TimelineEntry
from models.user import User
from models.proposal import Proposal
from middleware.auth import RoleChecker
from beanie import PydanticObjectId
from datetime import datetime

router = APIRouter(prefix="/auditor", tags=["auditor"])

class ReviewData(BaseModel):
    valid: bool
    reason: Optional[str] = None

class AssignData(BaseModel):
    worker_id: PydanticObjectId

class ProposalReviewData(BaseModel):
    approved: bool
    note: Optional[str] = None

class FinalReviewData(BaseModel):
    resolved: bool
    note: Optional[str] = None

@router.get("/issues")
async def get_auditor_issues(current_user: User = Depends(RoleChecker(["auditor"]))):
    # Returns all issues. Filtering can be done on the frontend for demo purposes.
    issues = await Issue.find_all().sort("-created_at").to_list()
    return issues

@router.patch("/issues/{issue_id}/review")
async def review_issue(issue_id: PydanticObjectId, review: ReviewData, current_user: User = Depends(RoleChecker(["auditor"]))):
    issue = await Issue.get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    if review.valid:
        issue.status = "Under Review" # Keeping it here until assigned
        note = review.reason if review.reason else "Issue validated by Auditor"
    else:
        if not review.reason:
            raise HTTPException(status_code=400, detail="Reason is required for invalid issues")
        issue.status = "Invalid / Closed"
        issue.rejection_reason = review.reason
        note = review.reason
        
    issue.updated_at = datetime.utcnow()
    await issue.save()
    
    timeline = TimelineEntry(
        issue_id=issue.id,
        stage="Issue Validated" if review.valid else "Issue Rejected",
        status_to=issue.status,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        note=note
    )
    await timeline.insert()
    return {"message": "Issue reviewed"}

@router.get("/workers")
async def list_workers(current_user: User = Depends(RoleChecker(["auditor"]))):
    workers = await User.find(User.role == "worker").to_list()
    return [{"id": str(w.id), "name": w.name, "readable_id": w.readable_id} for w in workers]

@router.patch("/issues/{issue_id}/assign")
async def assign_worker(issue_id: PydanticObjectId, assign_data: AssignData, current_user: User = Depends(RoleChecker(["auditor"]))):
    issue = await Issue.get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    worker = await User.get(assign_data.worker_id)
    if not worker or worker.role != "worker":
        raise HTTPException(status_code=400, detail="Invalid worker ID")
        
    issue.assigned_worker = worker.id
    issue.assigned_auditor = current_user.id
    issue.status = "Assigned"
    issue.updated_at = datetime.utcnow()
    await issue.save()
    
    timeline = TimelineEntry(
        issue_id=issue.id,
        stage="Assigned to Worker",
        status_to="Assigned",
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        note=f"Assigned to {worker.name} ({worker.readable_id})"
    )
    await timeline.insert()
    return {"message": "Worker assigned"}

@router.patch("/issues/{issue_id}/proposal/review")
async def review_proposal(issue_id: PydanticObjectId, review: ProposalReviewData, current_user: User = Depends(RoleChecker(["auditor"]))):
    issue = await Issue.get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    proposal = await Proposal.find_one({"issue_id": issue_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    if review.approved:
        proposal.status = "Approved"
        issue.status = "Proposal Approved"
        issue.estimated_budget = proposal.estimated_budget
        stage = "Proposal Approved"
    else:
        proposal.status = "Rejected"
        issue.status = "Proposal Rejected"
        stage = "Proposal Rejected"
        
    proposal.reviewed_at = datetime.utcnow()
    proposal.reviewed_by = current_user.id
    proposal.auditor_note = review.note
    await proposal.save()
    
    issue.updated_at = datetime.utcnow()
    await issue.save()
    
    timeline = TimelineEntry(
        issue_id=issue.id,
        stage=stage,
        status_to=issue.status,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        note=review.note
    )
    await timeline.insert()
    return {"message": "Proposal reviewed"}

@router.patch("/issues/{issue_id}/final-review")
async def final_review(issue_id: PydanticObjectId, review: FinalReviewData, current_user: User = Depends(RoleChecker(["auditor"]))):
    issue = await Issue.get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    if review.resolved:
        issue.status = "Resolved"
        stage = "Final Resolution"
    else:
        issue.status = "Needs Rework"
        issue.rejection_reason = review.note
        stage = "Needs Rework"
        
    issue.updated_at = datetime.utcnow()
    await issue.save()
    
    timeline = TimelineEntry(
        issue_id=issue.id,
        stage=stage,
        status_to=issue.status,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        note=review.note
    )
    await timeline.insert()
    return {"message": "Final review complete"}
