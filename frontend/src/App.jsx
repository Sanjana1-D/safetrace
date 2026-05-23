import React, { useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./index.css";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ScannerPage from "./pages/ScannerPage";
import ReportsPage from "./pages/ReportsPage";
import Toast from "./components/Toast";

// ── Global state context ──
export const AppContext = createContext(null);

export function useApp() { return useContext(AppContext); }

function AppInner() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("st_api_key") || "");
  const [toast, setToast] = useState(null);
  const [lastScan, setLastScan] = useState(null);

  const showToast = (msg, type = "success", duration = 3500) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), duration);
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem("st_api_key", key);
  };

  return (
    <AppContext.Provider value={{ apiKey, saveApiKey, showToast, lastScan, setLastScan }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
