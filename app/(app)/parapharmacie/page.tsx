'use client';
import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Plus, Trash2, Pencil, Search } from 'lucide-react';
import { sdb } from '@/lib/supabase-db';
import { computeUrgency, daysUntil } from '@/lib/data';
import type { Parapharmacie } from '@/lib/data';
import toast, { Toaster } from 'react-hot-toast';

type Filter = 'all' | 'expired' | 'critical' | 'warning' | 'ok';

const EMPTY_FORM = { nom: '', reference: '', fournisseur: '', quantite: '1', prix_unitaire: '0', date_expiration: '' };

export default function ParapharmacyPage() {
  const [items, setItems] = useState<Parapharmacie[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Parapharmacie | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    sdb.parapharmacie.getAll().then(p => { setItems(p); setLoading(false); });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const withMeta = items.map(p => ({
    ...p, urgency: computeUrgency(p.date_expiration), days: daysUntil(p.date_expiration),
  }));

  const filtered = withMeta.filter(p => {
    if (filter !== 'all' && p.urgency !== filter) return false;
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) &&
        !(p.fournisseur || '').toLowerCase().includes(search.toLowerCase()) &&
        !(p.reference || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: withMeta.length,
    expired: withMeta.filter(p => p.urgency === 'expired').length,
    critical: withMeta.filter(p => p.urgency === 'critical').length,
    warning: withMeta.filter(p => p.urgency === 'warning').length,
    ok: withMeta.filter(p => p.urgency === 'ok').length,
  };

  const totalValue = items.reduce((s, p) => s + p.quantite * p.prix_unitaire, 0);
  const atRiskValue = withMeta.filter(p => p.urgency !== 'ok').reduce((s, p) => s + p.quantite * p.prix_unitaire, 0);

  function openCreate() {
    setEditItem(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(item: Parapharmacie) {
    setEditItem(item);
    setForm({
      nom: item.nom,
      reference: item.reference || '',
      fournisseur: item.fournisseur || '',
      quantite: String(item.quantite),
      prix_unitaire: String(item.prix_unitaire),
      date_expiration: item.date_expiration,
    });
    setModalOpen(true);
  }

  async function saveItem() {
    if (!form.nom.trim() || !form.date_expiration) return;
    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        reference: form.reference.trim() || undefined,
        fournisseur: form.fournisseur.trim() || undefined,
        quantite: parseInt(form.quantite) || 1,
        prix_unitaire: parseFloat(form.prix_unitaire) || 0,
        date_expiration: form.date_expiration,
      };
      if (editItem) {
        await sdb.parapharmacie.update(editItem.id, payload);
        toast.success('Produit mis à jour');
      } else {
        await sdb.parapharmacie.insert(payload);
        toast.success('Produit ajouté');
      }
      setModalOpen(false);
      reload();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    await sdb.parapharmacie.delete(id);
    toast.success('Produit supprimé');
    reload();
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
          <div className="page-subtitle">{items.length} référence{items.length !== 1 ? 's' : ''} parapharmacie</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} />Ajouter un produit</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#f5f3ff' }}><ShoppingBag size={22} color="#8b5cf6" /></div>
          <div className="kpi-content">
            <div className="kpi-value">{items.length}</div>
            <div className="kpi-label">Références parapharmacie</div>
          </div>
        </div>
        <div className="kpi-card">
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

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Aucun produit parapharmacie</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Ajoutez vos premiers produits parapharmacie.</div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={15} />Ajouter un produit</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Produit</th><th>Référence</th><th>Fournisseur</th><th>Expiration</th><th>Qté</th><th>Prix unit.</th><th>Valeur</th><th>Urgence</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Aucun produit trouvé</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className={p.urgency === 'expired' || p.urgency === 'critical' ? 'row-critical' : p.urgency === 'warning' ? 'row-warning' : ''}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{p.nom}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.reference || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.fournisseur || '—'}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{new Date(p.date_expiration).toLocaleDateString('fr-FR')}</div>
                      <div style={{ fontSize: 11, color: p.days <= 0 ? 'var(--red-600)' : p.days <= 30 ? 'var(--orange-600)' : 'var(--yellow-600)', fontWeight: 600 }}>
                        {p.days <= 0 ? 'Périmé' : `${p.days}j`}
                      </div>
                    </td>
                    <td>{p.quantite}</td>
                    <td>{fmt(p.prix_unitaire)} €</td>
                    <td style={{ fontWeight: 600 }}>{fmt(p.quantite * p.prix_unitaire)} €</td>
                    <td><span className={`badge ${getBadgeClass(p.urgency)}`}>{p.urgency === 'expired' ? 'Périmé' : p.urgency === 'critical' ? 'Critique' : p.urgency === 'warning' ? 'Attention' : 'OK'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" title="Modifier" onClick={() => openEdit(p)}><Pencil size={13} /></button>
                        <button className="btn btn-sm btn-danger" title="Supprimer" onClick={() => deleteItem(p.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 20 }}>{editItem ? 'Modifier le produit' : 'Ajouter un produit parapharmacie'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nom du produit *</label>
                <input className="form-input" placeholder="Ex: Crème hydratante Avène" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} autoFocus />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Référence</label>
                  <input className="form-input" placeholder="SKU ou code produit" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Fournisseur</label>
                  <input className="form-input" placeholder="Ex: Avène, L'Oréal…" value={form.fournisseur} onChange={e => setForm(f => ({ ...f, fournisseur: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Quantité</label>
                  <input className="form-input" type="number" min="0" value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Prix unitaire (€)</label>
                  <input className="form-input" type="number" step="0.01" min="0" value={form.prix_unitaire} onChange={e => setForm(f => ({ ...f, prix_unitaire: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Date d'expiration *</label>
                  <input className="form-input" type="date" value={form.date_expiration} onChange={e => setForm(f => ({ ...f, date_expiration: e.target.value }))} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveItem} disabled={saving || !form.nom.trim() || !form.date_expiration}>
                {saving ? 'Sauvegarde…' : editItem ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
