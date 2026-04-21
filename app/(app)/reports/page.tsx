'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, Euro, RotateCcw, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { sdb } from '@/lib/supabase-db';
import { computeUrgency } from '@/lib/data';
import type { Return, Product } from '@/lib/data';

export default function ReportsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([sdb.returns.getAll(), sdb.products.getAll()]).then(([r, p]) => {
      setReturns(r); setProducts(p); setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--brand-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const validated = returns.filter(r => r.statut === 'valide');
  const totalReturned = validated.reduce((s, r) => s + (r.montant_estime || 0), 0);
  const totalAtRisk = products.filter(p => computeUrgency(p.date_expiration) !== 'ok').reduce((s, p) => s + p.stock * p.prix_unitaire, 0);
  const savedEstimate = totalReturned * 0.85;

  // Returns by lab
  const labMap: Record<string, number> = {};
  returns.forEach(r => {
    if (r.laboratoire) {
      labMap[r.laboratoire] = (labMap[r.laboratoire] || 0) + (r.montant_estime || 0);
    }
  });
  const labData = Object.entries(labMap)
    .map(([lab, val]) => ({ lab, val }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 8);

  // Monthly returns (last 6 months)
  const monthly: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    monthly[key] = 0;
  }
  returns.forEach(r => {
    const d = new Date(r.date_retour);
    const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    if (key in monthly) monthly[key] += r.montant_estime || 0;
  });
  const monthlyData = Object.entries(monthly).map(([month, val]) => ({ month, val }));

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
  const STATUT_LABELS: Record<string, string> = { en_attente: 'En attente', valide: 'Validé', refuse: 'Refusé' };
  const STATUT_BADGES: Record<string, string> = { en_attente: 'badge-gray', valide: 'badge-ok', refuse: 'badge-expired' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapports ROI</h1>
          <div className="page-subtitle">Analyse de la récupération sur médicaments périmés</div>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--green-50)' }}><Euro size={22} color="var(--green-600)" /></div>
          <div className="kpi-content">
            <div className="kpi-value" style={{ color: 'var(--green-600)', fontSize: 20 }}>{fmt(totalReturned)} €</div>
            <div className="kpi-label">Retours validés (valeur brute)</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--brand-50)' }}><TrendingUp size={22} color="var(--brand-600)" /></div>
          <div className="kpi-content">
            <div className="kpi-value" style={{ color: 'var(--brand-600)', fontSize: 20 }}>{fmt(savedEstimate)} €</div>
            <div className="kpi-label">Économies estimées (85% net)</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--brand-50)' }}><RotateCcw size={22} color="var(--brand-600)" /></div>
          <div className="kpi-content">
            <div className="kpi-value">{returns.length}</div>
            <div className="kpi-label">Dossiers de retour</div>
            <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>{validated.length} validés</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--red-50)' }}><CheckCircle size={22} color="var(--red-600)" /></div>
          <div className="kpi-content">
            <div className="kpi-value" style={{ color: 'var(--red-600)', fontSize: 20 }}>{fmt(totalAtRisk)} €</div>
            <div className="kpi-label">Valeur encore à risque</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Retours par laboratoire</div>
          </div>
          {labData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={labData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
                  <YAxis type="category" dataKey="lab" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip formatter={(v) => [`${fmt(Number(v))} €`, 'Valeur']} />
                  <Bar dataKey="val" radius={[0, 4, 4, 0]}>
                    {labData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>Aucun retour enregistré</div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Tendance mensuelle (6 mois)</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
                <Tooltip formatter={(v) => [`${fmt(Number(v))} €`, 'Retours']} />
                <Bar dataKey="val" fill="var(--brand-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {returns.length > 0 && (
        <div className="card">
          <div className="card-header"><div className="card-title">Détail des retours</div></div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Produit</th><th>Laboratoire</th><th>Qté</th><th>Montant estimé</th><th>Statut</th><th>Date retour</th></tr></thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.nom_produit}</td>
                    <td>{r.laboratoire || '—'}</td>
                    <td>{r.quantite}</td>
                    <td style={{ fontWeight: 700 }}>{r.montant_estime != null ? `${fmt(r.montant_estime)} €` : '—'}</td>
                    <td><span className={`badge ${STATUT_BADGES[r.statut] || 'badge-gray'}`}>{STATUT_LABELS[r.statut] || r.statut}</span></td>
                    <td>{new Date(r.date_retour).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
