'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { FlaskConical, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  const inputStyle = (focused?: boolean): React.CSSProperties => ({
    width: '100%', padding: '11px 13px 11px 38px', border: `1.5px solid ${focused ? 'var(--brand-500)' : 'var(--border)'}`,
    borderRadius: 9, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff',
    color: 'var(--text-primary)', transition: 'border-color .15s', boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px #0ea5e91f' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>

      {/* Left panel */}
      <div style={{ width: '44%', minWidth: 360, background: 'linear-gradient(160deg, #0f1f3d 0%, #1e3a5f 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px #0284c766' }}>
            <FlaskConical size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1 }}>PharmaTrack</div>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>Gestion des périmés</div>
          </div>
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.3, marginBottom: 16 }}>
          Réduisez vos pertes<br />sur médicaments périmés.
        </div>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: 44 }}>
          La solution SaaS dédiée aux pharmaciens titulaires pour prévenir, gérer et valoriser les stocks à péremption courte.
        </p>

        {['Alertes péremption en temps réel', 'Gestion des retours laboratoire', 'Rapports ROI et économies réalisées', 'Import depuis votre logiciel métier (LGO)'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(14,165,233,.25)', border: '1px solid rgba(14,165,233,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>✓</div>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,.8)' }}>{f}</span>
          </div>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: 48, fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
          © 2026 PharmaTrack · Tous droits réservés
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Connexion</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Accédez à votre espace pharmacie</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Adresse email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="email" placeholder="pharmacien@officine.fr" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                  style={inputStyle()} onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand-500)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                  style={{ ...inputStyle(), paddingRight: 40 }} onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand-500)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--red-50)', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, marginTop: 12, fontSize: 13.5, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 20, padding: '12px 16px', background: loading ? '#93c5fd' : 'linear-gradient(135deg, var(--brand-500), var(--brand-700))', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading
                ? <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Connexion…</>
                : 'Se connecter'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
            Pas encore de compte ?{' '}
            <a href="mailto:contact@pharmatrack.fr" style={{ color: 'var(--brand-600)', fontWeight: 600, textDecoration: 'none' }}>Contactez-nous</a>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
