'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, AlertTriangle, TrendingDown, Euro, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { sdb } from '@/lib/supabase-db';
import { computeUrgency, daysUntil, isPharmaceutical } from '@/lib/data';
import type { Product } from '@/lib/data';

const URGENCY_COLORS = { expired: '#dc2626', critical: '#ea580c', warning: '#ca8a04', ok: '#16a34a' };
const URGENCY_LABELS = { expired: 'Périmés', critical: 'Critiques', warning: 'Attention', ok: 'OK' };

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sdb.products.getAll().then(p => { setProducts(p); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--brand-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const withUrgency = products.map(p => ({ ...p, urgency: computeUrgency(p.date_expiration), days: daysUntil(p.date_expiration) }));
  const expired = withUrgency.filter(p => p.urgency === 'expired');
  const critical = withUrgency.filter(p => p.urgency === 'critical');
  const warning = withUrgency.filter(p => p.urgency === 'warning');
  const ok = withUrgency.filter(p => p.urgency === 'ok');
  const atRisk = [...expired, ...critical];
  const atRiskValue = atRisk.reduce((s, p) => s + p.stock * p.prix_unitaire, 0);
  const totalValue = products.reduce((s, p) => s + p.stock * p.prix_unitaire, 0);

  const barData = [
    { name: 'Périmés', count: expired.length, fill: URGENCY_COLORS.expired },
    { name: 'Critiques', count: critical.length, fill: URGENCY_COLORS.critical },
    { name: 'Attention', count: warning.length, fill: URGENCY_COLORS.warning },
    { name: 'OK', count: ok.length, fill: URGENCY_COLORS.ok },
  ];

  const pharma = products.filter(p => isPharmaceutical(p.cip_code));
  const para = products.filter(p => !isPharmaceutical(p.cip_code));
  const pieData = [
    { name: 'Médicaments', value: pharma.length, fill: '#0ea5e9' },
    { name: 'Parapharmacie', value: para.length, fill: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const topExpiring = withUrgency
    .filter(p => p.urgency !== 'ok')
    .sort((a, b) => a.days - b.days)
    .slice(0, 10);

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <div className="page-subtitle">{products.length} produit{products.length !== 1 ? 's' : ''} en stock</div>
        </div>
        <Link href="/alerts" className="btn btn-primary" style={{ fontSize: 13 }}>
          Voir les alertes <ArrowRight size={15} />
        </Link>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <Package size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Aucun produit importé</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Commencez par importer votre stock depuis votre logiciel métier.</div>
          <Link href="/import" className="btn btn-primary">Importer des données</Link>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#eff6ff' }}><Package size={22} color="#3b82f6" /></div>
              <div className="kpi-content">
                <div className="kpi-value">{products.length}</div>
                <div className="kpi-label">Références en stock</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'var(--red-50)' }}><AlertTriangle size={22} color="var(--red-600)" /></div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: 'var(--red-600)' }}>{expired.length}</div>
                <div className="kpi-label">Produits périmés</div>
                {critical.length > 0 && <div className="kpi-trend" style={{ color: 'var(--orange-600)' }}>+ {critical.length} critiques (≤30j)</div>}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'var(--orange-50)' }}><TrendingDown size={22} color="var(--orange-600)" /></div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: 'var(--orange-600)' }}>{atRisk.length}</div>
                <div className="kpi-label">À risque (≤30j)</div>
                <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>sur {products.length} références</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'var(--red-50)' }}><Euro size={22} color="var(--red-600)" /></div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: 'var(--red-600)', fontSize: 20 }}>{fmt(atRiskValue)} €</div>
                <div className="kpi-label">Valeur à risque</div>
                {totalValue > 0 && <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>{((atRiskValue / totalValue) * 100).toFixed(1)}% du stock total</div>}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Répartition par urgence</div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [v, 'Produits']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Médicaments vs Parapharmacie</div>
              </div>
              {pieData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--text-muted)', fontSize: 13 }}>Aucune donnée</div>
              )}
            </div>
          </div>

          {topExpiring.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><AlertTriangle size={16} />Alertes prioritaires</div>
                <Link href="/alerts" style={{ fontSize: 12, color: 'var(--brand-600)', fontWeight: 600, textDecoration: 'none' }}>Voir tout →</Link>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Produit</th><th>Laboratoire</th><th>Expiration</th><th>Stock</th><th>Valeur</th><th>Urgence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topExpiring.map(p => {
                      const urg = p.urgency;
                      const badgeClass = urg === 'expired' ? 'badge-expired' : urg === 'critical' ? 'badge-critical' : 'badge-warning';
                      const label = urg === 'expired' ? 'Périmé' : urg === 'critical' ? `${p.days}j` : `${p.days}j`;
                      return (
                        <tr key={p.id} className={urg === 'expired' ? 'row-critical' : urg === 'critical' ? 'row-critical' : 'row-warning'}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{p.nom}</div>
                            {p.cip_code && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.cip_code}</div>}
                          </td>
                          <td>{p.laboratoire || '—'}</td>
                          <td>
                            <div style={{ fontSize: 13 }}>{new Date(p.date_expiration).toLocaleDateString('fr-FR')}</div>
                          </td>
                          <td>{p.stock} unité{p.stock > 1 ? 's' : ''}</td>
                          <td style={{ fontWeight: 600 }}>{fmt(p.stock * p.prix_unitaire)} €</td>
                          <td><span className={`badge ${badgeClass}`}>{label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
