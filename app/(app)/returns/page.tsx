'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, Send, CheckCircle } from 'lucide-react';
import { sdb } from '@/lib/supabase-db';
import type { Return, ReturnItem, Product } from '@/lib/data';
import toast, { Toaster } from 'react-hot-toast';

type StatusKey = 'brouillon' | 'envoye' | 'valide';
const STATUS_LABELS: Record<StatusKey, { label: string; badge: string }> = {
  brouillon: { label: 'Brouillon', badge: 'badge-gray' },
  envoye: { label: 'Envoyé', badge: 'badge-blue' },
  valide: { label: 'Validé', badge: 'badge-ok' },
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<ReturnItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newLab, setNewLab] = useState('');
  const [addItemOpen, setAddItemOpen] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');

  const reload = useCallback(async () => {
    const [r, p] = await Promise.all([sdb.returns.getAll(), sdb.products.getAll()]);
    setReturns(r); setProducts(p); setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  async function createReturn() {
    if (!newLab.trim()) return;
    await sdb.returns.insert({ laboratoire: newLab.trim(), status: 'brouillon', total_valeur: 0 });
    toast.success('Dossier créé');
    setNewLab(''); setCreateOpen(false);
    reload();
  }

  async function deleteReturn(id: string) {
    await sdb.returns.delete(id);
    toast.success('Dossier supprimé');
    if (expandedId === id) setExpandedId(null);
    reload();
  }

  async function advanceStatus(ret: Return) {
    const next: Record<StatusKey, StatusKey> = { brouillon: 'envoye', envoye: 'valide', valide: 'valide' };
    const now = new Date().toISOString();
    const update: Partial<Return> = { status: next[ret.status as StatusKey] };
    if (ret.status === 'brouillon') update.date_envoi = now;
    if (ret.status === 'envoye') update.date_validation = now;
    await sdb.returns.update(ret.id, update);
    toast.success(`Statut mis à jour`);
    reload();
  }

  async function expandReturn(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const items = await sdb.returnItems.getByReturn(id);
    setExpandedItems(items);
  }

  async function addItem() {
    if (!addItemOpen || !selectedProduct) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    const qty = parseInt(selectedQty) || 1;
    const valeur = qty * product.prix_unitaire;
    await sdb.returnItems.insert({
      return_id: addItemOpen,
      product_id: product.id,
      nom: product.nom,
      cip_code: product.cip_code,
      quantite: qty,
      prix_unitaire: product.prix_unitaire,
      valeur,
    });
    const currentReturn = returns.find(r => r.id === addItemOpen);
    if (currentReturn) {
      await sdb.returns.update(addItemOpen, { total_valeur: (currentReturn.total_valeur || 0) + valeur });
    }
    toast.success('Article ajouté');
    setAddItemOpen(null); setSelectedProduct(''); setSelectedQty('1');
    const items = await sdb.returnItems.getByReturn(expandedId!);
    setExpandedItems(items);
    reload();
  }

  async function removeItem(item: ReturnItem) {
    await sdb.returnItems.delete(item.id);
    const currentReturn = returns.find(r => r.id === item.return_id);
    if (currentReturn) {
      await sdb.returns.update(item.return_id, { total_valeur: Math.max(0, (currentReturn.total_valeur || 0) - item.valeur) });
    }
    toast.success('Article retiré');
    const items = await sdb.returnItems.getByReturn(item.return_id);
    setExpandedItems(items);
    reload();
  }

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalValide = returns.filter(r => r.status === 'valide').reduce((s, r) => s + (r.total_valeur || 0), 0);

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
          <div className="page-subtitle">{returns.length} dossier{returns.length !== 1 ? 's' : ''} · {fmt(totalValide)} € validés</div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={15} />Nouveau dossier</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        {(['brouillon', 'envoye', 'valide'] as StatusKey[]).map(s => {
          const count = returns.filter(r => r.status === s).length;
          const val = returns.filter(r => r.status === s).reduce((sum, r) => sum + (r.total_valeur || 0), 0);
          const colors: Record<StatusKey, string> = { brouillon: '#64748b', envoye: 'var(--brand-600)', valide: 'var(--green-600)' };
          return (
            <div key={s} className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: colors[s] }}>{count}</div>
                <div className="kpi-label">{STATUS_LABELS[s].label}</div>
                <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>{fmt(val)} €</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {returns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Aucun dossier de retour. Créez votre premier dossier.
          </div>
        ) : returns.map(ret => {
          const s = ret.status as StatusKey;
          const isExpanded = expandedId === ret.id;
          return (
            <div key={ret.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer' }} onClick={() => expandReturn(ret.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{ret.laboratoire}</span>
                    <span className={`badge ${STATUS_LABELS[s].badge}`}>{STATUS_LABELS[s].label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Créé le {new Date(ret.date_creation).toLocaleDateString('fr-FR')}
                    {ret.date_envoi && ` · Envoyé le ${new Date(ret.date_envoi).toLocaleDateString('fr-FR')}`}
                    {ret.date_validation && ` · Validé le ${new Date(ret.date_validation).toLocaleDateString('fr-FR')}`}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', flexShrink: 0 }}>{fmt(ret.total_valeur || 0)} €</div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {s !== 'valide' && (
                    <button className="btn btn-sm btn-primary" title={s === 'brouillon' ? 'Envoyer' : 'Valider'}
                      onClick={e => { e.stopPropagation(); advanceStatus(ret); }}>
                      {s === 'brouillon' ? <><Send size={13} />Envoyer</> : <><CheckCircle size={13} />Valider</>}
                    </button>
                  )}
                  <button className="btn btn-sm btn-danger" title="Supprimer" onClick={e => { e.stopPropagation(); deleteReturn(ret.id); }}>
                    <Trash2 size={13} />
                  </button>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'var(--surface-2)' }}>
                  {expandedItems.length > 0 ? (
                    <div className="table-scroll" style={{ marginBottom: 12 }}>
                      <table className="data-table">
                        <thead><tr><th>Produit</th><th>CIP</th><th>Qté</th><th>Prix unit.</th><th>Valeur</th><th></th></tr></thead>
                        <tbody>
                          {expandedItems.map(item => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 600 }}>{item.nom}</td>
                              <td>{item.cip_code || '—'}</td>
                              <td>{item.quantite}</td>
                              <td>{fmt(item.prix_unitaire)} €</td>
                              <td style={{ fontWeight: 700 }}>{fmt(item.valeur)} €</td>
                              <td>
                                {ret.status === 'brouillon' && (
                                  <button className="btn btn-sm btn-danger" onClick={() => removeItem(item)}><Trash2 size={12} /></button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>Aucun article dans ce dossier.</div>
                  )}
                  {ret.status === 'brouillon' && (
                    <button className="btn btn-sm btn-secondary" onClick={() => setAddItemOpen(ret.id)}>
                      <Plus size={13} />Ajouter un article
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 20 }}>Nouveau dossier de retour</div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Laboratoire</label>
            <input className="form-input" placeholder="Ex: Sanofi, Arrow…" value={newLab} onChange={e => setNewLab(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createReturn()} autoFocus style={{ marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setCreateOpen(false); setNewLab(''); }}>Annuler</button>
              <button className="btn btn-primary" onClick={createReturn} disabled={!newLab.trim()}>Créer</button>
            </div>
          </div>
        </div>
      )}

      {addItemOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 20 }}>Ajouter un article</div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Produit</label>
            <select className="form-input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{ marginBottom: 16 }}>
              <option value="">Sélectionner un produit…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.nom} — {p.stock} unités</option>)}
            </select>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Quantité</label>
            <input className="form-input" type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(e.target.value)} style={{ marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setAddItemOpen(null); setSelectedProduct(''); setSelectedQty('1'); }}>Annuler</button>
              <button className="btn btn-primary" onClick={addItem} disabled={!selectedProduct}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
