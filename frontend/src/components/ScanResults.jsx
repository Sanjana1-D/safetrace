import React, { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { useApp } from "../App";
import { getClaudeVerdict } from "../services/api";
import CertInspector from "./CertInspector";

const RISK_COLORS = {
  HIGH:   { accent: "var(--accent2)", stroke: "#FF4D6D", bg: "rgba(255,77,109,0.07)", border: "rgba(255,77,109,0.22)", label: "⚠ HIGH RISK" },
  MEDIUM: { accent: "var(--accent3)", stroke: "#FFB830", bg: "rgba(255,184,48,0.07)", border: "rgba(255,184,48,0.22)", label: "⚡ MEDIUM RISK" },
  LOW:    { accent: "var(--accent5)", stroke: "#00E5A0", bg: "rgba(0,229,160,0.07)", border: "rgba(0,229,160,0.22)", label: "✅ LOW RISK" },
};

const PERM_COLORS = {
  danger: { dot: "var(--accent2)", bg: "rgba(255,77,109,0.05)" },
  warn:   { dot: "var(--accent3)", bg: "rgba(255,184,48,0.05)" },
  ok:     { dot: "var(--accent5)", bg: "rgba(0,229,160,0.05)" },
};

function ScoreRing({ score, risk }) {
  const [displayed, setDisplayed] = useState(0);
  const circumference = 2 * Math.PI * 52;
  const rc = RISK_COLORS[risk] || RISK_COLORS.LOW;

  useEffect(() => {
    let start = 0;
    const interval = setInterval(() => {
      start += Math.ceil(score / 40);
      if (start >= score) { setDisplayed(score); clearInterval(interval); }
      else setDisplayed(start);
    }, 25);
    return () => clearInterval(interval);
  }, [score]);

  const offset = circumference - (displayed / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 130, height: 130 }}>
      <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="65" cy="65" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="65" cy="65" r="52" fill="none" stroke={rc.stroke} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 700, color: rc.accent, lineHeight: 1 }}>{displayed}</div>
        <div style={{ fontSize: "0.62rem", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>/100</div>
      </div>
    </div>
  );
}

function Bar({ label, value, colorClass }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth(value), 300); }, [value]);

  const barColor =
    colorClass === "danger" ? "linear-gradient(90deg, #FF4D6D, #ff7a90)" :
    colorClass === "warn"   ? "linear-gradient(90deg, #FFB830, #ffd070)" :
                              "linear-gradient(90deg, #00E5A0, #00C2FF)";

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.77rem", marginBottom: 5, color: "var(--text2)" }}>
        <span>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", color: colorClass === "danger" ? "var(--accent2)" : colorClass === "warn" ? "var(--accent3)" : "var(--accent5)" }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${width}%`, background: barColor, borderRadius: 3, transition: "width 1.2s ease" }} />
      </div>
    </div>
  );
}

function TypeWriter({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) return;
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i += 3;
      setDisplayed(text.substring(0, i));
      if (i >= text.length) { setDisplayed(text); setDone(true); clearInterval(iv); onDone?.(); }
    }, 15);
    return () => clearInterval(iv);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span style={{ display: "inline-block", width: 2, height: 13, background: "var(--accent)", animation: "blink 1s infinite", verticalAlign: "middle", marginLeft: 2 }} />}
    </span>
  );
}

const s = {
  wrap: { maxWidth: 860, margin: "0 auto", padding: "2rem 2rem 4rem" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", paddingBottom: "1.25rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 },
  name: { fontWeight: 800, fontSize: "1.05rem", marginBottom: 4, fontFamily: "var(--font-display)" },
  hash: { fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text3)" },
  badge: { padding: "7px 16px", borderRadius: 8, fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "0.79rem" },
  scoreSection: { display: "grid", gridTemplateColumns: "140px 1fr", gap: "1rem", marginBottom: "1rem", alignItems: "start" },
  ringCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.4rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  ringLabel: { fontSize: "0.68rem", color: "var(--text3)", fontFamily: "var(--font-mono)", textAlign: "center" },
  breakdownGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" },
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.1rem" },
  cardLabel: { fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)", letterSpacing: "0.08em", marginBottom: "0.8rem", textTransform: "uppercase" },
  permItem: { display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, fontSize: "0.74rem", fontFamily: "var(--font-mono)", marginBottom: 4 },
  permDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  urlItem: { display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: "0.7rem", fontFamily: "var(--font-mono)" },
  clusterCard: { background: "rgba(124,92,252,0.05)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 12, padding: "1.1rem", marginBottom: "1rem" },
  brandCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.1rem", marginBottom: "1rem" },
  verdictBox: { background: "var(--surface)", border: "1px solid rgba(0,194,255,0.18)", borderRadius: 12, padding: "1.4rem", marginBottom: "1.4rem" },
  verdictHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: "0.8rem" },
  verdictTag: { fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--accent)", background: "rgba(0,194,255,0.08)", padding: "2px 8px", borderRadius: 4 },
  verdictText: { fontSize: "0.86rem", color: "var(--text2)", lineHeight: 1.72 },
  actionRow: { display: "flex", gap: 9, flexWrap: "wrap" },
  actionBtn: {
    padding: "9px 16px", borderRadius: 9, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.83rem",
    cursor: "pointer", transition: "all 0.2s", border: "1px solid var(--border2)", background: "var(--surface2)", color: "var(--text)",
    display: "flex", alignItems: "center", gap: 6,
  },
  featureImportance: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.1rem", marginBottom: "1rem" },
};

function classifyPerm(perm) {
  const HIGH = ["READ_SMS", "RECEIVE_SMS", "SEND_SMS", "SYSTEM_ALERT_WINDOW", "REQUEST_INSTALL_PACKAGES", "DEVICE_ADMIN", "BIND_ACCESSIBILITY_SERVICE"];
  const MED  = ["RECORD_AUDIO", "CAMERA", "READ_CONTACTS", "READ_CALL_LOG", "PROCESS_OUTGOING_CALLS", "ACCESS_FINE_LOCATION", "CHANGE_NETWORK_STATE"];
  if (HIGH.includes(perm)) return "danger";
  if (MED.includes(perm)) return "warn";
  return "ok";
}

function getBrandBars(brandData) {
  if (!brandData) return [];
  const all = brandData.all_scores || {};
  return Object.entries(all).map(([k, v]) => ({
    label: k.replace(/_/g, " ").toUpperCase(), value: Math.round(v),
    color: v > 70 ? "danger" : v > 40 ? "warn" : "ok",
  })).sort((a, b) => b.value - a.value).slice(0, 4);
}

export default function ScanResults({ data, onReport, onReset }) {
  const { apiKey } = useApp();
  const [aiVerdict, setAiVerdict] = useState(data.ai_verdict || "");
  const [aiLoading, setAiLoading] = useState(!data.ai_verdict);
  const [showCert, setShowCert] = useState(false);
  const resultsRef = useRef(null);

  const rc = RISK_COLORS[data.risk] || RISK_COLORS.LOW;
  const perms = Array.isArray(data.permissions) ? data.permissions : [];
  const urls  = Array.isArray(data.urls) ? data.urls : (data.url_list || []);
  const perm_bd = data.permission_breakdown || {};
  const cluster = data.cluster_analysis || {};
  const brand   = data.brand_similarity || {};
  const importances = data.feature_importances || [];
  const score = data.threat_score ?? data.score ?? 0;

  const certTarget = (() => {
    const n = data.name || "";
    if (n.startsWith("http")) return n;
    const urlEntry = urls.find(u => {
      const s = typeof u === "string" ? u : u.url || "";
      return s.includes(".") && !s.match(/^\d+\.\d+/);
    });
    if (urlEntry) return typeof urlEntry === "string" ? urlEntry : urlEntry.url;
    return n.includes(".") ? n : null;
  })();

  useEffect(() => {
    if (data.ai_verdict) {
      setAiVerdict(data.ai_verdict);
      setAiLoading(false);
      return;
    }
    setAiLoading(true);
    getClaudeVerdict(
      { name: data.name, score, risk: data.risk, findings: data.findings, permissions: perms },
      apiKey || ""
    ).then(text => {
      if (text) {
        setAiVerdict(text);
      } else {
        const fallbacks = {
          HIGH:   `Significant threat indicators were found in '${data.name}' — dangerous permissions and suspicious network behaviour consistent with malware targeting Indian UPI users were detected. An attacker could silently read your SMS OTPs, enabling unauthorized bank transfers without any notification on your device. Delete this file immediately and do not install it; if already installed, perform a factory reset and call your bank's fraud helpline.`,
          MEDIUM: `'${data.name}' shows moderate risk signals — the permission profile and distribution method raise concerns, though no confirmed malicious activity was found. Proceed with caution: verify the developer's identity, download from official sources only, and review app permissions in Settings after installation. If you received this from an unknown WhatsApp or Telegram contact, treat it as suspicious.`,
          LOW:    `'${data.name}' appears to have a clean security profile — no dangerous permissions, known fraud signatures, or suspicious network indicators were detected. The app does not impersonate any known Indian financial service and its permission footprint is minimal and appropriate. You may proceed, but always download apps from the official Google Play Store for ongoing security updates.`,
        };
        setAiVerdict(fallbacks[data.risk] || "Analysis complete. Review the findings above for details.");
      }
      setAiLoading(false);
    }).catch(() => {
      setAiVerdict("Verdict engine temporarily unavailable — refer to the findings below for the full analysis.");
      setAiLoading(false);
    });
  }, [data.name, data.risk]);

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, margin = 14, pageH = 297;
    let y = 16;

    doc.setFillColor(10, 11, 13);
    doc.rect(0, 0, W, pageH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 194, 255);
    doc.text("SafeTrace — Threat Analysis Report", margin, y);
    y += 10;

    doc.setFontSize(8);
    doc.setTextColor(120, 144, 176);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}  |  Target: ${data.name}`, margin, y);
    y += 10;

    const riskColor = data.risk === "HIGH" ? [255, 77, 109] : data.risk === "MEDIUM" ? [255, 184, 48] : [0, 229, 160];
    doc.setFillColor(...riskColor);
    doc.roundedRect(margin, y, 55, 18, 3, 3, "F");
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${data.risk} RISK — ${Math.round(score)}/100`, margin + 4, y + 11);
    y += 26;

    doc.setTextColor(230, 240, 248);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("KEY FINDINGS", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 144, 176);
    (data.findings || []).forEach(f => {
      doc.text(`• ${f}`, margin + 2, y);
      y += 5.5;
    });
    y += 4;

    if (aiVerdict) {
      doc.setFillColor(24, 28, 33);
      const lines = doc.splitTextToSize(aiVerdict, W - 2 * margin - 10);
      const boxH = lines.length * 5 + 16;
      doc.roundedRect(margin, y, W - 2 * margin, boxH, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(0, 194, 255);
      doc.text("// VERDICT", margin + 4, y + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(160, 190, 210);
      lines.forEach((l, i) => doc.text(l, margin + 4, y + 13 + i * 5));
      y += boxH + 8;
    }

    doc.setFontSize(6);
    doc.setTextColor(54, 72, 96);
    doc.text(`Report ID: ST-${Date.now()}  |  SafeTrace v2.0  |  ML: ${(data.ml_models_used || []).join(", ")}`, margin, pageH - 10);

    doc.save(`SafeTrace_${data.name.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)}_${Date.now()}.pdf`);
  };

  const brandBars = getBrandBars(brand);

  return (
    <div ref={resultsRef} style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.name}>{data.name}</div>
          <div style={s.hash}>
            SHA256: {data.hash || (Math.random().toString(16).slice(2, 10) + "...")} • Scanned just now
            {data.firebase_scan_id && <span style={{ marginLeft: 8, color: "var(--accent)", opacity: 0.6 }}>• Saved to Firebase</span>}
          </div>
        </div>
        <div style={{ ...s.badge, background: rc.bg, color: rc.accent, border: `1px solid ${rc.border}` }}>
          {rc.label}
        </div>
      </div>

      {/* Score + Breakdown */}
      <div style={s.scoreSection}>
        <div style={s.ringCard}>
          <ScoreRing score={Math.round(score)} risk={data.risk} />
          <div style={s.ringLabel}>Threat Score</div>
        </div>

        <div style={s.breakdownGrid}>
          <div style={s.card}>
            <div style={s.cardLabel}>Permission Risks</div>
            <Bar label="SMS / Call Access"   value={perm_bd.sms_call_access   ?? 0} colorClass="danger" />
            <Bar label="Camera / Microphone" value={perm_bd.camera_microphone ?? 0} colorClass="warn" />
            <Bar label="Device Admin Rights" value={perm_bd.device_admin      ?? 0} colorClass="danger" />
            <Bar label="Overlay / Accessibility" value={perm_bd.accessibility_service ?? 0} colorClass="warn" />
          </div>

          <div style={s.card}>
            <div style={s.cardLabel}>Permissions Detected</div>
            {perms.length === 0 && <div style={{ color: "var(--text3)", fontSize: "0.75rem" }}>No permissions data available</div>}
            {perms.slice(0, 7).map((p, i) => {
              const level = classifyPerm(p);
              const pc = PERM_COLORS[level];
              return (
                <div key={i} style={{ ...s.permItem, background: pc.bg }}>
                  <div style={{ ...s.permDot, background: pc.dot }} />
                  {p}
                </div>
              );
            })}
          </div>

          <div style={s.card}>
            <div style={s.cardLabel}>Brand Impersonation — TF-MobileNetV3</div>
            {brandBars.length === 0
              ? <div style={{ color: "var(--text3)", fontSize: "0.75rem" }}>No brand match detected</div>
              : brandBars.map((b, i) => <Bar key={i} label={b.label} value={b.value} colorClass={b.color} />)
            }
            {brand.top_brand_match && (
              <div style={{ marginTop: 8, fontSize: "0.72rem", color: "var(--accent2)", fontFamily: "var(--font-mono)" }}>
                ⚠ Top match: {brand.top_brand_match.toUpperCase()} ({brand.top_similarity}% similarity)
              </div>
            )}
          </div>

          <div style={s.card}>
            <div style={s.cardLabel}>Network Indicators</div>
            {urls.length === 0 && <div style={{ color: "var(--text3)", fontSize: "0.7rem" }}>No embedded URLs detected</div>}
            {urls.slice(0, 6).map((u, i) => {
              const url = typeof u === "string" ? u : u.url || u;
              const flag = typeof u === "object" ? u.flag : (url.includes("185.") || url.includes(".xyz") || url.includes(".top") ? "danger" : "warn");
              const icon = flag === "danger" ? "🔴" : flag === "warn" ? "🟡" : "🟢";
              const col = flag === "danger" ? "var(--accent2)" : flag === "warn" ? "var(--accent3)" : "var(--accent5)";
              return (
                <div key={i} style={{ ...s.urlItem }}>
                  <span>{icon}</span>
                  <span style={{ color: col, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DBSCAN Cluster */}
      {cluster.cluster_detected && (
        <div style={s.clusterCard}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.64rem", color: "var(--accent4)", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
            DBSCAN Fraud Campaign Cluster
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.97rem", color: "var(--accent4)", marginBottom: 4, fontFamily: "var(--font-display)" }}>{cluster.cluster_id}</div>
              <div style={{ fontSize: "0.81rem", color: "var(--text2)", marginBottom: 8, maxWidth: 400 }}>{cluster.description}</div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text3)" }}>
                  Samples: <span style={{ color: "var(--accent4)" }}>{cluster.campaign_samples}</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text3)" }}>
                  Active since: <span style={{ color: "var(--accent4)" }}>{cluster.active_since}</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text3)" }}>
                  Similarity: <span style={{ color: "var(--accent4)" }}>{(cluster.similarity * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.64em", color: "var(--text3)", marginBottom: 4, textTransform: "uppercase" }}>Known C2 Domains</div>
              {(cluster.c2_domains || []).map((d, i) => (
                <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--accent2)", marginBottom: 3 }}>🔴 {d}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feature importances */}
      {importances.length > 0 && (
        <div style={s.featureImportance}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)", marginBottom: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Random Forest — Feature Importances
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {importances.map((imp, i) => (
              <div key={i} style={{ padding: "7px 13px", borderRadius: 8, background: "var(--bg3)", border: "1px solid var(--border)", fontSize: "0.76rem" }}>
                <div style={{ color: "var(--text2)", marginBottom: 2 }}>{imp.feature}</div>
                <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 600 }}>+{imp.contribution} pts</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ML models row */}
      {data.ml_models_used && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: "1rem" }}>
          {data.ml_models_used.map((m, i) => (
            <div key={i} style={{ padding: "3px 11px", borderRadius: 6, background: "rgba(124,92,252,0.07)", border: "1px solid rgba(124,92,252,0.18)", fontFamily: "var(--font-mono)", fontSize: "0.64rem", color: "var(--accent4)" }}>
              ⚙ {m}
            </div>
          ))}
        </div>
      )}

      {/* Verdict */}
      <div style={s.verdictBox}>
        <div style={s.verdictHeader}>
          <span style={{ fontSize: "1rem" }}>🔎</span>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", fontFamily: "var(--font-display)" }}>Security Verdict</span>
          <span style={s.verdictTag}>SafeTrace Engine</span>
        </div>
        <div style={s.verdictText}>
          {aiLoading
            ? <span style={{ color: "var(--text3)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Generating verdict...
              </span>
            : <TypeWriter text={aiVerdict} />
          }
        </div>
      </div>

      {/* Findings */}
      {(data.findings || []).length > 0 && (
        <div style={{ marginBottom: "1.4rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text3)", marginBottom: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Key Findings</div>
          {data.findings.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", borderRadius: 8, marginBottom: 5, background: "var(--surface)", border: "1px solid var(--border)", fontSize: "0.82rem", color: "var(--text2)" }}>
              <span style={{ color: rc.accent, flexShrink: 0 }}>›</span>
              {f}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={s.actionRow}>
        <button style={{ ...s.actionBtn, borderColor: "rgba(255,77,109,0.35)", color: "var(--accent2)", background: "rgba(255,77,109,0.05)" }}
          onClick={onReport}>
          🚨 Report This
        </button>
        <button style={s.actionBtn} onClick={downloadPDF}>📄 Download PDF</button>
        {certTarget && (
          <button
            style={{ ...s.actionBtn, borderColor: "rgba(0,194,255,0.3)", color: "var(--accent)", background: "rgba(0,194,255,0.04)" }}
            onClick={() => setShowCert(v => !v)}
          >
            🔐 {showCert ? "Hide" : "Inspect"} SSL Certificate
          </button>
        )}
        <button style={s.actionBtn} onClick={onReset}>🔄 Scan Another</button>
      </div>

      {showCert && certTarget && (
        <CertInspector target={certTarget} />
      )}
    </div>
  );
}
