import React, { useEffect, useState } from "react";
import { getClaudeVerdict } from "../services/api";
import { useApp } from "../App";

const RISK_COLORS = {
  HIGH:   { accent: "var(--accent2)", bg: "rgba(255,77,109,0.07)", border: "rgba(255,77,109,0.28)", glow: "rgba(255,77,109,0.12)" },
  MEDIUM: { accent: "var(--accent3)", bg: "rgba(255,184,48,0.07)",  border: "rgba(255,184,48,0.28)",  glow: "rgba(255,184,48,0.1)" },
  LOW:    { accent: "var(--accent5)", bg: "rgba(0,229,160,0.07)", border: "rgba(0,229,160,0.28)", glow: "rgba(0,229,160,0.1)" },
};

const ICONS = { HIGH: "☠️", MEDIUM: "⚠️", LOW: "✅" };
const TITLES = { HIGH: "⛔ HIGH RISK DETECTED", MEDIUM: "⚠️ MEDIUM RISK DETECTED", LOW: "✅ APPEARS SAFE" };
const CLOSE_LABELS = { HIGH: "Do NOT Install — Leave Now", MEDIUM: "Understood — Proceed Carefully", LOW: "Clear — Looks Safe" };

function buildReasons(data) {
  const risk = data.risk;
  if (risk === "LOW") return [
    { icon: "✅", text: "No dangerous permissions — doesn't request SMS, Contacts, or Microphone access." },
    { icon: "🏷️", text: "No brand impersonation pattern detected against 200+ known Indian financial apps." },
    { icon: "🌐", text: "Network indicators appear clean with no known C2 infrastructure." },
    { icon: "🔒", text: "Permission footprint is consistent with a legitimate utility application." },
  ];
  if (risk === "MEDIUM") return [
    { icon: "🔍", text: "Verify developer identity on the official Play Store before installing." },
    { icon: "🛑", text: "Do not grant SMS or Contacts permissions unless absolutely necessary." },
    { icon: "📶", text: "Use only on trusted Wi-Fi — not public hotspots." },
    { icon: "🔄", text: "Check user reviews and reports on cybercrime.gov.in first." },
  ];
  const reasons = [];
  (data.findings || []).slice(0, 4).forEach((f) => {
    if (f.includes("SMS") || f.includes("permission")) reasons.push({ icon: "📲", text: "Requests dangerous permissions that can steal OTPs and personal data silently." });
    else if (f.includes("impersonation") || f.includes("brand")) reasons.push({ icon: "🎭", text: "Mimics a trusted Indian financial app — classic phishing technique." });
    else if (f.includes("URL") || f.includes("C2") || f.includes("Embedded")) reasons.push({ icon: "🔗", text: "Contains hidden server addresses sending your data to attacker infrastructure." });
    else if (f.includes("admin") || f.includes("Device")) reasons.push({ icon: "💀", text: "Requests device admin rights — enables persistent backdoor even after uninstall." });
    else if (f.includes("campaign") || f.includes("Campaign")) reasons.push({ icon: "🕸️", text: "Linked to an active fraud campaign targeting Indian UPI users." });
    else reasons.push({ icon: "⚡", text: f });
  });
  if (reasons.length < 2) reasons.push({ icon: "🚫", text: "Characteristics match active fraud campaigns reported to CERT-In India." });
  return reasons.slice(0, 4);
}

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9000,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(10,11,13,0.92)", backdropFilter: "blur(14px)",
    animation: "fadeIn 0.22s ease",
  },
  popup: {
    maxWidth: 540, width: "92%", borderRadius: 20,
    overflow: "hidden", maxHeight: "90vh", overflowY: "auto",
    animation: "fadeUp 0.32s cubic-bezier(0.34,1.56,0.64,1)",
    boxShadow: "0 0 80px rgba(0,0,0,0.8)",
  },
  topBand: { padding: "1.8rem 2rem 1.4rem", textAlign: "center" },
  iconWrap: {
    width: 68, height: 68, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "2rem", margin: "0 auto 0.9rem",
  },
  title: { fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em", marginBottom: 5, fontFamily: "var(--font-display)" },
  subtitle: { fontSize: "0.79rem", opacity: 0.65, fontFamily: "var(--font-mono)" },
  scoreRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "1.5rem", padding: "1.1rem 2rem",
    background: "rgba(0,0,0,0.18)", borderTop: "1px solid", borderBottom: "1px solid",
  },
  scoreNum: { fontFamily: "var(--font-mono)", fontSize: "3.2rem", fontWeight: 700, lineHeight: 1 },
  scoreLabel: { fontSize: "0.72rem", opacity: 0.65, marginTop: 4, fontFamily: "var(--font-mono)" },
  body: { padding: "1.4rem 2rem" },
  sectionLabel: { fontFamily: "var(--font-mono)", fontSize: "0.64rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.7rem" },
  reasonItem: {
    display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px",
    borderRadius: 9, marginBottom: 7, fontSize: "0.81rem", lineHeight: 1.55,
  },
  verdictBox: { borderRadius: 11, padding: "0.9rem 1rem", marginTop: "1.1rem", marginBottom: "1.1rem", border: "1px solid" },
  verdictLabel: { fontFamily: "var(--font-mono)", fontSize: "0.63rem", letterSpacing: "0.08em", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 },
  verdictText: { fontSize: "0.82rem", lineHeight: 1.68, color: "var(--text2)" },
  closeBtn: {
    width: "100%", padding: "12px", borderRadius: 11, border: "none",
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.93rem",
    cursor: "pointer", transition: "all 0.2s",
  },
  viewBtn: {
    width: "100%", padding: "9px", borderRadius: 11, marginTop: 7,
    background: "transparent", border: "1px solid var(--border2)",
    color: "var(--text2)", fontFamily: "var(--font-display)", fontSize: "0.84rem",
    cursor: "pointer",
  },
};

export default function RiskPopup({ data, onClose, onViewResults }) {
  const { apiKey } = useApp();
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(true);
  const rc = RISK_COLORS[data.risk] || RISK_COLORS.MEDIUM;

  useEffect(() => {
    setAiLoading(true);
    setAiText("");

    const fetchVerdict = async () => {
      if (apiKey) {
        try {
          const text = await getClaudeVerdict(data, apiKey);
          setAiText(text);
        } catch {
          setAiText("Verdict unavailable — refer to findings below.");
        }
      } else {
        const fallbacks = {
          HIGH: `This ${data.name} exhibits multiple hallmarks of active Indian UPI fraud: dangerous permission combinations, C2 infrastructure, and brand impersonation. Installing this APK puts your UPI PIN, OTPs, and bank credentials at immediate risk — delete it and report at cybercrime.gov.in.`,
          MEDIUM: `This file shows some suspicious characteristics worth investigating before proceeding. Verify the developer on the official Play Store and avoid granting sensitive permissions like SMS or Contacts.`,
          LOW: `No significant threat indicators detected. The permission profile and network fingerprint are consistent with a legitimate application — it appears safe to proceed.`,
        };
        setAiText(fallbacks[data.risk] || "Analysis unavailable.");
      }
      setAiLoading(false);
    };

    fetchVerdict();
  }, [data, apiKey]);

  const reasons = buildReasons(data);

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.popup, background: "var(--surface)", border: `1px solid ${rc.border}`, boxShadow: `0 0 80px ${rc.glow}, 0 24px 80px rgba(0,0,0,0.8)` }}>

        <div style={{ ...s.topBand, background: rc.bg }}>
          <div style={{ ...s.iconWrap, background: `${rc.bg}`, border: `2px solid ${rc.border}` }}>
            {ICONS[data.risk]}
          </div>
          <div style={{ ...s.title, color: rc.accent }}>{TITLES[data.risk]}</div>
          <div style={s.subtitle}>{data.name}</div>
        </div>

        <div style={{ ...s.scoreRow, borderColor: rc.border }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ ...s.scoreNum, color: rc.accent }}>{Math.round(data.score || data.threat_score || 0)}</div>
            <div style={{ ...s.scoreLabel, fontFamily: "var(--font-mono)" }}>/100 THREAT SCORE</div>
          </div>
          <div style={{ width: 1, height: 55, background: rc.border }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "1.35rem", color: rc.accent, fontFamily: "var(--font-display)" }}>{data.risk}</div>
            <div style={{ ...s.scoreLabel, fontFamily: "var(--font-mono)" }}>RISK LEVEL</div>
          </div>
          {data.cluster_analysis?.cluster_detected && (
            <>
              <div style={{ width: 1, height: 55, background: rc.border }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--accent4)", fontFamily: "var(--font-display)" }}>CLUSTERED</div>
                <div style={{ ...s.scoreLabel, fontFamily: "var(--font-mono)" }}>FRAUD CAMPAIGN</div>
              </div>
            </>
          )}
        </div>

        <div style={s.body}>
          <div style={{ ...s.sectionLabel, color: rc.accent }}>
            {data.risk === "HIGH" ? "WHY YOU SHOULD NOT DOWNLOAD THIS" : data.risk === "MEDIUM" ? "PRECAUTIONS BEFORE PROCEEDING" : "WHY THIS APPEARS SAFE"}
          </div>

          {reasons.map((r, i) => (
            <div key={i} style={{ ...s.reasonItem, background: rc.bg, border: `1px solid ${rc.border}` }}>
              <span style={{ fontSize: "0.95rem", flexShrink: 0 }}>{r.icon}</span>
              <span style={{ color: "var(--text2)" }}>{r.text}</span>
            </div>
          ))}

          {data.cluster_analysis?.cluster_detected && (
            <div style={{ marginTop: 10, padding: "9px 13px", borderRadius: 9, background: "rgba(124,92,252,0.07)", border: "1px solid rgba(124,92,252,0.25)", fontSize: "0.79rem" }}>
              <span style={{ color: "var(--accent4)", fontFamily: "var(--font-mono)", fontSize: "0.64rem", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>DBSCAN Cluster Match</span>
              <strong style={{ color: "var(--accent4)" }}>{data.cluster_analysis.cluster_id}</strong>
              <span style={{ color: "var(--text2)", marginLeft: 7 }}>({data.cluster_analysis.campaign_samples} samples • {data.cluster_analysis.active_since})</span>
            </div>
          )}

          <div style={{ ...s.verdictBox, background: "rgba(0,194,255,0.03)", borderColor: "rgba(0,194,255,0.18)" }}>
            <div style={{ ...s.verdictLabel, color: "var(--accent)" }}>
              <span>🔎</span>
              <span>SECURITY VERDICT</span>
              {!apiKey && <span style={{ color: "var(--text3)", fontSize: "0.6rem" }}>(set key for full analysis)</span>}
            </div>
            {aiLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text3)", fontFamily: "var(--font-mono)", fontSize: "0.76rem" }}>
                <div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
                Generating verdict...
              </div>
            ) : (
              <div style={s.verdictText}>{aiText}</div>
            )}
          </div>

          {data.ml_models_used && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.63rem", color: "var(--text3)", marginBottom: "0.9rem" }}>
              Analyzed by: {data.ml_models_used.join(" · ")}
            </div>
          )}

          <button
            style={{ ...s.closeBtn, background: `linear-gradient(135deg, ${rc.accent}, ${data.risk === "HIGH" ? "#ff7a90" : data.risk === "MEDIUM" ? "#ffd070" : "var(--accent)"})`, color: data.risk === "LOW" ? "#000" : "#fff" }}
            onClick={onClose}
          >
            {CLOSE_LABELS[data.risk]}
          </button>
          <button style={s.viewBtn} onClick={onViewResults}>
            📊 View Full Report ↓
          </button>
        </div>
      </div>
    </div>
  );
}
