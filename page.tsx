"use client";
// Legacy file - routing handled by app/ directory
function Sidebar() { return null; }
function Header({ title }: { title?: string }) { return <h1>{title}</h1>; }

export default function SubscriptionPage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header title="Abonnement" />
        <main className="page-content fade-in">
          <div className="page-header">
            <h1 className="page-title">Abonnement</h1>
          </div>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            {[
              { plan: "Starter", price: "29€", period: "/mois", features: ["1 pharmacie", "Import CSV", "Alertes email", "500 références"], current: false, color: "#64748b" },
              { plan: "Pro", price: "79€", period: "/mois", features: ["1 pharmacie", "Import CSV + XLSX", "Alertes SMS + email", "Références illimitées", "Rapports ROI", "Retours labo"], current: true, color: "#2563eb" },
              { plan: "Enterprise", price: "199€", period: "/mois", features: ["Jusqu'à 10 pharmacies", "API directe logiciels", "Support prioritaire", "Tableaux de bord avancés", "Export comptable"], current: false, color: "#7c3aed" },
            ].map((p) => (
              <div key={p.plan} className="card" style={{ padding: 24, border: p.current ? `2px solid ${p.color}` : undefined }}>
                {p.current && <div style={{ background: p.color, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, display: "inline-block", marginBottom: 12 }}>PLAN ACTUEL</div>}
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{p.plan}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: p.color }}>{p.price}<span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>{p.period}</span></div>
                <ul style={{ margin: "16px 0", padding: 0, listStyle: "none" }}>
                  {p.features.map((f) => <li key={f} style={{ padding: "4px 0", fontSize: 13, color: "#1e293b" }}>✅ {f}</li>)}
                </ul>
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", background: p.current ? "#f1f5f9" : p.color, color: p.current ? "#64748b" : "#fff" }}>
                  {p.current ? "Plan actuel" : "Choisir ce plan"}
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
