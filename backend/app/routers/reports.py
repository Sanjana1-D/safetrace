from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.firebase_service import save_report, get_reports

router = APIRouter()


class ReportRequest(BaseModel):
    target: str
    category: str
    categoryLabel: Optional[str] = None
    details: Optional[str] = None
    email: Optional[str] = None
    risk: Optional[str] = "MEDIUM"
    score: Optional[int] = None
    findings: Optional[list] = None


@router.post("/submit")
async def submit_report(req: ReportRequest):
    if not req.target.strip():
        raise HTTPException(status_code=400, detail="target is required")
    firebase_id = await save_report(req.dict())
    return {"success": True, "id": firebase_id}


@router.get("/list")
async def list_reports(limit: int = 20):
    reports = await get_reports(limit)
    return {"reports": reports, "count": len(reports)}
