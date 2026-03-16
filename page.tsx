'use client';
import { useState } from 'react';
import { Check, CreditCard, Download, ArrowUpCircle } from 'lucide-react';
import Toast from '@/components/Toast';

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 99, desc: 'Pour les petites officines',
    features: ['Jusqu\'à 500 références', 'Alertes péremption', 'Tableau de bord basique', 'Export CSV', 'Support email'],
    notIncluded: ['Retours laboratoire', 'Rapports ROI avancés', 'API intégration', 'Multi-utilisateurs'],
  },
  {
    id: 'pro', name: 'Pro', price: 199, desc: 'Le plus populaire', current: true,
    features: ['Références illimitées', 'Alertes péremption avancées', 'Tableau de bord complet', 'Retours laboratoire', 'Rapports ROI', 'Export CSV / PDF', 'Intégrations logiciels', 'Support prioritaire'],
    notIncluded: ['Multi-sites', 'API personnalisée'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 499, desc: 'Groupements & chaînes',
    features: ['Tout Pro inclus', 'Multi-sites illimités', 'API personnalisée', 'Tableau de bord consolidé', 'Onboarding dédié', 'SLA 99.9%', 'Account manager dédié', 'Formation équipe'],
    notIncluded: [],
  },
];

const INVOICES = [
  { ref: 'FAC-2026-031', date: '01/03/2026', amount: 199, status: 'payé' },
  { ref: 'FAC-2026-021', date: '01/02/2026', amount: 199, status: 'payé' },
  { ref: 'FAC-2026-011', date: '01/01/2026', amount: 199, status: 'payé' },
  { ref: 'FAC-2025-121', date: '01/12/2025', amount: 199, status: 'payé' },
];

export default function SubscriptionPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Abonnement</h1>
          <p className="page-subtitle">Gérez votre plan et votre facturation</p>
        </div>
      </div>

      {/* Current plan */}
      <div className="card" style={{ marginBottom: 24, borderColor: '#2563eb', borderWidth: 2 }}>
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={24} color="#2563eb" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 18 }}>Plan Pro</span>
                <span className="badge badge-blue">Actif</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>199 € / mois · Renouvellement le 01/04/2026</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => notify('⚙️ Gestion du paiement ouverte')}>Gérer le paiement</button>
            <button className="btn btn-primary" onClick={() => setShowUpgrade(true)}><ArrowUpCircle size={14} /> Passer à Enterprise</button>
          </div>
        </div>
      </div>

      {/* Plans comparison */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {PLANS.map(plan => (
          <div key={plan.id} className={`plan-card${plan.current ? ' current' : ''}`}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{plan.name}</div>
                {plan.current && <span className="badge badge-blue">Votre plan</span>}
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>{plan.desc}</div>
              <div>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#1e293b' }}>{plan.price} €</span>
                <span style={{ fontSize: 13, color: '#94a3b8' }}> / mois</span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 13 }}>
                  <Check size={14} color="#16a34a" style={{ flexShrink: 0 }} /> {f}
                </div>
              ))}
              {plan.notIncluded.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 13, color: '#94a3b8' }}>
                  <span style={{ width: 14, height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>–</span> {f}
                </div>
              ))}
            </div>
            <button
              className={`btn${plan.current ? ' btn-secondary' : ' btn-primary'}`}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                if (!plan.current) { setSelectedPlan(plan.name); setShowUpgrade(true); }
                else notify('✅ Vous êtes déjà sur ce plan');
              }}
            >
              {plan.current ? 'Plan actuel' : plan.price > 199 ? '⬆️ Upgrader' : '⬇️ Downgrader'}
            </button>
          </div>
        ))}
      </div>

      {/* Invoices */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🧾 Historique de facturation</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Référence</th><th>Date</th><th>Montant</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {INVOICES.map(inv => (
                <tr key={inv.ref}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.ref}</td>
                  <td>{inv.date}</td>
                  <td style={{ fontWeight: 700 }}>{inv.amount} €</td>
                  <td><span className="badge badge-success">✓ {inv.status}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => notify(`📄 Facture ${inv.ref} téléchargée`)}>
                      <Download size={12} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowUpgrade(false)}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">⬆️ Changer de plan</div>
                <div className="modal-subtitle">Vers le plan {selectedPlan || 'Enterprise'}</div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowUpgrade(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13.5, color: '#374151', marginBottom: 16 }}>
                Votre changement de plan sera effectif immédiatement. La différence de prix sera calculée au prorata du mois en cours.
              </p>
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px 16px', fontSize: 13.5, color: '#166534', fontWeight: 600 }}>
                Vous bénéficierez de toutes les fonctionnalités du plan {selectedPlan || 'Enterprise'} dès maintenant.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowUpgrade(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={() => { setShowUpgrade(false); notify(`✅ Plan ${selectedPlan || 'Enterprise'} activé avec succès !`); }}>
                Confirmer le changement
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
