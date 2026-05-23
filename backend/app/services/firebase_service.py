"""
Firebase Realtime Database service (Python / firebase-admin SDK).
Handles scan persistence and report storage — same DB as the React frontend.
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

try:
    import firebase_admin
    from firebase_admin import credentials, db as firebase_db

    _FIREBASE_URL = os.getenv(
        "FIREBASE_DB_URL",
        "https://scamscan-93005-default-rtdb.asia-southeast1.firebasedatabase.app",
    )

    _SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT", "")

    if not firebase_admin._apps:
        if _SERVICE_ACCOUNT_PATH and os.path.exists(_SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(_SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred, {"databaseURL": _FIREBASE_URL})
            print("[Firebase] Initialized with service account ✓")
        else:
            # Anonymous / public DB mode (works for public Firebase rules)
            firebase_admin.initialize_app(options={"databaseURL": _FIREBASE_URL})
            print("[Firebase] Initialized in anonymous mode (no service account found)")

    FIREBASE_OK = True

except Exception as e:
    print(f"[Firebase] Could not initialize: {e} — operating in offline mode")
    FIREBASE_OK = False


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


async def save_scan(scan_data: Dict[str, Any]) -> Optional[str]:
    """Persist a scan result to Firebase /scans/<push_id>."""
    if not FIREBASE_OK:
        return None
    try:
        ref = firebase_db.reference("scans")
        payload = {
            "name": scan_data.get("name"),
            "threat_score": scan_data.get("threat_score"),
            "risk": scan_data.get("risk"),
            "ml_models_used": scan_data.get("ml_models_used", []),
            "findings": scan_data.get("findings", [])[:3],
            "scanned_at": _now_iso(),
        }
        result = ref.push(payload)
        return result.key
    except Exception as e:
        print(f"[Firebase] save_scan error: {e}")
        return None


async def save_report(report_data: Dict[str, Any]) -> Optional[str]:
    """Save a community report to Firebase /reports/<push_id>."""
    if not FIREBASE_OK:
        return None
    try:
        ref = firebase_db.reference("reports")
        result = ref.push({**report_data, "reported_at": _now_iso()})
        return result.key
    except Exception as e:
        print(f"[Firebase] save_report error: {e}")
        return None


async def get_reports(limit: int = 20) -> List[Dict[str, Any]]:
    """Fetch latest community reports from Firebase."""
    if not FIREBASE_OK:
        return []
    try:
        ref = firebase_db.reference("reports")
        data = ref.order_by_child("reported_at").limit_to_last(limit).get()
        if not data:
            return []
        return [{"id": k, **v} for k, v in reversed(list(data.items()))]
    except Exception as e:
        print(f"[Firebase] get_reports error: {e}")
        return []


async def get_stats() -> Dict[str, Any]:
    """Aggregate scan statistics from Firebase."""
    if not FIREBASE_OK:
        return {"total_scans": 0, "high_risk": 0, "medium_risk": 0, "low_risk": 0}
    try:
        scans_ref = firebase_db.reference("scans")
        scans = scans_ref.get() or {}
        total = len(scans)
        high = sum(1 for s in scans.values() if isinstance(s, dict) and s.get("risk") == "HIGH")
        med  = sum(1 for s in scans.values() if isinstance(s, dict) and s.get("risk") == "MEDIUM")
        low  = total - high - med
        return {"total_scans": total, "high_risk": high, "medium_risk": med, "low_risk": low}
    except Exception as e:
        print(f"[Firebase] get_stats error: {e}")
        return {"total_scans": 0}
