import React, { useState, useEffect } from "react";
import { inspectCert } from "../services/api";

const GRADE_COLORS = {
  "A+": "#4DFFD2", A: "#4DFFD2", B: "#7B61FF",
  C: "#FFB800", D: "#FF8C00", F: "#FF3A6E",
  T: "#FF3A6E", M: "#FF3A6E", "?": "#6b7f94",
};

const TRUST_COLORS = {
  HIGH: "#4DFFD2", "LOW-MEDIUM": "#FFB800",
  MEDIUM: "#7B61FF", LOW: "#FF8C00", UNKNOWN: "#6b7f94",
};

function Row({ label, value, valueColor, mono }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "7px 0", borderBottom: "1px solid var(--border)",
      gap: 12,
    }}>
      <span style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", flexShrink: 0, minWidth: 140 }}>
        {label}
      </span>
      <span style={{
        fontSize: "0.78rem", color: valueColor || "var(--text2)",
        fontFamily: mono ? "var(--font-mono)" : "inherit",
        wordBreak: "break-all", textAlign: "right",
      }}>
        {String(value)}
      </span>
    </div>
  );
}

function GradeBadge({ grade }) {
  const color = GRADE_COLORS[grade] || GRADE_COLORS["?"];
  return (
    <div style={{
      width: 64, height: 64, borderRadius: 12,
      border: `2px solid ${color}`, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: `${color}12`, flexShrink: 0,
    }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.6rem", fontWeight: 700, color, lineHeight: 1 }}>
        {grade || "?"}
      </div>
      <div style={{ fontSize: "0.55rem", color: "var(--text3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>TLS GRADE</div>
    </div>
  );
}

function TypeWriter({ text }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) return;
    setShown(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i += 4;
      setShown(text.substring(0, i));
      if (i >= text.length) { setShown(text); setDone(true); clearInterval(iv); }
    }, 14);
    return () => clearInterval(iv);
  }, [text]);
  return (
    <span>
      {shown}
      {!done && (
        <span style={{
          display: "inline-block", width: 2, height: 13,
          background: "var(--accent)", animation: "blink 1s infinite",
          verticalAlign: "middle", marginLeft: 2,
        }} />
      )}
    </span>
  );
}

export default function CertInspector({ target }) {
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setCert(null);
    setError(null);

    inspectCert(target)
      .then(res => {
        setCert(res.data);
        setLoading(false);
      })
      .catch(err => {
        // Backend offline — try direct fetch via backend
        setError("Backend unavailable — start the FastAPI server and try again.");
        setLoading(false);
      });
  }, [target]);

  const wrap = {
    marginTop: "1.5rem",
    background: "var(--surface)",
    border: "1px solid rgba(77,255,210,0.18)",
    borderRadius: 14,
    overflow: "hidden",
  };

  const header = {
    padding: "14px 18px",
    borderBottom: "1px solid var(--border)",
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(77,255,210,0.03)",
  };

  const body = { padding: "1.25rem 1.5rem" };

  if (loading) {
    return (
      <div style={wrap}>
        <div style={header}>
          <span style={{ fontSize: "1rem" }}>🔐</span>
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>SSL / TLS Certificate Inspector</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--accent)", background: "rgba(77,255,210,0.1)", padding: "2px 8px", borderRadius: 4 }}>
            LIVE LOOKUP
          </span>
        </div>
        <div style={{ ...body, textAlign: "center", padding: "2.5rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", margin: "0 auto 12px",
            border: "2px solid var(--border)", borderTopColor: "var(--accent)",
            animation: "spin 0.8s linear infinite",
          }} />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--accent)" }}>
            Fetching certificate from {target}...
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text3)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
            Connecting via SSL socket → parsing X.509 → generating AI analysis
          </div>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div style={wrap}>
        <div style={header}>
          <span>🔐</span>
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>SSL / TLS Certificate Inspector</span>
        </div>
        <div style={{ ...body, padding: "1.5rem" }}>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,58,110,0.06)", border: "1px solid rgba(255,58,110,0.2)", fontSize: "0.82rem", color: "var(--accent2)" }}>
            ⚠ {error || "Certificate fetch failed"}
          </div>
        </div>
      </div>
    );
  }

  const trust = cert?.issuer || {};

const trustColor =
  cert?.valid
    ? TRUST_COLORS.HIGH
    : TRUST_COLORS.UNKNOWN;

const grade =
  cert?.valid
    ? (cert?.days_remaining > 90 ? "A+" :
       cert?.days_remaining > 30 ? "A" : "B")
    : "?";

const gradeColor =
  GRADE_COLORS[grade] || GRADE_COLORS["?"];

const expired =
  cert?.days_remaining <= 0;

const selfSigned = false;

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={header}>
        <span style={{ fontSize: "1rem" }}>🔐</span>
        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>SSL / TLS Certificate Inspector</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--accent)", background: "rgba(77,255,210,0.1)", padding: "2px 8px", borderRadius: 4 }}>
          LIVE · {target}
        </span>
        {cert.errors?.length > 0 && (
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--accent2)", background: "rgba(255,58,110,0.08)", padding: "2px 8px", borderRadius: 4 }}>
            ⚠ {cert.errors.length} ERROR{cert.errors.length > 1 ? "S" : ""}
          </span>
        )}
      </div>

      <div style={body}>
        {/* Top summary row */}
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <GradeBadge grade={grade} />

          {/* Validity bar */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.78rem" }}>
              <span style={{ color: "var(--text3)", fontFamily: "var(--font-mono)" }}>VALIDITY</span>
              <span style={{ color: expired ? "var(--accent2)" : cert.days_remaining < 30 ? "#FFB800" : "var(--accent)", fontFamily: "var(--font-mono)" }}>
                {expired ? "EXPIRED" : cert.days_remaining != null ? `${cert.days_remaining} days remaining` : "Unknown"}
              </span>
            </div>
            <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: expired ? "100%" : cert.days_remaining != null ? `${Math.min((cert.days_remaining / 365) * 100, 100)}%` : "50%",
                background: expired ? "var(--accent2)" : cert.days_remaining < 30 ? "#FFB800" : "linear-gradient(90deg, var(--accent), var(--accent4))",
                transition: "width 1s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text3)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
              <span>{cert.not_before || "—"}</span>
              <span>{cert.not_after || "—"}</span>
            </div>
          </div>

          {/* Status flags */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
  [selfSigned, "⚠ Self-Signed", "var(--accent2)"],
  [expired, "✗ Expired", "var(--accent2)"],
  [!cert.valid, "✗ No SSL", "var(--accent2)"],
  [cert.valid && !selfSigned && !expired, "✓ SSL Active", "var(--accent)"],
].map(([show, label, color]) =>
              show ? (
                <div key={label} style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color, padding: "3px 8px", borderRadius: 4, background: `${color}14`, border: `1px solid ${color}30` }}>
                  {label}
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Errors banner */}
        {cert.errors?.length > 0 && (
          <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 9, background: "rgba(255,58,110,0.06)", border: "1px solid rgba(255,58,110,0.2)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.67rem", color: "var(--text3)", marginBottom: 5, letterSpacing: "0.06em" }}>CERTIFICATE ERRORS</div>
            {cert.errors.map((e, i) => (
              <div key={i} style={{ fontSize: "0.8rem", color: "var(--accent2)", marginBottom: 3 }}>⚠ {e}</div>
            ))}
          </div>
        )}

        {/* Two-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          {/* Column 1 — Issuer */}
          <div style={{ background: "var(--bg3)", borderRadius: 11, padding: "1rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.67rem", color: "var(--text3)", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              // CERTIFICATE AUTHORITY
            </div>
            <Row
  label="Issuer"
  value={cert?.issuer?.organizationName || cert?.issuer?.commonName || "Unknown"}
/>

<Row
  label="Issuer Org"
  value={cert?.issuer?.commonName || "Unknown"}
/>
            {trust.type && <Row label="CA Type" value={trust.type} valueColor={trustColor} />}
            {trust.trust && (
              <Row label="Trust Level" value={trust.trust}
                valueColor={trustColor} />
            )}
            {trust.desc && (
              <div style={{ marginTop: 8, fontSize: "0.73rem", color: "var(--text3)", lineHeight: 1.55, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                {trust.desc}
              </div>
            )}
          </div>

          {/* Column 2 — Subject */}
          <div style={{ background: "var(--bg3)", borderRadius: 11, padding: "1rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.67rem", color: "var(--text3)", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              // SUBJECT &amp; IDENTITY
            </div>
            <Row
  label="Common Name"
  value={cert?.subject?.commonName || "Unknown"}
  valueColor="var(--text)"
/>

<Row
  label="Domain"
  value={target}
  mono
/>

<Row
  label="Protocol"
  value={cert.protocol || "Unavailable"}
  mono
/>

<Row
  label="Cipher"
  value={cert.cipher || "Unavailable"}
  mono
/>
          </div>

          {/* Column 3 — Technical */}
          <div style={{ background: "var(--bg3)", borderRadius: 11, padding: "1rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.67rem", color: "var(--text3)", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              // TECHNICAL DETAILS
            </div>
            <Row label="Serial Number" value={cert.serial_number} mono />
            <Row label="Self-Signed" value={selfSigned ? "YES ⚠" : "No"} valueColor={selfSigned ? "var(--accent2)" : "var(--accent)"} />
            <Row label="Key Type" value={cert.key_type || "RSA"} mono />
            <Row label="Sig Algorithm" value={cert.sig_algorithm} mono />
          </div>

          {/* Column 4 — Fingerprints */}
          <div style={{ background: "var(--bg3)", borderRadius: 11, padding: "1rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.67rem", color: "var(--text3)", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              // FINGERPRINTS
            </div>
            {cert.fingerprint_sha256 && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.67rem", color: "var(--text3)", fontFamily: "var(--font-mono)", marginBottom: 3 }}>SHA-256</div>
                <div style={{ fontSize: "0.62rem", fontFamily: "var(--font-mono)", color: "var(--text2)", wordBreak: "break-all", lineHeight: 1.5 }}>
                  {cert.fingerprint_sha256}
                </div>
              </div>
            )}
            {cert.fingerprint_sha1 && (
              <div>
                <div style={{ fontSize: "0.67rem", color: "var(--text3)", fontFamily: "var(--font-mono)", marginBottom: 3 }}>SHA-1</div>
                <div style={{ fontSize: "0.62rem", fontFamily: "var(--font-mono)", color: "var(--text2)", wordBreak: "break-all", lineHeight: 1.5 }}>
                  {cert.fingerprint_sha1}
                </div>
              </div>
            )}
            {!cert.fingerprint_sha256 && !cert.fingerprint_sha1 && (
              <div style={{ fontSize: "0.75rem", color: "var(--text3)" }}>Fingerprints unavailable</div>
            )}
          </div>
        </div>

        {/* Subject Alternative Names */}
        {cert.san?.length > 0 && (
          <div style={{ marginBottom: "1rem", background: "var(--bg3)", borderRadius: 11, padding: "1rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.67rem", color: "var(--text3)", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              // SUBJECT ALTERNATIVE NAMES ({cert.san.length})
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cert.san.map((s, i) => (
                <span key={i} style={{
                  padding: "3px 9px", borderRadius: 5, background: "var(--bg)", border: "1px solid var(--border)",
                  fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text2)",
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Certificate Analysis */}
        <div style={{
          background: "var(--surface)", border: "1px solid rgba(77,255,210,0.2)",
          borderRadius: 12, padding: "1.25rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.85rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🤖</span>
            <span style={{ fontWeight: 800, fontSize: "0.88rem" }}>SafeTrace — Certificate Analysis</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--accent)", background: "rgba(77,255,210,0.1)", padding: "2px 7px", borderRadius: 4 }}>
              SafeTrace Engine
            </span>
          </div>
          <div style={{ fontSize: "0.87rem", color: "var(--text2)", lineHeight: 1.75 }}>
            <TypeWriter
  text={
    cert?.valid
      ? `This certificate appears valid and is issued by ${
          cert?.issuer?.organizationName || "a trusted authority"
        }. It expires in ${
          cert?.days_remaining ?? "unknown"
        } days. No major SSL issues were detected.`
      : "This certificate could not be validated. Proceed with caution."
  }
/>
          </div>
        </div>
      </div>
    </div>
  );
}
