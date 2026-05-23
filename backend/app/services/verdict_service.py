"""
AI verdict generation — calls Anthropic Claude API from the backend.
Falls back to rule-based verdicts if no API key is configured.
"""

import os
import httpx
from typing import Dict, Any, Optional

ANTHROPIC_API_KEY = os.getenv(
    "ANTHROPIC_API_KEY",
    "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",
)

FALLBACKS = {
    "HIGH": (
        "This file contains highly dangerous indicators — suspicious permissions and network behaviour "
        "consistent with malware targeting Indian UPI users were found. "
        "An attacker could silently read your SMS OTPs, enabling unauthorized bank transfers. "
        "Delete this file immediately; if already installed, factory-reset your device and call your bank's fraud helpline."
    ),
    "MEDIUM": (
        "This scan shows moderate risk signals — the permission profile and distribution method raise concerns. "
        "Verify the developer's identity and download only from official sources. "
        "If you received this from an unknown WhatsApp or Telegram contact, treat it as suspicious and do not install."
    ),
    "LOW": (
        "This file appears to have a clean security profile — no dangerous permissions, fraud signatures, "
        "or suspicious network indicators were detected. "
        "Always download apps from the official Google Play Store for ongoing security updates."
    ),
}


async def get_ai_verdict(scan_data: Dict[str, Any], override_key: str = "") -> Optional[str]:
    key = override_key or ANTHROPIC_API_KEY
    if not key:
        return FALLBACKS.get(scan_data.get("risk", "LOW"))

    name = scan_data.get("name", "Unknown")
    score = scan_data.get("threat_score", 0)
    risk = scan_data.get("risk", "LOW")
    findings = (scan_data.get("findings") or [])[:3]
    permissions = (scan_data.get("permissions") or [])[:5]

    prompt = (
        f"You are a cybersecurity analyst specialising in mobile app fraud detection in India.\n"
        f"Scan: {name} | Score: {score}/100 | Risk: {risk}\n"
        f"Findings: {'; '.join(findings)}\n"
        f"Permissions: {', '.join(permissions) or 'None'}\n"
        "Write 3 sentences. Direct, plain language for non-technical Indian users. "
        "Real consequences (UPI, OTP, bank loss). One clear action at the end. "
        "No 'I' or 'This app'. No markdown."
    )

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": key,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 400,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            data = resp.json()
            if data.get("content"):
                return "".join(b.get("text", "") for b in data["content"] if b.get("type") == "text").strip()
    except Exception as e:
        print(f"[AI Verdict] Error: {e}")

    return FALLBACKS.get(risk)
