import axios from "axios";

// FastAPI backend — set REACT_APP_API_URL in .env to override
const BASE_URL = process.env.REACT_APP_API_URL || "https://safetrace-vu40.onrender.com";

const api = axios.create({ baseURL: BASE_URL, timeout: 35000 });

// ── Core API calls (all hit FastAPI / Python backend) ──────────────────────
export const analyzeScan  = (payload) => api.post("/api/scan/analyze", payload);
export const getSample    = (key)     => api.get(`/api/scan/sample/${key}`);
export const submitReport = (payload) => api.post("/api/reports/submit", payload);
export const getReports   = (limit = 20) => api.get(`/api/reports/list?limit=${limit}`);
export const getStats     = () => api.get("/api/analytics/stats");
export const inspectCert  = (target, port = 443) =>
  api.post("/api/cert/inspect", { target, port });

/**
 * Direct Claude call from frontend — used only as last-resort fallback
 * when the FastAPI backend is completely unreachable.
 * The backend (verdict_service.py) is the primary path for AI verdicts.
 */
export const getClaudeVerdict = async (data, overrideKey = "") => {
  // First try: ask the backend to generate the verdict
  try {
    const res = await api.post("/api/scan/analyze", {
      name: data.name,
      permissions: data.permissions || [],
      urls: data.urls || [],
      anthropic_api_key: overrideKey,
    });
    if (res.data?.ai_verdict) return res.data.ai_verdict;
  } catch {
    // Backend offline — fall through to direct call
  }

  // Last resort: direct Anthropic call from browser
  const key = overrideKey;
  if (!key) return null;

  const prompt = `You are a cybersecurity analyst specializing in mobile app fraud detection in India.
Scan: ${data.name} | Score: ${data.score ?? data.threat_score}/100 | Risk: ${data.risk}
Findings: ${(data.findings || []).slice(0, 3).join("; ")}
Permissions: ${(data.permissions || []).slice(0, 5).join(", ") || "None"}
Write 3 sentences. Direct, plain language for non-technical Indian users. Real consequences (UPI, OTP, bank loss). One clear action at the end. No "I" or "This app". No markdown.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await res.json();
    if (json.content) {
      return json.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    }
  } catch (e) {
    console.error("Direct Claude call error:", e);
  }
  return null;
};

export default api;
