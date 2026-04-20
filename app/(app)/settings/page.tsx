'use client';
import { useState, useEffect } from 'react';
import { Save, Building2, Bell, Lock } from 'lucide-react';
import { sdb } from '@/lib/supabase-db';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Pharmacy, AlertsConfig } from '@/lib/data';
import toast, { Toaster } from 'react-hot-toast';

type Tab = 'pharmacie' | 'alertes' | 'securite';

export default function SettingsPage() {
  const { pharmacy, refreshPharmacy } = useAuth();
  const [tab, setTab] = useState<Tab>('pharmacie');
  const [pharmaForm, setPharmaForm] = useState<Partial<Pharmacy>>({});
  const [alertsForm, setAlertsForm] = useState<AlertsConfig>({ seuil_critique: 30, seuil_urgent: 60, seuil_attention: 90, email_notifications: false, email_address: '' });
  const [pwdForm, setPwdForm] = useState({ newPwd: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPharmaForm({
      nom: pharmacy.nom, finess: pharmacy.finess, adresse: pharmacy.adresse,
      code_postal: pharmacy.code_postal, ville: pharmacy.ville,
      telephone: pharmacy.telephone, email: pharmacy.email, pharmacien: pharmacy.pharmacien,
    });
    sdb.alertsConfig.get().then(cfg => setAlertsForm(cfg));
  }, [pharmacy]);

  async function savePharmacie() {
    setSaving(true);
    await sdb.pharmacy.upsert(pharmaForm);
    refreshPharmacy();
    toast.success('Informations sauvegardées');
    setSaving(false);
  }

  async function saveAlertes() {
    setSaving(true);
    await sdb.alertsConfig.update(alertsForm);
    toast.success('Configuration des alertes sauvegardée');
    setSaving(false);
  }

  async function savePassword() {
    if (pwdForm.newPwd !== pwdForm.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (pwdForm.newPwd.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwdForm.newPwd });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Mot de passe mis à jour');
      setPwdForm({ newPwd: '', confirm: '' });
    }
    setSaving(false);
  }

  const inputProps = (label: string, key: keyof Pharmacy, type = 'text') => ({
    id: key, type, value: (pharmaForm[key] as string) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPharmaForm(f => ({ ...f, [key]: e.target.value })),
    className: 'form-input',
    placeholder: label,
  });

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'pharmacie', label: 'Ma pharmacie', icon: <Building2 size={15} /> },
    { key: 'alertes', label: 'Alertes', icon: <Bell size={15} /> },
    { key: 'securite', label: 'Sécurité', icon: <Lock size={15} /> },
  ];

  return (
    <div className="fade-in">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <div className="page-subtitle">Gérez les informations de votre pharmacie et vos préférences</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface-3)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, transition: 'all .15s',
              background: tab === t.key ? 'var(--surface)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: tab === t.key ? 'var(--shadow-xs)' : 'none' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'pharmacie' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 24 }}>Informations de la pharmacie</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label htmlFor="nom" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nom de la pharmacie</label>
              <input {...inputProps('Pharmacie de la Mairie', 'nom')} />
            </div>
            <div>
              <label htmlFor="pharmacien" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Pharmacien titulaire</label>
              <input {...inputProps('Dr. Dupont', 'pharmacien')} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="finess" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Numéro FINESS</label>
            <input {...inputProps('0000000000', 'finess')} style={{ maxWidth: 200 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="adresse" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Adresse</label>
            <input {...inputProps('1 rue de la Paix', 'adresse')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label htmlFor="code_postal" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Code postal</label>
              <input {...inputProps('75000', 'code_postal')} />
            </div>
            <div>
              <label htmlFor="ville" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Ville</label>
              <input {...inputProps('Paris', 'ville')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label htmlFor="telephone" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Téléphone</label>
              <input {...inputProps('01 23 45 67 89', 'telephone')} type="tel" />
            </div>
            <div>
              <label htmlFor="email" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
              <input {...inputProps('pharmacie@example.fr', 'email')} type="email" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={savePharmacie} disabled={saving}>
            <Save size={15} />{saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      )}

      {tab === 'alertes' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 24 }}>Configuration des alertes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
            {([
              { key: 'seuil_critique' as const, label: 'Seuil critique', color: 'var(--red-600)', desc: 'Alertes rouges' },
              { key: 'seuil_urgent' as const, label: 'Seuil urgent', color: 'var(--orange-600)', desc: 'Alertes orange' },
              { key: 'seuil_attention' as const, label: 'Seuil attention', color: 'var(--yellow-600)', desc: 'Alertes jaunes' },
            ]).map(({ key, label, color, desc }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{desc}</span>
                  </div>
                  <span style={{ fontWeight: 800, color, fontSize: 18 }}>{alertsForm[key]}j</span>
                </div>
                <input type="range" min="7" max="180" value={alertsForm[key]}
                  onChange={e => setAlertsForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                  style={{ width: '100%', accentColor: color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>7 jours</span><span>180 jours</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications email</label>
              <button onClick={() => setAlertsForm(f => ({ ...f, email_notifications: !f.email_notifications }))}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'background .2s',
                  background: alertsForm.email_notifications ? 'var(--brand-500)' : 'var(--border)', position: 'relative' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, transition: 'left .2s',
                  left: alertsForm.email_notifications ? 23 : 3, boxShadow: '0 1px 4px #0002' }} />
              </button>
            </div>
            {alertsForm.email_notifications && (
              <input className="form-input" type="email" placeholder="alerts@pharmacie.fr"
                value={alertsForm.email_address || ''}
                onChange={e => setAlertsForm(f => ({ ...f, email_address: e.target.value }))} />
            )}
          </div>
          <button className="btn btn-primary" onClick={saveAlertes} disabled={saving}>
            <Save size={15} />{saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      )}

      {tab === 'securite' && (
        <div className="card" style={{ maxWidth: 420 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 24 }}>Changer le mot de passe</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
              <input className="form-input" type="password" placeholder="Minimum 8 caractères" value={pwdForm.newPwd}
                onChange={e => setPwdForm(f => ({ ...f, newPwd: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Confirmer le mot de passe</label>
              <input className="form-input" type="password" placeholder="Répétez le mot de passe" value={pwdForm.confirm}
                onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} />
              {pwdForm.confirm && pwdForm.newPwd !== pwdForm.confirm && (
                <div style={{ fontSize: 12, color: 'var(--red-600)', marginTop: 4 }}>Les mots de passe ne correspondent pas</div>
              )}
            </div>
          </div>
          <button className="btn btn-primary" onClick={savePassword} disabled={saving || !pwdForm.newPwd || pwdForm.newPwd !== pwdForm.confirm}>
            <Lock size={15} />{saving ? 'Mise à jour…' : 'Mettre à jour'}
          </button>
        </div>
      )}
    </div>
  );
}
