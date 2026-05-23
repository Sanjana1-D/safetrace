from fastapi import APIRouter
from app.services.firebase_service import get_stats

router = APIRouter()


@router.get("/stats")
async def stats():
    data = await get_stats()
    return data
