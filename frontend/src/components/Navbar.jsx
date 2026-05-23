import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../App";

const styles = {
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 2rem", height: 60,
    background: "rgba(10,11,13,0.92)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid var(--border)",
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10,
    fontFamily: "var(--font-display)", fontWeight: 800,
    fontSize: "1.18rem", letterSpacing: "-0.02em", cursor: "pointer",
  },
  logoMark: {
    width: 32, height: 32, borderRadius: 8,
    background: "linear-gradient(135deg, var(--accent), var(--accent4))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, flexShrink: 0,
  },
  logoText: { color: "var(--text)" },
  logoAccent: { color: "var(--accent)" },
  logoVersion: {
    fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text3)",
    background: "var(--bg3)", padding: "2px 6px", borderRadius: 4,
    border: "1px solid var(--border)", marginLeft: 4, alignSelf: "center",
  },
  links: { display: "flex", gap: 2, alignItems: "center" },
  navBtn: {
    padding: "6px 14px", borderRadius: 8, background: "none", border: "none",
    color: "var(--text2)", fontFamily: "var(--font-body)", fontSize: "0.875rem",
    cursor: "pointer", transition: "all 0.2s", fontWeight: 500,
  },
  navBtnActive: {
    color: "var(--accent)", background: "rgba(0,194,255,0.08)",
  },
  keyBtn: {
    padding: "6px 13px", borderRadius: 8, background: "rgba(0,194,255,0.07)",
    border: "1px solid rgba(0,194,255,0.2)", color: "var(--accent)",
    fontFamily: "var(--font-mono)", fontSize: "0.7rem", cursor: "pointer",
    transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6, marginLeft: 8,
  },
  dot: { width: 6, height: 6, borderRadius: "50%", animation: "pulse 2s infinite" },
  overlay: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(10,11,13,0.88)", backdropFilter: "blur(14px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "var(--surface)", border: "1px solid var(--border2)",
    borderRadius: 18, padding: "2rem", maxWidth: 420, width: "90%",
    boxShadow: "0 0 60px rgba(0,194,255,0.08), 0 20px 60px rgba(0,0,0,0.6)",
  },
  modalTag: {
    fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--accent3)",
    background: "rgba(255,184,48,0.08)", border: "1px solid rgba(255,184,48,0.2)",
    padding: "3px 8px", borderRadius: 4, display: "inline-block", marginBottom: "1rem",
  },
  modalTitle: { fontWeight: 800, fontSize: "1.1rem", marginBottom: 6, fontFamily: "var(--font-display)" },
  modalSub: { color: "var(--text2)", fontSize: "0.82rem", lineHeight: 1.65, marginBottom: "1.5rem" },
  input: {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    background: "var(--bg3)", border: "1px solid var(--border2)",
    color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: "0.82rem",
    outline: "none", marginBottom: "1rem",
  },
  saveBtn: {
    width: "100%", padding: "12px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, var(--accent), var(--accent4))",
    color: "#fff", fontWeight: 700, fontSize: "0.95rem",
    fontFamily: "var(--font-display)", cursor: "pointer",
  },
  cancelBtn: {
    width: "100%", padding: "10px", borderRadius: 10,
    background: "transparent", border: "1px solid var(--border2)",
    color: "var(--text2)", fontFamily: "var(--font-body)", fontSize: "0.88rem",
    cursor: "pointer", marginTop: 8,
  },
};

const ROUTES = [
  { path: "/", label: "Home" },
  { path: "/scanner", label: "Scanner" },
  { path: "/reports", label: "Community Reports" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { apiKey, saveApiKey } = useApp();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);

  const handleSave = () => {
    saveApiKey(keyInput.trim());
    setShowKeyModal(false);
  };

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.logo} onClick={() => navigate("/")}>
          <div style={styles.logoMark}>🔍</div>
          <span style={styles.logoText}>Safe<span style={styles.logoAccent}>Trace</span></span>
          <span style={styles.logoVersion}>v2.0</span>
        </div>

        <div style={styles.links}>
          {ROUTES.map((r) => (
            <button
              key={r.path}
              style={{ ...styles.navBtn, ...(location.pathname === r.path ? styles.navBtnActive : {}) }}
              onClick={() => navigate(r.path)}
            >
              {r.label}
            </button>
          ))}
          <button style={styles.keyBtn} onClick={() => { setKeyInput(apiKey); setShowKeyModal(true); }}>
            <span style={{ ...styles.dot, background: apiKey ? "var(--accent5)" : "var(--accent2)" }} />
            {apiKey ? "Key Active" : "Set Key"}
          </button>
        </div>
      </nav>

      {showKeyModal && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowKeyModal(false)}>
          <div style={styles.modal}>
            <div style={styles.modalTag}>CONFIGURATION</div>
            <div style={styles.modalTitle}>Analysis Engine Key</div>
            <div style={styles.modalSub}>
              Your key powers the deep analysis engine. It's stored only in your local browser and never transmitted to SafeTrace servers.
            </div>
            <input
              style={styles.input}
              type="password"
              placeholder="sk-ant-api03-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <button style={styles.saveBtn} onClick={handleSave}>Save & Activate</button>
            <button style={styles.cancelBtn} onClick={() => setShowKeyModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
