'use client';
import { X } from 'lucide-react';
import { Drug, ParaProduct, ActionType } from '@/lib/data';
import { useState } from 'react';

type Item = Drug | ParaProduct;

interface Props {
  drug: Item;
  action: ActionType;
  onConfirm: (data: Record<string, string>) => void;
  onClose: () => void;
}

export default function ActionModal({ drug, action, onConfirm, onClose }: Props) {
  const [form, setForm] = useState<Record<string, string>>({
    quantity: String(drug.stock),
    notes: '',
    date: new Date().toISOString().split('T')[0],
    contact: '',
    discount: '20',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const config: Record<ActionType, { title: string; color: string; icon: string; desc: string }> = {
    retour: { title: 'Retour laboratoire', color: '#2563eb', icon: '↩️', desc: 'Initier un retour auprès du laboratoire fournisseur.' },
    liquidation: { title: 'Liquidation urgente', color: '#dc2626', icon: '🔻', desc: 'Déclencher une procédure de liquidation pour écouler le stock.' },
    promotion: { title: 'Mise en promotion', color: '#ea580c', icon: '🏷️', desc: 'Appliquer une remise pour accélérer l\'écoulement.' },
    surveillance: { title: 'Mise en surveillance', color: '#7c3aed', icon: '👁️', desc: 'Placer cet article sous surveillance renforcée.' },
  };

  const c = config[action];
  const totalVal = (drug.stock * drug.pricePerUnit * parseInt(form.quantity || '0') / drug.stock).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
            <div className="modal-title">{c.title}</div>
            <div className="modal-subtitle">{drug.name} · Stock: {drug.stock} unités · Expire: {'expiryDate' in drug ? drug.expiryDate : ''}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#64748b', borderLeft: `3px solid ${c.color}` }}>
            {c.desc}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantité concernée</label>
              <input className="form-control" type="number" min={1} max={drug.stock} value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date d'action</label>
              <input className="form-control" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>

          {action === 'promotion' && (
            <div className="form-group">
              <label className="form-label">Remise appliquée (%)</label>
              <input className="form-control" type="number" min={5} max={80} value={form.discount} onChange={e => set('discount', e.target.value)} />
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Prix après remise : {(drug.pricePerUnit * (1 - parseInt(form.discount || '0') / 100)).toFixed(2)} € / u
              </div>
            </div>
          )}

          {action === 'retour' && (
            <div className="form-group">
              <label className="form-label">Contact laboratoire</label>
              <input className="form-control" type="text" placeholder="Nom du référent ou email" value={form.contact} onChange={e => set('contact', e.target.value)} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notes / Instructions</label>
            <textarea className="form-control" rows={3} placeholder="Informations complémentaires..." value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Valeur traitée :</span>
            <span>{totalVal}</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" style={{ background: c.color }} onClick={() => onConfirm(form)}>
            {c.icon} Confirmer l'action
          </button>
        </div>
      </div>
    </div>
  );
}
