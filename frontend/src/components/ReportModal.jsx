import React, { useState } from "react";
import { db, ref, push } from "../services/firebase";
import { useApp } from "../App";

const CATEGORIES = [
  { value: "phishing", label: "Phishing / Fake Login Page", icon: "🎣" },
  { value: "fake_apk", label: "Fake APK / Malicious App", icon: "📦" },
  { value: "kyc_fraud", label: "KYC / Aadhaar Fraud", icon: "🪪" },
  { value: "upi_fraud", label: "UPI / Payment Fraud", icon: "💸" },
  { value: "loan_scam", label: "Fake Loan / Investment App", icon: "🏦" },
  { value: "brand_impersonation", label: "Brand Impersonation", icon: "🎭" },
  { value: "other", label: "Other", icon: "⚠️" },
];

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 8000,
    background: "rgba(10,11,13,0.88)", backdropFilter: "blur(14px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    animation: "fadeIn 0.2s ease",
  },
  modal: {
    background: "var(--surface)", border: "1px solid var(--border2)",
    borderRadius: 18, padding: 0, maxWidth: 460, width: "92%",
    overflow: "hidden", maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 0 70px rgba(255,77,109,0.08), 0 20px 60px rgba(0,0,0,0.7)",
    animation: "fadeUp 0.28s cubic-bezier(0.34,1.56,0.64,1)",
  },
  header: {
    background: "linear-gradient(135deg, rgba(255,77,109,0.08), rgba(255,77,109,0.03))",
    borderBottom: "1px solid var(--border)", padding: "1.4rem 1.8rem",
  },
  title: { fontWeight: 800, fontSize: "1.1rem", marginBottom: 4, fontFamily: "var(--font-display)" },
  sub: { color: "var(--text2)", fontSize: "0.8rem", lineHeight: 1.6 },
  body: { padding: "1.4rem 1.8rem" },
  label: { fontFamily: "var(--font-mono)", fontSize: "0.64rem", color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 7 },
  input: {
    width: "100%", padding: "10px 13px", borderRadius: 9,
    background: "var(--bg3)", border: "1px solid var(--border2)",
    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.87rem",
    outline: "none", marginBottom: "1.1rem", transition: "border-color 0.2s",
  },
  select: {
    width: "100%", padding: "10px 13px", borderRadius: 9,
    background: "var(--bg3)", border: "1px solid var(--border2)",
    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.87rem",
    outline: "none", marginBottom: "1.1rem", cursor: "pointer",
  },
  textarea: {
    width: "100%", padding: "10px 13px", borderRadius: 9,
    background: "var(--bg3)", border: "1px solid var(--border2)",
    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "0.87rem",
    outline: "none", marginBottom: "1.1rem", minHeight: 84, resize: "vertical",
  },
  btnRow: { display: "flex", gap: 9 },
  submitBtn: {
    flex: 1, padding: "11px", borderRadius: 9, border: "none",
    background: "linear-gradient(135deg, var(--accent2), #ff7a90)",
    color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem",
    cursor: "pointer", transition: "opacity 0.2s",
  },
  cancelBtn: {
    padding: "11px 18px", borderRadius: 9,
    background: "transparent", border: "1px solid var(--border2)",
    color: "var(--text2)", fontFamily: "var(--font-body)", fontSize: "0.87rem",
    cursor: "pointer",
  },
};

export default function ReportModal({ onClose, prefillTarget = "" }) {
  const { showToast } = useApp();
  const [target, setTarget] = useState(prefillTarget);
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!target.trim()) { showToast("⚠ Enter a URL or app name", "error"); return; }
    if (!category) { showToast("⚠ Select a category", "error"); return; }
    setLoading(true);
    try {
      const payload = {
        target: target.trim(),
        category,
        categoryLabel: CATEGORIES.find(c => c.value === category)?.label || category,
        details: details.trim() || null,
        email: email.trim() || null,
        reportedAt: new Date().toISOString(),
        risk: "MEDIUM",
      };
      await push(ref(db, "reports"), payload);
      showToast("✅ Report submitted — thank you for keeping India safe!", "success");
      onClose();
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to submit — please try again", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.title}>🚨 Report Suspicious App / Website</div>
          <div style={s.sub}>Your anonymous report is saved to Firebase and flagged for CERT-In review.</div>
        </div>
        <div style={s.body}>
          <label style={s.label}>URL or App Name</label>
          <input style={s.input} value={target} onChange={e => setTarget(e.target.value)} placeholder="https://suspicious-site.xyz or FakeApp.apk" />

          <label style={s.label}>Category</label>
          <select style={s.select} value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Select category...</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
          </select>

          <label style={s.label}>Additional Details (optional)</label>
          <textarea style={s.textarea} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe what you encountered..." />

          <label style={s.label}>Your Email (optional)</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />

          <div style={s.btnRow}>
            <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={{ ...s.submitBtn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "🚨 Submit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
