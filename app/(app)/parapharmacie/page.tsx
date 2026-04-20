'use client';
import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Tag, Search } from 'lucide-react';
import { sdb } from '@/lib/supabase-db';
import { computeUrgency, daysUntil, isParapharmaceutical } from '@/lib/data';
import type { Product } from '@/lib/data';
import toast, { Toaster } from 'react-hot-toast';

type Filter = 'all' | 'expired' | 'critical' | 'warning' | 'ok';

export default function ParapharmacyPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [tagModal, setTagModal] = useState<Product | null>(null);
  const [tagValue, setTagValue] = useState<'liquidation' | 'promotion' | null>(null);
  const [remisePct, setRemisePct] = useState('');

  const reload = useCallback(() => {
    sdb.products.getAll().then(p => {
      setProducts(p.filter(prod => isParapharmaceutical(prod.cip_code)));
      setLoading(false);
    });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const withMeta = products.map(p => ({
    ...p, urgency: computeUrgency(p.date_expiration), days: daysUntil(p.date_expiration),
  }));

  const filtered = withMeta.filter(p => {
    if (filter !== 'all' && p.urgency !== filter) return false;
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) &&
        !(p.laboratoire || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: withMeta.length,
    expired: withMeta.filter(p => p.urgency === 'expired').length,
    critical: withMeta.filter(p => p.urgency === 'critical').length,
    warning: withMeta.filter(p => p.urgency === 'warning').length,
    ok: withMeta.filter(p => p.urgency === 'ok').length,
  };

  const totalValue = products.reduce((s, p) => s + p.stock * p.prix_unitaire, 0);
  const atRiskValue = withMeta.filter(p => p.urgency !== 'ok').reduce((s, p) => s + p.stock * p.prix_unitaire, 0);

  async function saveTag() {
    if (!tagModal) return;
    const remise = remisePct ? parseFloat(remisePct) : null;
    const prixRemise = remise ? tagModal.prix_unitaire * (1 - remise / 100) : null;
    await sdb.products.update(tagModal.id, { tag: tagValue, remise_pct: remise, prix_remise: prixRemise });
    toast.success(tagValue ? `Tag "${tagValue}" appliqué` : 'Tag supprimé');
    setTagModal(null); reload();
  }

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const getBadgeClass = (urgency: string) => ({ expired: 'badge-expired', critical: 'badge-critical', warning: 'badge-warning', ok: 'badge-ok' }[urgency] || 'badge-ok');

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--brand-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="fade-in">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Parapharmacie</h1>
          <div className="page-subtitle">{products.length} référence{products.length !== 1 ? 's' : ''} parapharmacie</div>
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Aucun produit parapharmacie</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Les produits sans code CIP 3400 seront classés ici.</div>
        </div>
      ) : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#f5f3ff' }}><ShoppingBag size={22} color="#8b5cf6" /></div>
              <div className="kpi-content">
                <div className="kpi-value">{products.length}</div>
                <div className="kpi-label">Références parapharmacie</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'var(--red-50)' }}><Tag size={22} color="var(--red-600)" /></div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: 'var(--red-600)' }}>{counts.expired + counts.critical}</div>
                <div className="kpi-label">À traiter (périmés + critiques)</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-value" style={{ fontSize: 18 }}>{fmt(atRiskValue)} €</div>
                <div className="kpi-label">Valeur à risque</div>
                <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>/ {fmt(totalValue)} € total</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {([['all', 'Tous'], ['expired', 'Périmés'], ['critical', 'Critiques ≤30j'], ['warning', 'Attention ≤90j'], ['ok', 'OK']] as [Filter, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                style={{ padding: '6px 14px', borderRadius: 99, border: '1.5px solid', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  borderColor: filter === key ? 'var(--brand-500)' : 'var(--border)',
                  background: filter === key ? 'var(--brand-50)' : 'var(--surface)',
                  color: filter === key ? 'var(--brand-700)' : 'var(--text-secondary)' }}>
                {label} <span style={{ marginLeft: 4, background: filter === key ? 'var(--brand-500)' : 'var(--surface-3)', color: filter === key ? '#fff' : 'var(--text-muted)', borderRadius: 99, padding: '1px 6px', fontSize: 11 }}>{counts[key]}</span>
              </button>
            ))}
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: 200, fontSize: 13 }} />
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>Produit</th><th>Marque / Labo</th><th>Expiration</th><th>Stock</th><th>Prix unit.</th><th>Valeur</th><th>Tag</th><th>Urgence</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Aucun produit trouvé</td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className={p.urgency === 'expired' || p.urgency === 'critical' ? 'row-critical' : p.urgency === 'warning' ? 'row-warning' : ''}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{p.nom}</div>
                        {p.cip_code && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.cip_code}</div>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.laboratoire || '—'}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{new Date(p.date_expiration).toLocaleDateString('fr-FR')}</div>
                        <div style={{ fontSize: 11, color: p.days <= 0 ? 'var(--red-600)' : p.days <= 30 ? 'var(--orange-600)' : 'var(--yellow-600)', fontWeight: 600 }}>
                          {p.days <= 0 ? 'Périmé' : `${p.days}j`}
                        </div>
                      </td>
                      <td>{p.stock}</td>
                      <td>
                        {p.remise_pct ? (
                          <div>
                            <div style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: 12 }}>{fmt(p.prix_unitaire)} €</div>
                            <div style={{ color: 'var(--red-600)', fontWeight: 700 }}>{fmt(p.prix_remise || 0)} €</div>
                          </div>
                        ) : `${fmt(p.prix_unitaire)} €`}
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmt(p.stock * p.prix_unitaire)} €</td>
                      <td>
                        {p.tag ? (
                          <span className={`badge ${p.tag === 'liquidation' ? 'badge-critical' : 'badge-warning'}`}>{p.tag === 'liquidation' ? '🔻 Liquidation' : '🏷️ Promotion'}</span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td><span className={`badge ${getBadgeClass(p.urgency)}`}>{p.urgency === 'expired' ? 'Périmé' : p.urgency === 'critical' ? 'Critique' : p.urgency === 'warning' ? 'Attention' : 'OK'}</span></td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setTagModal(p); setTagValue(p.tag || null); setRemisePct(p.remise_pct ? String(p.remise_pct) : ''); }}>
                          <Tag size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tagModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Tagger le produit</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>{tagModal.nom}</div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Type de tag</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['liquidation', 'promotion', null] as const).map(t => (
                <button key={String(t)} onClick={() => setTagValue(t)}
                  style={{ flex: 1, padding: '8px 12px', border: `1.5px solid ${tagValue === t ? 'var(--brand-500)' : 'var(--border)'}`, borderRadius: 8, background: tagValue === t ? 'var(--brand-50)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: tagValue === t ? 'var(--brand-700)' : 'var(--text-secondary)' }}>
                  {t === null ? 'Aucun' : t === 'liquidation' ? '🔻 Liquidation' : '🏷️ Promotion'}
                </button>
              ))}
            </div>
            {tagValue && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Remise (%)</label>
                <input className="form-input" type="number" min="0" max="99" placeholder="Ex: 20" value={remisePct} onChange={e => setRemisePct(e.target.value)} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setTagModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveTag}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
