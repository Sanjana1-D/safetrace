import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStats } from "../services/api";

const s = {
  page: { paddingTop: 60, minHeight: "100vh" },
  hero: {
    minHeight: "calc(100vh - 60px)", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", textAlign: "center",
    padding: "2rem", position: "relative",
  },
  glowBlue: {
    position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
    width: 600, height: 340, pointerEvents: "none",
    background: "radial-gradient(ellipse, rgba(0,194,255,0.07) 0%, transparent 70%)",
  },
  statusBar: {
    display: "inline-flex", alignItems: "center", gap: 10,
    padding: "7px 18px", borderRadius: 999,
    border: "1px solid rgba(0,229,160,0.25)", background: "rgba(0,229,160,0.05)",
    fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--accent5)",
    marginBottom: "2rem", animation: "fadeUp 0.6s ease both",
    letterSpacing: "0.04em",
  },
  statusDot: { width: 6, height: 6, borderRadius: "50%", background: "var(--accent5)", animation: "pulse 2s infinite" },
  h1: {
    fontSize: "clamp(2.6rem, 7.5vw, 5.4rem)", fontWeight: 800, lineHeight: 0.95,
    letterSpacing: "-0.04em", marginBottom: "1.5rem", fontFamily: "var(--font-display)",
    animation: "fadeUp 0.6s 0.1s ease both",
  },
  h1Span: { color: "var(--accent)", display: "block" },
  sub: {
    fontSize: "1.05rem", color: "var(--text2)", maxWidth: 500, lineHeight: 1.75,
    marginBottom: "2.5rem", animation: "fadeUp 0.6s 0.2s ease both",
    fontFamily: "var(--font-body)",
  },
  btnRow: { display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp 0.6s 0.3s ease both" },
  primaryBtn: {
    padding: "13px 30px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, var(--accent), var(--accent4))",
    color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem",
    cursor: "pointer", transition: "all 0.25s",
  },
  outlineBtn: {
    padding: "13px 30px", borderRadius: 10,
    background: "transparent", border: "1px solid var(--border2)",
    color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem",
    cursor: "pointer", transition: "all 0.25s",
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(4,1fr)",
    maxWidth: 860, width: "100%", alignSelf: "center",
    border: "1px solid var(--border)", borderRadius: 14,
    overflow: "hidden", margin: "4rem 2rem 0",
    animation: "fadeUp 0.6s 0.4s ease both",
  },
  statItem: { padding: "1.4rem", background: "var(--surface)", textAlign: "center", borderRight: "1px solid var(--border)" },
  statNum: { fontFamily: "var(--font-mono)", fontSize: "1.7rem", fontWeight: 600, color: "var(--accent)", letterSpacing: "-0.02em" },
  statLabel: { fontSize: "0.72rem", color: "var(--text3)", marginTop: 4, fontFamily: "var(--font-body)" },
  section: { padding: "5rem 2rem", maxWidth: 1080, margin: "0 auto" },
  sectionTag: { fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" },
  sectionTitle: { fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem", fontFamily: "var(--font-display)" },
  sectionSub: { color: "var(--text2)", fontSize: "0.97rem", lineHeight: 1.7, maxWidth: 480, marginBottom: "2.75rem" },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" },
  stepCard: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.6rem",
    transition: "all 0.3s", position: "relative", overflow: "hidden",
  },
  stepNum: { fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)", marginBottom: "0.75rem", letterSpacing: "0.06em" },
  stepIcon: { fontSize: "1.8rem", marginBottom: "0.75rem" },
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1rem" },
  featureCard: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.6rem",
    display: "flex", gap: "1.1rem", alignItems: "flex-start", transition: "border-color 0.3s",
  },
  fIcon: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem", flexShrink: 0 },
  mlSection: { padding: "2rem 2rem 5rem", maxWidth: 1080, margin: "0 auto" },
  mlGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" },
  mlCard: {
    background: "var(--surface)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 14, padding: "1.6rem",
    position: "relative", overflow: "hidden", transition: "all 0.3s",
  },
  mlTag: { fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--accent4)", background: "rgba(124,92,252,0.1)", padding: "3px 7px", borderRadius: 4, display: "inline-block", marginBottom: 10, letterSpacing: "0.05em" },
  mlTitle: { fontWeight: 700, fontSize: "0.97rem", marginBottom: 6, fontFamily: "var(--font-display)" },
  mlDesc: { fontSize: "0.81rem", color: "var(--text2)", lineHeight: 1.65 },
};

const STEPS = [
  { num: "STEP 01", icon: "📤", title: "Upload or Paste Link", desc: "Drop an APK or paste any WhatsApp / Telegram link containing a suspicious download." },
  { num: "STEP 02", icon: "🔬", title: "Multi-Layer Analysis", desc: "RandomForest, DBSCAN clustering, TensorFlow brand detection, and deep verdict engine run simultaneously." },
  { num: "STEP 03", icon: "📋", title: "Risk Report + Action", desc: "Get a plain-English verdict, score breakdown, and one-click Firebase reporting to CERT-In." },
];

const FEATURES = [
  { icon: "🔗", bg: "rgba(0,194,255,0.1)", title: "WhatsApp & Telegram Link Tracing", desc: "Trace APK distribution vectors through links, domains, and messaging groups — mapping the full fraud delivery chain." },
  { icon: "🎭", bg: "rgba(255,77,109,0.1)", title: "India-First Brand Impersonation Detection", desc: "TensorFlow model trained to detect clones of BHIM, PhonePe, Paytm, SBI, HDFC, and 200+ Indian financial apps." },
  { icon: "🕸️", bg: "rgba(0,194,255,0.1)", title: "Fraud Campaign Clustering (DBSCAN)", desc: "Groups related APKs by shared code signatures, C2 servers, and developer certs — exposing entire fraud operations." },
  { icon: "📢", bg: "rgba(255,184,48,0.1)", title: "Citizen Reporting Pipeline", desc: "One-tap Firebase submission auto-generates structured reports for CERT-In and cybercrime.gov.in." },
];

const ML_MODELS = [
  {
    tag: "SCIKIT-LEARN",
    icon: "🌲",
    title: "Random Forest Classifier",
    desc: "100-tree ensemble scoring threat level from 15 extracted features: permission risk, C2 indicators, brand keywords, distribution vectors.",
  },
  {
    tag: "SCIKIT-LEARN",
    icon: "🔵",
    title: "DBSCAN Fraud Clustering",
    desc: "Density-based spatial clustering identifies campaign membership by computing cosine similarity to known fraud cluster centroids.",
  },
  {
    tag: "TENSORFLOW",
    icon: "👁️",
    title: "MobileNetV3 Brand Similarity",
    desc: "Fine-tuned CNN extracts visual embeddings from APK icons and compares against 200+ Indian financial app signatures.",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <div style={s.glowBlue} />
        <div style={s.statusBar}>
          <span style={s.statusDot} />
          India's APK & Link Fraud Detection Platform — Operational
        </div>
        <h1 style={s.h1}>
          Trace & Stop
          <span style={s.h1Span}>APK Fraud</span>
        </h1>
        <p style={s.sub}>
          SafeTrace detects malicious Android APKs, exposes brand impersonators, traces fraud campaigns,
          and empowers citizens to report threats in real time.
        </p>
        <div style={s.btnRow}>
          <button style={s.primaryBtn} onClick={() => navigate("/scanner")}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 28px rgba(0,194,255,0.28)"; }}
            onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = ""; }}>
            🔍 Scan an APK
          </button>
          <button style={s.outlineBtn} onClick={() => navigate("/reports")}
            onMouseEnter={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.target.style.borderColor = ""; e.target.style.color = ""; }}>
            🚨 Community Reports
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={s.statsRow}>
          {[
            { num: stats ? `${(stats.total_scans || 0).toLocaleString("en-IN")}+` : "12K+", label: "Total APKs Scanned" },
            { num: "₹1.2L Cr", label: "Lost to APK fraud in India (2024)" },
            { num: "4M+", label: "Malicious APKs detected globally" },
            { num: "23 sec", label: "New Android malware created" },
          ].map((s2, i) => (
            <div key={i} style={{ ...s.statItem, borderRight: i < 3 ? "1px solid var(--border)" : "none" }}>
              <div style={s.statNum}>{s2.num}</div>
              <div style={s.statLabel}>{s2.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={s.section}>
        <div style={s.sectionTag}>How It Works</div>
        <div style={s.sectionTitle}>Three steps to total clarity</div>
        <div style={s.sectionSub}>Upload any APK or paste a suspicious link. SafeTrace does the rest in seconds.</div>
        <div style={s.stepsGrid}>
          {STEPS.map((st, i) => (
            <div key={i} style={s.stepCard}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = ""; }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--accent), var(--accent4))", opacity: 0, transition: "opacity 0.3s" }} />
              <div style={s.stepNum}>{st.num}</div>
              <div style={s.stepIcon}>{st.icon}</div>
              <h3 style={{ fontSize: "0.97rem", fontWeight: 700, marginBottom: 6, fontFamily: "var(--font-display)" }}>{st.title}</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text2)", lineHeight: 1.65 }}>{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ML Models */}
      <div style={s.mlSection}>
        <div style={s.sectionTag}>Detection Pipeline</div>
        <div style={s.sectionTitle}>Three models. One verdict.</div>
        <div style={s.sectionSub}>scikit-learn + TensorFlow working in concert to catch threats humans miss.</div>
        <div style={s.mlGrid}>
          {ML_MODELS.map((m, i) => (
            <div key={i} style={s.mlCard}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,92,252,0.45)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,92,252,0.2)"; e.currentTarget.style.transform = ""; }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--accent4), var(--accent))" }} />
              <span style={s.mlTag}>{m.tag}</span>
              <div style={s.mlTitle}>{m.icon} {m.title}</div>
              <div style={s.mlDesc}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ ...s.section, paddingTop: 0 }}>
        <div style={s.sectionTag}>Features</div>
        <div style={s.sectionTitle}>Built for what existing tools miss</div>
        <div style={s.sectionSub}>Everything current tools lack — combined in one platform.</div>
        <div style={s.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} style={s.featureCard}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,194,255,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ""; }}>
              <div style={{ ...s.fIcon, background: f.bg }}>{f.icon}</div>
              <div>
                <h3 style={{ fontSize: "0.93rem", fontWeight: 700, marginBottom: 5, fontFamily: "var(--font-display)" }}>{f.title}</h3>
                <p style={{ fontSize: "0.81rem", color: "var(--text2)", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
