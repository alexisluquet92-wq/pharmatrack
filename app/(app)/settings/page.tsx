'use client';
import { useState, useEffect } from 'react';
import { Save, Building2, Lock } from 'lucide-react';
import { sdb } from '@/lib/supabase-db';
import { createClient } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

type Tab = 'pharmacie' | 'securite';

type PharmaForm = {
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
  pharmacien: string;
};

const EMPTY_FORM: PharmaForm = {
  nom: '', adresse: '', code_postal: '', ville: '', telephone: '', email: '', pharmacien: '',
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('pharmacie');
  const [pharmaForm, setPharmaForm] = useState<PharmaForm>(EMPTY_FORM);
  const [pwdForm, setPwdForm] = useState({ newPwd: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sdb.pharmacy.get().then(p => {
      if (!p) return;
      setPharmaForm({
        nom: p.nom ?? '',
        adresse: p.adresse ?? '',
        code_postal: p.code_postal ?? '',
        ville: p.ville ?? '',
        telephone: p.telephone ?? '',
        email: p.email ?? '',
        pharmacien: p.pharmacien ?? '',
      });
    });
  }, []);

  async function savePharmacie() {
    setSaving(true);
    await sdb.pharmacy.upsert(pharmaForm);
    toast.success('Informations sauvegardées');
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

  const field = (label: string, key: keyof PharmaForm, type = 'text') => ({
    id: key, type,
    value: pharmaForm[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPharmaForm(f => ({ ...f, [key]: e.target.value })),
    className: 'form-input',
    placeholder: label,
  });

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'pharmacie', label: 'Ma pharmacie', icon: <Building2 size={15} /> },
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
              <input {...field('Pharmacie de la Mairie', 'nom')} />
            </div>
            <div>
              <label htmlFor="pharmacien" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Pharmacien titulaire</label>
              <input {...field('Dr. Dupont', 'pharmacien')} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="adresse" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Adresse</label>
            <input {...field('1 rue de la Paix', 'adresse')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label htmlFor="code_postal" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Code postal</label>
              <input {...field('75000', 'code_postal')} />
            </div>
            <div>
              <label htmlFor="ville" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Ville</label>
              <input {...field('Paris', 'ville')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label htmlFor="telephone" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Téléphone</label>
              <input {...field('01 23 45 67 89', 'telephone', 'tel')} />
            </div>
            <div>
              <label htmlFor="email" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
              <input {...field('pharmacie@example.fr', 'email', 'email')} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={savePharmacie} disabled={saving}>
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
