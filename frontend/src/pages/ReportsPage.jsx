import React, { useEffect, useState } from "react";
import { db, ref, onValue } from "../services/firebase";
import ReportModal from "../components/ReportModal";

const RISK_COLORS = {
  HIGH:   { accent: "var(--accent2)", bg: "rgba(255,77,109,0.07)", border: "rgba(255,77,109,0.18)", label: "⚠ HIGH" },
  MEDIUM: { accent: "var(--accent3)", bg: "rgba(255,184,48,0.07)",  border: "rgba(255,184,48,0.18)",  label: "⚡ MEDIUM" },
  LOW:    { accent: "var(--accent5)", bg: "rgba(0,229,160,0.07)", border: "rgba(0,229,160,0.18)", label: "✅ LOW" },
};

const CAT_ICONS = {
  phishing: "🎣", fake_apk: "📦", kyc_fraud: "🪪",
  upi_fraud: "💸", loan_scam: "🏦", brand_impersonation: "🎭", other: "⚠️",
};

const STATIC_REPORTS = [
  { id: "s1", target: "sbi-yono-update.xyz/apk-download", category: "fake_apk", categoryLabel: "Fake APK / Malicious App", risk: "HIGH", score: 91, finding: "Impersonates SBI YONO app with near-identical icon. Requests READ_SMS and RECEIVE_SMS — harvests OTPs silently.", date: "Apr 24, 2026" },
  { id: "s2", target: "aadhaar-kyc-verify.top/update", category: "kyc_fraud", categoryLabel: "KYC / Aadhaar Fraud", risk: "HIGH", score: 88, finding: "Fake KYC portal mimicking UIDAI. Collects Aadhaar number, PAN, and bank details under false government authority.", date: "Apr 21, 2026" },
  { id: "s3", target: "paytm-cashback-offer.click", category: "phishing", categoryLabel: "Phishing / Fake Login Page", risk: "HIGH", score: 84, finding: "Cloned Paytm interface offering fake ₹500 cashback. Phishing for UPI PIN and wallet credentials.", date: "Apr 18, 2026" },
  { id: "s4", target: "FreeRecharge_Lucky_v2.apk", category: "upi_fraud", categoryLabel: "UPI / Payment Fraud", risk: "MEDIUM", score: 62, finding: "Claims to offer free mobile recharge via a lucky draw. Contains hidden ad SDK that intercepts UPI intents.", date: "Apr 15, 2026" },
  { id: "s5", target: "loan-approval-fast.xyz/apply", category: "loan_scam", categoryLabel: "Fake Loan / Investment App", risk: "HIGH", score: 79, finding: "Instant loan scam site. Collects Aadhaar and selfie for verification, then vanishes with data and processing fee.", date: "Apr 12, 2026" },
  { id: "s6", target: "BHIM_Official_v5.3_mod.apk", category: "brand_impersonation", categoryLabel: "Brand Impersonation", risk: "HIGH", score: 93, finding: "Highly convincing BHIM clone with 93% UI similarity. Intercepts UPI transactions and redirects funds.", date: "Apr 8, 2026" },
];

const s = {
  page: { paddingTop: 60, minHeight: "100vh" },
  header: { padding: "3rem 2rem 2rem", maxWidth: 1080, margin: "0 auto" },
  tag: { fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" },
  title: { fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6, fontFamily: "var(--font-display)" },
  sub: { color: "var(--text2)", fontSize: "0.88rem", lineHeight: 1.65, marginBottom: "2rem" },
  headerActions: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  liveIndicator: { display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--accent5)" },
  liveDot: { width: 6, height: 6, borderRadius: "50%", background: "var(--accent5)", animation: "pulse 1.5s infinite" },
  reportBtn: {
    padding: "9px 18px", borderRadius: 9,
    background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.25)",
    color: "var(--accent2)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.86rem",
    cursor: "pointer", transition: "all 0.2s",
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
    gap: "1rem", maxWidth: 1080, margin: "0 auto", padding: "0 2rem 4rem",
  },
  card: {
    borderRadius: 14, padding: "1.3rem", transition: "all 0.25s",
    position: "relative", overflow: "hidden",
  },
  cardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" },
  riskPill: { padding: "3px 11px", borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: "0.67rem", fontWeight: 600 },
  scoreNum: { fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 700 },
  target: { fontWeight: 700, fontSize: "0.93rem", marginBottom: 5, wordBreak: "break-all", fontFamily: "var(--font-display)" },
  category: { display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--text3)", fontFamily: "var(--font-mono)", marginBottom: "0.8rem" },
  finding: { fontSize: "0.81rem", color: "var(--text2)", lineHeight: 1.65, marginBottom: "1rem" },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text3)", fontFamily: "var(--font-mono)" },
  anonDot: { width: 5, height: 5, borderRadius: "50%", background: "var(--accent5)", display: "inline-block", marginRight: 5, animation: "pulse 2s infinite" },
  empty: { textAlign: "center", padding: "4rem 2rem", color: "var(--text3)", fontFamily: "var(--font-mono)" },
  loading: { textAlign: "center", padding: "4rem", color: "var(--text3)", fontFamily: "var(--font-mono)" },
};

function ReportCard({ report }) {
  const risk = (report.risk || report.scanRisk || "MEDIUM").toUpperCase();
  const rc = RISK_COLORS[risk] || RISK_COLORS.MEDIUM;
  const score = report.score ?? report.scanScore ?? "—";
  const catIcon = CAT_ICONS[report.category] || "⚠️";
  const finding = report.finding || report.details || (report.findings?.length ? report.findings[0] : "Reported by community.");
  const date = report.date || (report.reportedAt ? new Date(report.reportedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

  return (
    <div style={{ ...s.card, background: rc.bg, border: `1px solid ${rc.border}` }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 6px 24px ${rc.bg}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: rc.accent }} />

      <div style={s.cardTop}>
        <span style={{ ...s.riskPill, background: rc.bg, color: rc.accent, border: `1px solid ${rc.border}` }}>{rc.label}</span>
        <span style={{ ...s.scoreNum, color: rc.accent }}>
          {score !== "—" ? score : "—"}
          {score !== "—" && <span style={{ fontSize: "0.58rem", opacity: 0.6 }}>/100</span>}
        </span>
      </div>

      <div style={s.target}>{report.target}</div>
      <div style={s.category}>
        <span>{catIcon}</span>
        <span>{report.categoryLabel || report.category}</span>
      </div>
      <div style={s.finding}>{finding}</div>
      <div style={s.cardFooter}>
        <span><span style={s.anonDot} />Anonymous</span>
        <span>{date}</span>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loadingFb, setLoadingFb] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const reportsRef = ref(db, "reports");
    const unsub = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      const live = [];
      if (data && typeof data === "object") {
        Object.entries(data).reverse().forEach(([key, val]) => {
          if (val && typeof val === "object") live.push({ id: key, ...val });
        });
      }
      const all = [...live, ...STATIC_REPORTS];
      setReports(all);
      setTotal(all.length);
      setLoadingFb(false);
    }, (err) => {
      console.warn("Firebase onValue error:", err);
      setReports(STATIC_REPORTS);
      setTotal(STATIC_REPORTS.length);
      setLoadingFb(false);
    });
    return () => unsub();
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.tag}>Community Intelligence</div>
        <h2 style={s.title}>Reported by the Community</h2>
        <div style={s.headerActions}>
          <p style={{ ...s.sub, margin: 0, maxWidth: 500 }}>
            Anonymous threat reports submitted by SafeTrace users — live-synced from Firebase Realtime Database. {total > 0 && <strong style={{ color: "var(--accent)" }}>{total} reports</strong>}
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={s.liveIndicator}>
              <span style={s.liveDot} />
              Live Firebase Feed
            </div>
            <button style={s.reportBtn} onClick={() => setShowModal(true)}
              onMouseEnter={e => { e.target.style.background = "rgba(255,77,109,0.16)"; }}
              onMouseLeave={e => { e.target.style.background = "rgba(255,77,109,0.08)"; }}>
              🚨 Report a Scam
            </button>
          </div>
        </div>
      </div>

      {loadingFb ? (
        <div style={s.loading}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          Loading Firebase reports...
        </div>
      ) : reports.length === 0 ? (
        <div style={s.empty}>No reports yet. Be the first to report a scam.</div>
      ) : (
        <div style={s.grid}>
          {reports.map((r) => <ReportCard key={r.id || r.target} report={r} />)}
        </div>
      )}

      {showModal && <ReportModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
