"use client";
import { useEffect, useState } from "react";
import { loadStock } from "@/lib/store";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [alertCount, setAlertCount] = useState(0);
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const refresh = () => {
    const items = loadStock();
    if (items) {
      const count = items.filter((i) => i.urgency === "critical" || i.urgency === "expired").length;
      setAlertCount(count);
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener("pharmatrack_data_updated", refresh);
    return () => window.removeEventListener("pharmatrack_data_updated", refresh);
  }, []);

  return (
    <header className="main-header">
      <div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#1e293b" }}>{title}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
          {subtitle || "Pharmacie du Centre · Lyon · " + today}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {alertCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef2f2", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: 8 }}>
            <span className="pulse-dot" style={{ background: "#ef4444" }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#dc2626" }}>{alertCount} alerte{alertCount > 1 ? "s" : ""} critique{alertCount > 1 ? "s" : ""}</span>
          </div>
        )}
        <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>MD</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Dr. M. Dupont</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Titulaire</div>
          </div>
        </button>
      </div>
    </header>
  );
}
