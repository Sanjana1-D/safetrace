from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import scan, reports, analytics, cert

app = FastAPI(
    title="SafeTrace API",
    description="APK & URL fraud detection — FastAPI + Scikit-learn + TensorFlow + Firebase",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router,      prefix="/api/scan",      tags=["Scan"])
app.include_router(reports.router,   prefix="/api/reports",   tags=["Reports"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(cert.router,      prefix="/api/cert",      tags=["Cert"])


@app.get("/")
def root():
    return {
        "service": "SafeTrace",
        "version": "2.0.0",
        "stack": {
            "frontend": "React.js",
            "backend": "FastAPI (Python)",
            "database": "Firebase Realtime DB",
            "ml": ["Scikit-learn (Random Forest, DBSCAN)", "TensorFlow (MobileNetV3)"],
        },
        "status": "operational",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
