'use client';
import { useState, useEffect, useCallback } from 'react';
import { Download, Tag, RotateCcw, Search } from 'lucide-react';
import { sdb } from '@/lib/supabase-db';
import { computeUrgency, daysUntil, isPharmaceutical } from '@/lib/data';
import type { Product } from '@/lib/data';
import toast, { Toaster } from 'react-hot-toast';

type Filter = 'all' | 'expired' | 'critical' | 'warning' | 'ok';
type Tag = 'liquidation' | 'promotion' | null;

export default function AlertsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [tagModal, setTagModal] = useState<Product | null>(null);
  const [tagValue, setTagValue] = useState<Tag>(null);
  const [remisePct, setRemisePct] = useState('');

  const reload = useCallback(() => {
    sdb.products.getAll().then(p => { setProducts(p); setLoading(false); });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const withMeta = products.map(p => ({
    ...p,
    urgency: computeUrgency(p.date_expiration),
    days: daysUntil(p.date_expiration),
  }));

  const filtered = withMeta.filter(p => {
    if (filter !== 'all' && p.urgency !== filter) return false;
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) &&
        !(p.cip_code || '').includes(search) &&
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

  function exportCSV() {
    const rows = [
      ['Produit', 'CIP', 'Laboratoire', 'Date expiration', 'Stock', 'Prix unitaire', 'Valeur', 'Urgence'],
      ...filtered.map(p => [
        p.nom, p.cip_code || '', p.laboratoire || '',
        new Date(p.date_expiration).toLocaleDateString('fr-FR'),
        p.stock, p.prix_unitaire,
        (p.stock * p.prix_unitaire).toFixed(2),
        p.urgency,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'alertes_pharmatrack.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  }

  async function saveTag() {
    if (!tagModal) return;
    const remise = remisePct ? parseFloat(remisePct) : null;
    const prixRemise = remise ? tagModal.prix_unitaire * (1 - remise / 100) : null;
    await sdb.products.update(tagModal.id, { tag: tagValue, remise_pct: remise, prix_remise: prixRemise });
    toast.success(tagValue ? `Tag "${tagValue}" appliqué` : 'Tag supprimé');
    setTagModal(null);
    reload();
  }

  const getBadgeClass = (urgency: string) => {
    if (urgency === 'expired') return 'badge-expired';
    if (urgency === 'critical') return 'badge-critical';
    if (urgency === 'warning') return 'badge-warning';
    return 'badge-ok';
  };

  const getRowClass = (urgency: string) => {
    if (urgency === 'expired' || urgency === 'critical') return 'row-critical';
    if (urgency === 'warning') return 'row-warning';
    return '';
  };

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'expired', label: 'Périmés' },
    { key: 'critical', label: 'Critiques ≤30j' },
    { key: 'warning', label: 'Attention ≤90j' },
    { key: 'ok', label: 'OK' },
  ];

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
          <h1 className="page-title">Alertes & Notifications</h1>
          <div className="page-subtitle">{counts.expired + counts.critical} produit{counts.expired + counts.critical !== 1 ? 's' : ''} nécessitant une action immédiate</div>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}><Download size={15} />Export CSV</button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '6px 14px', borderRadius: 99, border: '1.5px solid', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              borderColor: filter === f.key ? 'var(--brand-500)' : 'var(--border)',
              background: filter === f.key ? 'var(--brand-50)' : 'var(--surface)',
              color: filter === f.key ? 'var(--brand-700)' : 'var(--text-secondary)' }}>
            {f.label} {counts[f.key] > 0 && <span style={{ marginLeft: 4, background: filter === f.key ? 'var(--brand-500)' : 'var(--surface-3)', color: filter === f.key ? '#fff' : 'var(--text-muted)', borderRadius: 99, padding: '1px 6px', fontSize: 11 }}>{counts[f.key]}</span>}
          </button>
        ))}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32, width: 220, fontSize: 13 }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produit</th><th>Laboratoire</th><th>Catégorie</th><th>Expiration</th><th>Stock</th><th>Valeur</th><th>Tag</th><th>Urgence</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Aucun produit trouvé</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className={getRowClass(p.urgency)}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{p.nom}</div>
                    {p.cip_code && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.cip_code}</div>}
                  </td>
                  <td>{p.laboratoire || '—'}</td>
                  <td><span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{isPharmaceutical(p.cip_code) ? 'Médicament' : 'Parapharmacie'}</span></td>
                  <td>
                    <div style={{ fontSize: 13 }}>{new Date(p.date_expiration).toLocaleDateString('fr-FR')}</div>
                    <div style={{ fontSize: 11, color: p.days <= 0 ? 'var(--red-600)' : p.days <= 30 ? 'var(--orange-600)' : 'var(--yellow-600)', fontWeight: 600 }}>
                      {p.days <= 0 ? 'Périmé' : `${p.days}j restants`}
                    </div>
                  </td>
                  <td>{p.stock}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(p.stock * p.prix_unitaire)} €</td>
                  <td>
                    {p.tag ? (
                      <span className={`badge ${p.tag === 'liquidation' ? 'badge-critical' : 'badge-warning'}`}>{p.tag === 'liquidation' ? '🔻 Liquidation' : '🏷️ Promotion'}</span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                  </td>
                  <td><span className={`badge ${getBadgeClass(p.urgency)}`}>
                    {p.urgency === 'expired' ? 'Périmé' : p.urgency === 'critical' ? 'Critique' : p.urgency === 'warning' ? 'Attention' : 'OK'}
                  </span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-secondary" title="Tagger" onClick={() => { setTagModal(p); setTagValue(p.tag || null); setRemisePct(p.remise_pct ? String(p.remise_pct) : ''); }}>
                        <Tag size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {tagModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Tagger le produit</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>{tagModal.nom}</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Type de tag</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['liquidation', 'promotion', null] as const).map(t => (
                  <button key={String(t)} onClick={() => setTagValue(t)}
                    style={{ flex: 1, padding: '8px 12px', border: `1.5px solid ${tagValue === t ? 'var(--brand-500)' : 'var(--border)'}`, borderRadius: 8, background: tagValue === t ? 'var(--brand-50)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: tagValue === t ? 'var(--brand-700)' : 'var(--text-secondary)' }}>
                    {t === null ? 'Aucun' : t === 'liquidation' ? '🔻 Liquidation' : '🏷️ Promotion'}
                  </button>
                ))}
              </div>
            </div>
            {tagValue && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Remise (%)</label>
                <input className="form-input" type="number" min="0" max="99" placeholder="Ex: 20" value={remisePct} onChange={e => setRemisePct(e.target.value)} />
                {remisePct && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Prix remisé : {(tagModal.prix_unitaire * (1 - parseFloat(remisePct) / 100)).toFixed(2)} €</div>}
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
