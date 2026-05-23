import React from "react";

const styles = {
  toast: {
    position: "fixed", bottom: 24, right: 24, zIndex: 9999,
    padding: "11px 18px", borderRadius: 10,
    fontFamily: "var(--font-display)", fontSize: "0.86rem", fontWeight: 600,
    display: "flex", alignItems: "center", gap: 8,
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    animation: "fadeUp 0.28s ease",
    maxWidth: 340,
  },
  success: { background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.3)", color: "var(--accent5)" },
  error:   { background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", color: "var(--accent2)" },
  info:    { background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.3)", color: "var(--accent4)" },
};

export default function Toast({ message, type = "success" }) {
  return (
    <div style={{ ...styles.toast, ...styles[type] }}>
      {message}
    </div>
  );
}
