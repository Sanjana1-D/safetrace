import ssl
import socket
import datetime
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class CertRequest(BaseModel):
    target: str
    port: int = 443


@router.post("/inspect")
async def inspect_cert(req: CertRequest):
    target = req.target.replace("https://", "").replace("http://", "").split("/")[0]
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((target, req.port), timeout=8) as sock:
            with ctx.wrap_socket(sock, server_hostname=target) as ssock:
                cert = ssock.getpeercert()

        not_after = datetime.datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
        not_before = datetime.datetime.strptime(cert["notBefore"], "%b %d %H:%M:%S %Y %Z")
        days_left = (not_after - datetime.datetime.utcnow()).days

        subject = dict(x[0] for x in cert.get("subject", []))
        issuer = dict(x[0] for x in cert.get("issuer", []))

        return {
            "valid": True,
            "subject": subject,
            "issuer": issuer,
            "not_before": not_before.isoformat(),
            "not_after": not_after.isoformat(),
            "days_remaining": days_left,
            "san": [v for _, v in cert.get("subjectAltName", [])],
            "protocol": ssock.version(),
            "cipher": ssock.cipher()[0] if ssock.cipher() else None,
        }

    except ssl.SSLCertVerificationError as e:
        return {"valid": False, "error": f"SSL verification failed: {e}"}
    except Exception as e:
        return {"valid": False, "error": str(e)}
