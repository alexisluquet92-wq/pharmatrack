"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadStock } from "@/lib/store";

export default function Sidebar() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);

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

  const nav = [
    { href: "/dashboard", icon: "📊", label: "Tableau de bord" },
    { href: "/alerts", icon: "🔔", label: "Alertes", badge: alertCount > 0 ? alertCount : null },
    { href: "/parapharmacie", icon: "🛍️", label: "Parapharmacie" },
    { href: "/returns", icon: "↩️", label: "Retours laboratoire" },
    { href: "/reports", icon: "📈", label: "Rapports ROI" },
    { href: "/import", icon: "⬆️", label: "Import données" },
    { href: "/subscription", icon: "💳", label: "Abonnement" },
  ];

  return (
    <aside className="sidebar">
      <div style={{ padding: "24px 20px 8px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚠️</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, lineHeight: 1 }}>PharmaTrack</div>
            <div style={{ color: "rgba(255,255,255,.55)", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>Gestion des périmés</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px", margin: "12px 12px 4px", background: "rgba(255,255,255,.1)", borderRadius: 10 }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>Pharmacie du Centre</div>
        <div style={{ color: "rgba(255,255,255,.6)", fontSize: 12 }}>Lyon · Plan Pro</div>
      </div>

      <nav style={{ flex: 1, padding: "8px 0" }}>
        <div style={{ padding: "8px 20px 4px", color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Navigation</div>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${pathname === item.href ? " active" : ""}`}
          >
            <span>{item.icon}</span>
            {item.label}
            {item.badge != null && (
              <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", minWidth: 20, height: 20, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}

        <div style={{ padding: "16px 20px 4px", marginTop: 8, borderTop: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Compte</div>
        <Link href="/settings" className={`nav-item${pathname === "/settings" ? " active" : ""}`}>⚙️ Paramètres</Link>
        <button className="nav-item">🚪 Déconnexion</button>
      </nav>

      <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.35)", fontSize: 11 }}>
        PharmaTrack v2.1 · Données réelles
      </div>
    </aside>
  );
}
