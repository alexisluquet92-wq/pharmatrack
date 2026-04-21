'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { sdb } from '@/lib/supabase-db';
import type { Return, Product } from '@/lib/data';
import toast, { Toaster } from 'react-hot-toast';

type Statut = 'en_attente' | 'valide' | 'refuse';

const STATUT_CONFIG: Record<Statut, { label: string; badge: string; color: string }> = {
  en_attente: { label: 'En attente', badge: 'badge-gray', color: '#64748b' },
  valide:     { label: 'Validé',     badge: 'badge-ok',   color: 'var(--green-600)' },
  refuse:     { label: 'Refusé',     badge: 'badge-expired', color: 'var(--red-600)' },
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    product_id: '',
    nom_produit: '',
    laboratoire: '',
    quantite: '1',
    motif: '',
    montant_estime: '',
    date_retour: new Date().toISOString().split('T')[0],
  });

  const reload = useCallback(async () => {
    const [r, p] = await Promise.all([sdb.returns.getAll(), sdb.products.getAll()]);
    setReturns(r); setProducts(p); setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  function handleProductChange(productId: string) {
    const product = products.find(p => p.id === productId);
    const qty = parseInt(form.quantite) || 1;
    setForm(f => ({
      ...f,
      product_id: productId,
      nom_produit: product?.nom || '',
      laboratoire: product?.laboratoire || '',
      montant_estime: product ? String((qty * product.prix_unitaire).toFixed(2)) : '',
    }));
  }

  function handleQtyChange(qty: string) {
    const product = products.find(p => p.id === form.product_id);
    setForm(f => ({
      ...f,
      quantite: qty,
      montant_estime: product && qty ? String((parseInt(qty) * product.prix_unitaire).toFixed(2)) : f.montant_estime,
    }));
  }

  async function createReturn() {
    if (!form.nom_produit.trim()) return;
    await sdb.returns.insert({
      product_id: form.product_id || undefined,
      nom_produit: form.nom_produit.trim(),
      laboratoire: form.laboratoire.trim() || undefined,
      quantite: parseInt(form.quantite) || 1,
      motif: form.motif.trim() || undefined,
      statut: 'en_attente',
      date_retour: form.date_retour || new Date().toISOString().split('T')[0],
      montant_estime: form.montant_estime ? parseFloat(form.montant_estime) : undefined,
    });
    toast.success('Retour créé');
    setCreateOpen(false);
    setForm({ product_id: '', nom_produit: '', laboratoire: '', quantite: '1', motif: '', montant_estime: '', date_retour: new Date().toISOString().split('T')[0] });
    reload();
  }

  async function updateStatut(id: string, statut: Statut) {
    await sdb.returns.update(id, { statut });
    toast.success(`Statut mis à jour : ${STATUT_CONFIG[statut].label}`);
    reload();
  }

  async function deleteReturn(id: string) {
    await sdb.returns.delete(id);
    toast.success('Retour supprimé');
    reload();
  }

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalValide = returns.filter(r => r.statut === 'valide').reduce((s, r) => s + (r.montant_estime || 0), 0);

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
          <h1 className="page-title">Retours Laboratoire</h1>
          <div className="page-subtitle">{returns.length} retour{returns.length !== 1 ? 's' : ''} · {fmt(totalValide)} € validés</div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={15} />Nouveau retour</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        {(['en_attente', 'valide', 'refuse'] as Statut[]).map(s => {
          const count = returns.filter(r => r.statut === s).length;
          const val = returns.filter(r => r.statut === s).reduce((sum, r) => sum + (r.montant_estime || 0), 0);
          return (
            <div key={s} className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: STATUT_CONFIG[s].color }}>{count}</div>
                <div className="kpi-label">{STATUT_CONFIG[s].label}</div>
                <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>{fmt(val)} €</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produit</th><th>Laboratoire</th><th>Qté</th><th>Motif</th>
                <th>Montant estimé</th><th>Date retour</th><th>Statut</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Aucun retour. Créez votre premier retour laboratoire.
                </td></tr>
              ) : returns.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.nom_produit}</td>
                  <td>{r.laboratoire || '—'}</td>
                  <td>{r.quantite}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{r.motif || '—'}</td>
                  <td style={{ fontWeight: 700 }}>{r.montant_estime != null ? `${fmt(r.montant_estime)} €` : '—'}</td>
                  <td>{new Date(r.date_retour).toLocaleDateString('fr-FR')}</td>
                  <td><span className={`badge ${STATUT_CONFIG[r.statut].badge}`}>{STATUT_CONFIG[r.statut].label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.statut === 'en_attente' && (
                        <>
                          <button className="btn btn-sm btn-primary" title="Valider" onClick={() => updateStatut(r.id, 'valide')}>
                            <CheckCircle size={13} />
                          </button>
                          <button className="btn btn-sm btn-secondary" title="Refuser" onClick={() => updateStatut(r.id, 'refuse')}>
                            <XCircle size={13} />
                          </button>
                        </>
                      )}
                      {r.statut !== 'en_attente' && (
                        <button className="btn btn-sm btn-secondary" title="Remettre en attente" onClick={() => updateStatut(r.id, 'en_attente')}>
                          <Clock size={13} />
                        </button>
                      )}
                      <button className="btn btn-sm btn-danger" title="Supprimer" onClick={() => deleteReturn(r.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 20 }}>Nouveau retour laboratoire</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Produit (depuis votre stock)</label>
                <select className="form-input" value={form.product_id} onChange={e => handleProductChange(e.target.value)}>
                  <option value="">Sélectionner ou saisir manuellement…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nom}{p.laboratoire ? ` — ${p.laboratoire}` : ''}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nom du produit *</label>
                <input className="form-input" placeholder="Ex: Doliprane 1000mg" value={form.nom_produit}
                  onChange={e => setForm(f => ({ ...f, nom_produit: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Laboratoire</label>
                  <input className="form-input" placeholder="Ex: Sanofi" value={form.laboratoire}
                    onChange={e => setForm(f => ({ ...f, laboratoire: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Quantité</label>
                  <input className="form-input" type="number" min="1" value={form.quantite}
                    onChange={e => handleQtyChange(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Montant estimé (€)</label>
                  <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.montant_estime}
                    onChange={e => setForm(f => ({ ...f, montant_estime: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Date de retour</label>
                  <input className="form-input" type="date" value={form.date_retour}
                    onChange={e => setForm(f => ({ ...f, date_retour: e.target.value }))} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Motif</label>
                <input className="form-input" placeholder="Ex: Périmé, Rappel lot, Invendu…" value={form.motif}
                  onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => { setCreateOpen(false); setForm({ product_id: '', nom_produit: '', laboratoire: '', quantite: '1', motif: '', montant_estime: '', date_retour: new Date().toISOString().split('T')[0] }); }}>Annuler</button>
              <button className="btn btn-primary" onClick={createReturn} disabled={!form.nom_produit.trim()}>Créer le retour</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
