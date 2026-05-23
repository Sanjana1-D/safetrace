"""
/api/scan — analyze and sample endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Any, Optional

from app.ml.pipeline import full_pipeline
from app.services.firebase_service import save_scan
from app.services.verdict_service import get_ai_verdict

router = APIRouter()


class ScanRequest(BaseModel):
    name: str
    permissions: List[str] = []
    urls: List[Any] = []
    file_size_mb: Optional[float] = None
    anthropic_api_key: str = ""


# ── Pre-built sample data (mirrors frontend SAMPLE_FALLBACKS) ────────────────

SAMPLES = {
    "phonepe_fake": {
        "name": "phonepe_v4.2.1_mod.apk",
        "permissions": ["READ_SMS", "RECEIVE_SMS", "SEND_SMS", "READ_CONTACTS", "RECORD_AUDIO", "REQUEST_INSTALL_PACKAGES"],
        "urls": ["phonepe-update.xyz/apk", "185.220.101.47:8080", "api.legitpay.in"],
    },
    "sbi_clone": {
        "name": "SBI_YONO_Official_v2.apk",
        "permissions": ["READ_SMS", "RECEIVE_SMS", "CAMERA", "READ_CONTACTS", "SYSTEM_ALERT_WINDOW", "REQUEST_INSTALL_PACKAGES"],
        "urls": ["sbi-kycupdate.xyz", "194.165.16.78", "yono.sbi.co.in"],
    },
    "kyc_fraud": {
        "name": "https://aadhaar-kyc-update.xyz/verify",
        "permissions": ["REQUEST_INSTALL_PACKAGES", "INTERNET"],
        "urls": ["aadhaar-kyc-update.xyz", "t.me/kychelperbot"],
    },
    "vpn_spyware": {
        "name": "FreeVPN_Unlimited_v3.1.apk",
        "permissions": ["RECORD_AUDIO", "READ_CONTACTS", "CAMERA", "INTERNET"],
        "urls": ["collect.vpndata.io", "api.frevpn.com"],
    },
    "clean_app": {
        "name": "my_verified_app_v1.0.apk",
        "permissions": ["INTERNET", "VIBRATE"],
        "urls": ["api.myapp.com"],
    },
}


@router.post("/analyze")
async def analyze(req: ScanRequest):
    """
    Full ML pipeline scan.
    1. Random Forest threat scoring (scikit-learn)
    2. DBSCAN fraud campaign clustering (scikit-learn)
    3. TensorFlow MobileNetV3-style brand similarity
    4. AI verdict (Claude / rule-based fallback)
    5. Firebase persistence
    """
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="name is required")

    result = full_pipeline(
        name=req.name,
        permissions=req.permissions,
        urls=req.urls,
        file_size_mb=req.file_size_mb,
    )

    # AI verdict (async, non-blocking failure)
    try:
        verdict = await get_ai_verdict(result, override_key=req.anthropic_api_key)
        result["ai_verdict"] = verdict
    except Exception:
        result["ai_verdict"] = None

    # Firebase persistence (async, non-blocking failure)
    try:
        firebase_id = await save_scan(result)
        if firebase_id:
            result["firebase_scan_id"] = firebase_id
    except Exception:
        pass

    return result


@router.get("/sample/{key}")
async def get_sample(key: str):
    """Return a pre-analyzed sample scan using the real ML pipeline."""
    if key not in SAMPLES:
        raise HTTPException(status_code=404, detail=f"Sample '{key}' not found. Valid: {list(SAMPLES.keys())}")

    s = SAMPLES[key]
    result = full_pipeline(
        name=s["name"],
        permissions=s["permissions"],
        urls=s["urls"],
    )

    try:
        verdict = await get_ai_verdict(result)
        result["ai_verdict"] = verdict
    except Exception:
        result["ai_verdict"] = None

    return result
