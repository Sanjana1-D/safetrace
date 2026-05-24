from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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

app.include_router(scan.router, prefix="/api/scan", tags=["Scan"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(cert.router, prefix="/api/cert", tags=["Cert"])


# Serve React static files
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve React app
@app.get("/")
async def serve_react():
    return FileResponse("static/index.html")


# React Router support
@app.get("/{full_path:path}")
async def serve_react_routes(full_path: str):

    return FileResponse("static/index.html")

    return FileResponse("static/index.html")
