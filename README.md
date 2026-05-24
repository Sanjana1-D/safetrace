# SafeTrace v2.0

**India's APK & Link Fraud Detection Platform**

## Tech Stack

| Layer      | Technology                                      |
|------------|--------------------------------------------------|
| Frontend   | React.js (React Router, Axios, Firebase JS SDK) |
| Backend    | FastAPI (Python 3.11+)                          |
| Database   | Firebase Realtime Database                      |
| ML         | Scikit-learn (Random Forest, DBSCAN)            |
| ML         | TensorFlow / Keras (brand embedding model)      |
| AI Verdict | Anthropic Claude (claude-sonnet-4)              |

---

## Project Structure

```
safetrace/
├── backend/                    ← FastAPI Python backend
│   ├── main.py                 ← App entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── ml/
│       │   └── pipeline.py     ← Random Forest + DBSCAN + TensorFlow
│       ├── services/
│       │   ├── firebase_service.py   ← Firebase Admin SDK
│       │   └── verdict_service.py    ← Claude AI verdict
│       └── routers/
│           ├── scan.py         ← POST /api/scan/analyze, GET /api/scan/sample/{key}
│           ├── reports.py      ← POST /api/reports/submit, GET /api/reports/list
│           ├── analytics.py    ← GET /api/analytics/stats
│           └── cert.py         ← POST /api/cert/inspect
└── frontend/                   ← React.js frontend (unchanged logic)
    ├── src/
    │   ├── services/api.js     ← Points to FastAPI backend
    │   ├── services/firebase.js← Firebase JS SDK (community reports live feed)
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── ScannerPage.jsx
    │   │   └── ReportsPage.jsx
    │   └── components/
    │       ├── ScanResults.jsx
    │       ├── RiskPopup.jsx
    │       ├── ReportModal.jsx
    │       ├── CertInspector.jsx
    │       ├── Navbar.jsx
    │       └── Toast.jsx
    └── package.json
```

---

## Backend Setup

### 1. Create Python virtual environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
FIREBASE_DB_URL=https://scamscan-93005-default-rtdb.asia-southeast1.firebasedatabase.app
FIREBASE_SERVICE_ACCOUNT=firebase-service-account.json
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Firebase service account:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key" → download JSON
3. Save as `backend/firebase-service-account.json`

### 4. Run the backend

```bash
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Edit REACT_APP_API_URL if backend is not on localhost:8000
npm install
npm start
```

---

## ML Pipeline Details

### Random Forest (scikit-learn)
- **100-tree ensemble** scoring threat level from 15 extracted features
- Features: permission risk weights, SMS/admin/camera flags, suspicious TLDs,
  known C2 IP patterns, distribution vectors (Telegram/WhatsApp), brand keywords,
  file size anomaly, dangerous permission pairs, URL danger ratio
- Output: threat score 0–99, risk label (HIGH/MEDIUM/LOW), feature importances

### DBSCAN Fraud Campaign Clustering (scikit-learn)
- Compares input feature vector to known fraud cluster centroids using **cosine similarity**
- DBSCAN (`eps=0.35, min_samples=2, metric=cosine`) validates cluster membership
- Clusters: UPI_Phish_2025_Q1, SBI_KYC_2025_Q2, Aadhaar_Harvest_2025, FakeVPN_Spyware_2024

### TensorFlow Brand Similarity
- Lightweight **MLP embedding network** (TensorFlow/Keras): 15→64→32 dims, L2-normalized
- Compares APK embeddings against 7 Indian financial app brand signatures
  (PhonePe, BHIM, Paytm, SBI YONO, HDFC, ICICI, Google Pay)
- Keyword presence in APK name amplifies brand-match score

### Firebase (Database)
- **Firebase Admin SDK** (Python) persists every scan to `/scans/<id>`
- Community reports written to `/reports/<id>` — live-synced to the React frontend
  via Firebase JS SDK's `onValue()` real-time listener (no polling needed)
- Analytics stats aggregated from `/scans` collection

---

## API Reference

| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| POST   | /api/scan/analyze         | Full ML pipeline scan              |
| GET    | /api/scan/sample/{key}    | Pre-analyzed sample (real ML)      |
| POST   | /api/reports/submit       | Submit community report            |
| GET    | /api/reports/list         | List reports                       |
| GET    | /api/analytics/stats      | Scan statistics                    |
| POST   | /api/cert/inspect         | SSL certificate inspection         |
| GET    | /health                   | Health check                       |

---

## Deployment

### Backend (Render)
uvicorn main:app --host 0.0.0.0 --port $PORT

### Frontend
REACT_APP_API_URL=https://safetrace-vu40.onrender.com
npm run build

### Deployment link : " https://safetrace-vu40.onrender.com"
