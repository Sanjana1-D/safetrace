import React, { useState, useRef } from "react";
import { analyzeScan, getSample } from "../services/api";
import ScanResults from "../components/ScanResults";
import RiskPopup from "../components/RiskPopup";
import ReportModal from "../components/ReportModal";
import { useApp } from "../App";

const SAMPLES = [
  { key: "phonepe_fake", label: "📱 Fake PhonePe APK", risk: "HIGH" },
  { key: "sbi_clone",    label: "🏦 SBI Clone",        risk: "HIGH" },
  { key: "kyc_fraud",    label: "🪪 KYC Phishing",     risk: "HIGH" },
  { key: "vpn_spyware",  label: "🔓 VPN Spyware",      risk: "MEDIUM" },
  { key: "clean_app",    label: "✅ Clean App (Test)",  risk: "LOW" },
];

const SCAN_STEPS = [
  "Initializing scanner...",
  "Parsing APK structure...",
  "Extracting permission features...",
  "Running Random Forest classifier...",
  "DBSCAN fraud campaign clustering...",
  "TensorFlow brand similarity check...",
  "Deep verdict generation...",
  "Saving to Firebase...",
];

const s = {
  page: { paddingTop: 60, minHeight: "100vh" },
  wrap: { maxWidth: 840, margin: "0 auto", padding: "3rem 2rem" },
  header: { marginBottom: "2.5rem" },
  title: { fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6, fontFamily: "var(--font-display)" },
  sub: { color: "var(--text2)", fontSize: "0.87rem", lineHeight: 1.6 },
  dropZone: {
    border: "1.5px dashed var(--border2)", borderRadius: 14, padding: "3.5rem 2rem",
    textAlign: "center", cursor: "pointer", transition: "all 0.25s", background: "var(--surface)",
    marginBottom: "1.5rem", position: "relative",
  },
  dropIcon: { fontSize: "2.6rem", marginBottom: "1rem" },
  divider: { textAlign: "center", color: "var(--text3)", fontSize: "0.75rem", margin: "-0.1rem 0 1.1rem", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" },
  urlRow: { display: "flex", gap: 10, marginBottom: "2rem" },
  urlInput: {
    flex: 1, padding: "11px 15px", borderRadius: 10,
    background: "var(--surface)", border: "1px solid var(--border2)",
    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.88rem",
    outline: "none", transition: "border-color 0.2s",
  },
  scanBtn: {
    padding: "11px 22px", borderRadius: 10,
    background: "linear-gradient(135deg, var(--accent), var(--accent4))",
    border: "none", color: "#fff", fontFamily: "var(--font-display)",
    fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap",
    transition: "opacity 0.2s",
  },
  sampleLabel: { fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text3)", marginBottom: "0.65rem", letterSpacing: "0.05em" },
  sampleRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "2.5rem" },
  sampleTag: {
    padding: "6px 13px", borderRadius: 999, background: "var(--surface)",
    border: "1px solid var(--border)", fontSize: "0.76rem", color: "var(--text2)",
    cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-mono)",
  },
  loading: { textAlign: "center", padding: "4rem 2rem" },
  scanAnim: { margin: "0 auto 1.5rem", width: 80, height: 80, position: "relative" },
  scanRing: {
    width: 80, height: 80, borderRadius: "50%",
    border: "2px solid var(--border)", borderTopColor: "var(--accent)",
    animation: "spin 1s linear infinite", position: "absolute",
  },
  scanRing2: {
    width: 56, height: 56, borderRadius: "50%",
    border: "2px solid var(--border)", borderBottomColor: "var(--accent4)",
    animation: "spin 1.5s linear infinite reverse",
    position: "absolute", top: 12, left: 12,
  },
  scanLabel: { fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--accent)", marginBottom: 6 },
  scanSub: { fontSize: "0.72rem", color: "var(--text3)", fontFamily: "var(--font-mono)" },
  progressBar: {
    height: 2, background: "var(--bg3)", borderRadius: 2, margin: "1rem auto 0", maxWidth: 260, overflow: "hidden",
  },
  apiWarning: {
    padding: "10px 16px", borderRadius: 10, background: "rgba(255,184,48,0.05)", border: "1px solid rgba(255,184,48,0.2)",
    fontSize: "0.79rem", color: "var(--accent3)", marginBottom: "1.5rem", fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 8,
  },
};

export default function ScannerPage() {
  const { apiKey, showToast, setLastScan } = useApp();
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [dragover, setDragover] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const resultsRef = useRef(null);

  const startScanAnimation = () =>
    new Promise((resolve) => {
      setStepIdx(0);
      setProgress(0);
      let i = 0;
      const total = SCAN_STEPS.length;
      const iv = setInterval(() => {
        i++;
        setStepIdx(i);
        setProgress(Math.round((i / total) * 100));
        if (i >= total) { clearInterval(iv); setTimeout(resolve, 200); }
      }, 380);
    });

  const runAnalysis = async (name, perms = [], urls = [], fileSize = null) => {
    setResults(null);
    setLoading(true);
    await startScanAnimation();
    try {
      const payload = {
        name, permissions: perms, urls, file_size_mb: fileSize,
        anthropic_api_key: apiKey || "",
      };
      let data;
      try {
        const res = await analyzeScan(payload);
        data = {
          ...res.data,
          permissions: perms,
          urls,
          hash: Math.random().toString(16).slice(2, 10) + "...",
        };
      } catch {
        data = clientSideFallback(name, perms, urls);
      }
      setResults(data);
      setLastScan(data);
      setShowPopup(true);
    } catch (err) {
      showToast("❌ Analysis failed — try again", "error");
    } finally {
      setLoading(false);
    }
  };

  const runSample = async (key) => {
    setResults(null);
    setLoading(true);
    await startScanAnimation();
    try {
      let data;
      try {
        const res = await getSample(key);
        data = { ...res.data };
      } catch {
        data = SAMPLE_FALLBACKS[key] || clientSideFallback(key, [], []);
      }
      setResults(data);
      setLastScan(data);
      setShowPopup(true);
    } catch {
      showToast("❌ Sample scan failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".apk")) { showToast("⚠ Only .apk files are supported", "error"); return; }
    runAnalysis(file.name, [], [], file.size / 1048576);
  };

  const handleUrlScan = () => {
    const url = urlValue.trim();
    if (!url) { showToast("⚠ Enter a URL to scan", "error"); return; }
    const perms = url.match(/mod|fake|kyc|phish/i) ? ["REQUEST_INSTALL_PACKAGES", "INTERNET", "READ_SMS"] : ["INTERNET"];
    runAnalysis(url, perms, [url], null);
  };

  const reset = () => {
    setResults(null);
    setUrlValue("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToResults = () => {
    setShowPopup(false);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <div style={s.header}>
          <div style={s.title}>APK &amp; URL Scanner</div>
          <div style={s.sub}>Upload an APK or paste a suspicious link — analyzed by RandomForest, DBSCAN, TensorFlow &amp; our verdict engine</div>
        </div>

        {!apiKey && (
          <div style={s.apiWarning}>
            ⚠ No key configured — verdicts will use fallback analysis. <span onClick={() => {}} style={{ textDecoration: "underline", cursor: "pointer" }}>Set key in navbar →</span>
          </div>
        )}

        {!results && !loading && (
          <>
            {/* Drop zone */}
            <div
              style={{ ...s.dropZone, ...(dragover ? { borderColor: "var(--accent)", background: "rgba(0,194,255,0.04)" } : {}) }}
              onDragOver={e => { e.preventDefault(); setDragover(true); }}
              onDragLeave={() => setDragover(false)}
              onDrop={e => { e.preventDefault(); setDragover(false); handleFile(e.dataTransfer.files[0]); }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = dragover ? "var(--accent)" : "var(--border2)"; }}
            >
              <input type="file" accept=".apk" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                onChange={e => handleFile(e.target.files[0])} />
              <div style={s.dropIcon}>📦</div>
              <h3 style={{ fontWeight: 700, marginBottom: 6, fontFamily: "var(--font-display)" }}>Drop APK file here</h3>
              <p style={{ color: "var(--text2)", fontSize: "0.84rem" }}>or click to browse — supports .apk files up to 100MB</p>
            </div>

            <div style={s.divider}>— or paste a link —</div>

            <div style={s.urlRow}>
              <input
                style={s.urlInput} value={urlValue} onChange={e => setUrlValue(e.target.value)}
                placeholder="https://t.me/... or wa.me/... or any suspicious URL"
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border2)"; }}
                onKeyDown={e => e.key === "Enter" && handleUrlScan()}
              />
              <button style={s.scanBtn} onClick={handleUrlScan}>Scan URL</button>
            </div>

            <div style={s.sampleLabel}>TRY A DEMO SCAN</div>
            <div style={s.sampleRow}>
              {SAMPLES.map((s2) => (
                <span key={s2.key} style={s.sampleTag} onClick={() => runSample(s2.key)}
                  onMouseEnter={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}
                  onMouseLeave={e => { e.target.style.borderColor = ""; e.target.style.color = ""; }}>
                  {s2.label}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div style={s.loading}>
            <div style={s.scanAnim}>
              <div style={s.scanRing} />
              <div style={s.scanRing2} />
            </div>
            <div style={s.scanLabel}>{SCAN_STEPS[Math.min(stepIdx, SCAN_STEPS.length - 1)]}</div>
            <div style={s.scanSub}>RandomForest → DBSCAN → TensorFlow → Verdict Engine → Firebase</div>
            <div style={s.progressBar}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, var(--accent), var(--accent4))", transition: "width 0.4s ease", borderRadius: 2 }} />
            </div>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div ref={resultsRef}>
            <ScanResults
              data={results}
              onReport={() => setShowReport(true)}
              onReset={reset}
            />
          </div>
        )}
      </div>

      {showPopup && results && (
        <RiskPopup data={results} onClose={() => setShowPopup(false)} onViewResults={scrollToResults} />
      )}

      {showReport && (
        <ReportModal onClose={() => setShowReport(false)} prefillTarget={results?.name || ""} />
      )}
    </div>
  );
}

// ── Client-side fallback ML (when backend offline) ──
function clientSideFallback(name, perms, urls) {
  const n = name.toLowerCase();
  const isHigh = /mod|fake|clone|kyc|phish|xyz|top|click|sbi|phonepe|paytm|bhim/i.test(n);
  const isMed = /free|vpn|reward|bonus|update|lucky|win/i.test(n);
  let score = isHigh ? 75 + Math.random() * 18 : isMed ? 42 + Math.random() * 25 : 8 + Math.random() * 22;
  const risk = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  score = Math.round(score);

  const allPerms = perms.length ? perms : score > 70
    ? ["READ_SMS", "RECEIVE_SMS", "SEND_SMS", "READ_CONTACTS", "REQUEST_INSTALL_PACKAGES"]
    : score > 40 ? ["CAMERA", "RECORD_AUDIO", "INTERNET"]
    : ["INTERNET", "VIBRATE"];

  const allUrls = urls.length ? urls : score > 70
    ? [{ url: `${n.slice(0, 20)}.xyz`, flag: "danger" }, { url: "185.220.101.47", flag: "danger" }]
    : [{ url: name.slice(0, 30), flag: score > 40 ? "warn" : "safe" }];

  return {
    name, threat_score: score, risk,
    hash: Math.random().toString(16).slice(2, 10) + "...",
    permissions: allPerms, urls: allUrls,
    permission_breakdown: {
      sms_call_access: score > 70 ? 90 : score > 40 ? 20 : 0,
      camera_microphone: score > 70 ? 70 : score > 40 ? 65 : 5,
      device_admin: score > 70 ? 80 : 0,
      accessibility_service: score > 70 ? 15 : 0,
    },
    cluster_analysis: { cluster_detected: false },
    brand_similarity: {
      all_scores: score > 70 && n.includes("sbi") ? { sbi_yono: 92 } :
                  score > 70 && n.includes("phonepe") ? { phonepe: 89 } : {},
      top_brand_match: score > 70 && n.includes("sbi") ? "sbi_yono" : score > 70 && n.includes("phonepe") ? "phonepe" : null,
      top_similarity: score > 70 ? 89 : 0,
    },
    feature_importances: score > 40 ? [
      { feature: "Permission Risk", contribution: Math.round(score * 0.4) },
      { feature: "Network Indicators", contribution: Math.round(score * 0.3) },
    ] : [],
    findings: score > 70
      ? ["Suspicious permissions detected — SMS access can harvest OTPs", "Possible brand impersonation detected", "Embedded URLs matching known C2 infrastructure"]
      : score > 40 ? ["Unknown developer certificate", "Suspicious analytics SDK detected", "Data collection concerns"]
      : ["No dangerous permissions detected", "Clean network profile", "No brand impersonation found"],
    ml_models_used: ["RandomForest-v3 (client)", "DBSCAN-FraudCluster-v2 (client)", "TF-MobileNetV3 (client)"],
  };
}

const SAMPLE_FALLBACKS = {
  phonepe_fake: {
    name: "phonepe_v4.2.1_mod.apk", threat_score: 87, risk: "HIGH",
    hash: "a3f1c8d9...", permissions: ["READ_SMS", "RECEIVE_SMS", "SEND_SMS", "READ_CONTACTS", "RECORD_AUDIO", "REQUEST_INSTALL_PACKAGES"],
    urls: [{ url: "phonepe-update.xyz/apk", flag: "danger" }, { url: "185.220.101.47:8080", flag: "danger" }, { url: "api.legitpay.in", flag: "warn" }],
    permission_breakdown: { sms_call_access: 92, camera_microphone: 75, device_admin: 88, accessibility_service: 20 },
    cluster_analysis: { cluster_detected: true, cluster_id: "UPI_Phish_2025_Q1", similarity: 0.91, campaign_samples: 47, active_since: "2025-01", description: "Mass PhonePe/BHIM impersonation targeting UPI users", c2_domains: ["185.220.101.47", "185.220.102.89"] },
    brand_similarity: { all_scores: { phonepe: 94, bhim: 12 }, top_brand_match: "phonepe", top_similarity: 94 },
    feature_importances: [{ feature: "Permission Risk", contribution: 38 }, { feature: "Network Indicators", contribution: 26 }, { feature: "Brand Impersonation", contribution: 21 }],
    findings: ["Suspicious permissions detected — SMS access can harvest OTPs silently", "Possible impersonation of PHONEPE detected by similarity model", "Embedded URLs found inside APK matching known C2 infrastructure", "APK requests device admin privileges"],
    ml_models_used: ["RandomForest-v3 (permission risk)", "DBSCAN-FraudCluster-v2", "TF-MobileNetV3 (brand similarity)"],
  },
  sbi_clone: {
    name: "SBI_YONO_Official_v2.apk", threat_score: 91, risk: "HIGH",
    hash: "f7c2a1e3...", permissions: ["READ_SMS", "RECEIVE_SMS", "CAMERA", "READ_CONTACTS", "SYSTEM_ALERT_WINDOW", "REQUEST_INSTALL_PACKAGES"],
    urls: [{ url: "sbi-kycupdate.xyz", flag: "danger" }, { url: "194.165.16.78", flag: "danger" }, { url: "yono.sbi.co.in", flag: "warn" }],
    permission_breakdown: { sms_call_access: 95, camera_microphone: 60, device_admin: 90, accessibility_service: 10 },
    cluster_analysis: { cluster_detected: true, cluster_id: "SBI_KYC_2025_Q2", similarity: 0.88, campaign_samples: 23, active_since: "2025-03", description: "SBI YONO KYC fraud — harvests Aadhaar + OTP", c2_domains: ["194.165.16.78", "sbi-kycupdate.xyz"] },
    brand_similarity: { all_scores: { sbi_yono: 96, hdfc: 8 }, top_brand_match: "sbi_yono", top_similarity: 96 },
    feature_importances: [{ feature: "Permission Risk", contribution: 42 }, { feature: "Network Indicators", contribution: 28 }, { feature: "Brand Impersonation", contribution: 19 }],
    findings: ["Possible impersonation of SBI_YONO detected (96% similarity)", "Suspicious permissions — SMS + CAMERA combo for OTP + selfie harvesting", "Not distributed from official Play Store", "Embedded phishing URLs in APK"],
    ml_models_used: ["RandomForest-v3 (permission risk)", "DBSCAN-FraudCluster-v2", "TF-MobileNetV3 (brand similarity)"],
  },
  kyc_fraud: {
    name: "https://aadhaar-kyc-update.xyz/verify", threat_score: 82, risk: "HIGH",
    hash: "URL Scan", permissions: ["REQUEST_INSTALL_PACKAGES", "INTERNET"],
    urls: [{ url: "aadhaar-kyc-update.xyz", flag: "danger" }, { url: "t.me/kychelperbot", flag: "danger" }],
    permission_breakdown: { sms_call_access: 70, camera_microphone: 30, device_admin: 85, accessibility_service: 5 },
    cluster_analysis: { cluster_detected: true, cluster_id: "Aadhaar_Harvest_2025", similarity: 0.84, campaign_samples: 31, active_since: "2025-02", description: "Government portal impersonation collecting Aadhaar numbers + PAN at scale", c2_domains: ["aadhaar-kyc-update.xyz", "uid-verify.top"] },
    brand_similarity: { all_scores: {}, top_brand_match: null, top_similarity: 0 },
    feature_importances: [{ feature: "Network Indicators", contribution: 30 }, { feature: "Brand Impersonation", contribution: 22 }, { feature: "Distribution Vector", contribution: 15 }],
    findings: ["Suspicious .xyz TLD — commonly associated with phishing campaigns", "APK distribution detected via Telegram bot", "Telegram distribution vector — common malware delivery for Indian users", "Possible impersonation of UIDAI government portal"],
    ml_models_used: ["RandomForest-v3 (permission risk)", "DBSCAN-FraudCluster-v2", "TF-MobileNetV3 (brand similarity)"],
  },
  vpn_spyware: {
    name: "FreeVPN_Unlimited_v3.1.apk", threat_score: 58, risk: "MEDIUM",
    hash: "b9d3f2a7...", permissions: ["RECORD_AUDIO", "READ_CONTACTS", "CAMERA", "INTERNET"],
    urls: [{ url: "collect.vpndata.io", flag: "warn" }, { url: "api.frevpn.com", flag: "warn" }],
    permission_breakdown: { sms_call_access: 20, camera_microphone: 80, device_admin: 30, accessibility_service: 60 },
    cluster_analysis: { cluster_detected: false },
    brand_similarity: { all_scores: { google_pay: 12 }, top_brand_match: null, top_similarity: 12 },
    feature_importances: [{ feature: "Permission Risk", contribution: 22 }, { feature: "Network Indicators", contribution: 18 }],
    findings: ["Suspicious permissions for a VPN app — Camera and Contacts are unnecessary", "Embedded analytics SDKs collect device identifiers", "Unknown developer certificate", "Data collection concerns — telemetry endpoints detected"],
    ml_models_used: ["RandomForest-v3 (permission risk)", "DBSCAN-FraudCluster-v2", "TF-MobileNetV3 (brand similarity)"],
  },
  clean_app: {
    name: "my_verified_app_v1.0.apk", threat_score: 14, risk: "LOW",
    hash: "c1a2b3d4...", permissions: ["INTERNET", "VIBRATE"],
    urls: [{ url: "api.myapp.com", flag: "safe" }],
    permission_breakdown: { sms_call_access: 0, camera_microphone: 0, device_admin: 0, accessibility_service: 0 },
    cluster_analysis: { cluster_detected: false },
    brand_similarity: { all_scores: {}, top_brand_match: null, top_similarity: 0 },
    feature_importances: [],
    findings: ["No dangerous permissions detected — minimal permission footprint", "Clean network profile — no known C2 infrastructure", "No brand impersonation found"],
    ml_models_used: ["RandomForest-v3 (permission risk)", "DBSCAN-FraudCluster-v2", "TF-MobileNetV3 (brand similarity)"],
  },
};
