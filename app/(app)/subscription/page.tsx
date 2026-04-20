'use client';
import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter', price: '29€', period: '/mois', color: '#64748b',
    features: ['1 pharmacie', 'Import CSV', 'Alertes email', '500 références'],
  },
  {
    name: 'Pro', price: '79€', period: '/mois', color: 'var(--brand-600)', current: true,
    features: ['1 pharmacie', 'Import CSV + XLSX', 'Alertes SMS + email', 'Références illimitées', 'Rapports ROI', 'Retours laboratoire'],
  },
  {
    name: 'Enterprise', price: '199€', period: '/mois', color: '#7c3aed',
    features: ["Jusqu'à 10 pharmacies", 'API directe logiciels', 'Support prioritaire', 'Tableaux de bord avancés', 'Export comptable'],
  },
];

const FAQS = [
  { q: 'Comment importer mes données ?', a: "Rendez-vous sur la page Import et glissez-déposez votre fichier CSV ou Excel exporté depuis votre logiciel métier (LGO). PharmaTrack reconnaît automatiquement les colonnes nom, CIP, stock, prix et date d'expiration." },
  { q: 'Mes données sont-elles sécurisées ?', a: 'Oui. Toutes vos données sont stockées de manière sécurisée via Supabase (chiffrement en transit et au repos). Chaque pharmacie accède uniquement à ses propres données.' },
  { q: 'Comment fonctionne le système d\'alertes ?', a: 'PharmaTrack surveille en temps réel vos dates de péremption. Vous recevez des alertes pour les produits périmés, critiques (≤30j), et en attention (≤90j). Les seuils sont configurables dans Paramètres.' },
  { q: 'Puis-je changer de plan à tout moment ?', a: 'Oui. Vous pouvez upgrader ou downgrader votre plan à tout moment. La facturation est au prorata du mois en cours.' },
  { q: 'Comment créer un dossier de retour laboratoire ?', a: "Sur la page Retours Laboratoire, cliquez sur \"Nouveau dossier\", sélectionnez le laboratoire, ajoutez les articles concernés et suivez le workflow : Brouillon → Envoyé → Validé." },
  { q: 'Comment contacter le support ?', a: 'Envoyez un email à contact@pharmatrack.fr. Notre équipe répond sous 24h ouvrées.' },
];

export default function SubscriptionPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Aide & Abonnement</h1>
          <div className="page-subtitle">Gérez votre abonnement et consultez nos ressources</div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 32 }}>
        {PLANS.map(plan => (
          <div key={plan.name} className="card" style={{ padding: 24, border: plan.current ? `2px solid ${plan.color}` : undefined, position: 'relative' }}>
            {plan.current && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99 }}>
                PLAN ACTUEL
              </div>
            )}
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: 'var(--text-primary)' }}>{plan.name}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: plan.color, marginBottom: 16 }}>
              {plan.price}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>{plan.period}</span>
            </div>
            <ul style={{ margin: '0 0 20px', padding: 0, listStyle: 'none' }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <Check size={14} color={plan.color} strokeWidth={2.5} style={{ flexShrink: 0 }} />{f}
                </li>
              ))}
            </ul>
            <button
              style={{ width: '100%', padding: '10px 16px', background: plan.current ? 'var(--surface-3)' : plan.color, color: plan.current ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: plan.current ? 'default' : 'pointer' }}
              disabled={plan.current}>
              {plan.current ? 'Plan actuel' : 'Choisir ce plan'}
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Questions fréquentes</div></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', gap: 12 }}>
                <span>{faq.q}</span>
                {openFaq === i ? <ChevronUp size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 4px 16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Besoin d&apos;aide supplémentaire ?</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 16 }}>Notre équipe est disponible pour vous accompagner.</div>
        <a href="mailto:contact@pharmatrack.fr" className="btn btn-primary" style={{ textDecoration: 'none' }}>Contacter le support</a>
      </div>
    </div>
  );
}
