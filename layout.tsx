'use client';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Bell, ArrowLeftRight, FileBarChart2,
  Upload, CreditCard, Settings, LogOut, TriangleAlert, ShoppingBag
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/alerts', label: 'Alertes', icon: Bell, badge: 7 },
  { href: '/parapharmacie', label: 'Parapharmacie', icon: ShoppingBag, badge: 3 },
  { href: '/returns', label: 'Retours laboratoire', icon: ArrowLeftRight },
  { href: '/reports', label: 'Rapports ROI', icon: FileBarChart2 },
  { href: '/import', label: 'Import données', icon: Upload },
  { href: '/subscription', label: 'Abonnement', icon: CreditCard },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showUser, setShowUser] = useState(false);

  const pageTitle: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/alerts': 'Alertes péremption',
    '/parapharmacie': 'Parapharmacie',
    '/returns': 'Retours laboratoire',
    '/reports': 'Rapports ROI',
    '/import': 'Import données',
    '/subscription': 'Abonnement',
    '/settings': 'Paramètres',
  };

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <html lang="fr">
      <head>
        <title>PharmaTrack – Gestion des périmés</title>
        <meta name="description" content="Logiciel SaaS pour prévenir et gérer les pertes sur médicaments périmés en pharmacie." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app-shell">
          {/* SIDEBAR */}
          <aside className="sidebar">
            {/* Logo */}
            <div style={{ padding: '24px 20px 8px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TriangleAlert size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>PharmaTrack</div>
                  <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>Gestion des périmés</div>
                </div>
              </div>
            </div>

            {/* Pharmacie info */}
            <div style={{ padding: '12px 16px', margin: '12px 12px 4px', background: 'rgba(255,255,255,.1)', borderRadius: 10 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>Pharmacie du Centre</div>
              <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 12 }}>Lyon · Plan Pro</div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '8px 0' }}>
              <div style={{ padding: '8px 20px 4px', color: 'rgba(255,255,255,.4)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Navigation</div>
              {NAV.map(({ href, label, icon: Icon, badge }) => (
                <Link key={href} href={href} className={`nav-item${pathname === href ? ' active' : ''}`}>
                  <Icon size={17} aria-hidden />
                  {label}
                  {badge && (
                    <span style={{ marginLeft: 'auto', background: pathname === href ? 'rgba(255,255,255,.3)' : '#ef4444', color: '#fff', minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{badge}</span>
                  )}
                </Link>
              ))}

              <div style={{ padding: '16px 20px 4px', marginTop: 8, borderTop: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.4)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Compte</div>
              <Link href="/settings" className={`nav-item${pathname === '/settings' ? ' active' : ''}`}>
                <Settings size={17} /> Paramètres
              </Link>
              <button className="nav-item" onClick={() => alert('Déconnexion')}>
                <LogOut size={17} /> Déconnexion
              </button>
            </nav>

            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.35)', fontSize: 11 }}>
              PharmaTrack v2.0 · Mode Démo
            </div>
          </aside>

          {/* MAIN */}
          <div className="main-content">
            <div className="demo-banner">🧪 Mode Démo actif – Données simulées pour illustration</div>

            <header className="main-header">
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b' }}>{pageTitle[pathname] || 'PharmaTrack'}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Pharmacie du Centre · Lyon · {today}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: 8 }}>
                  <span className="pulse-dot" style={{ background: '#ef4444' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#dc2626' }}>7 alertes critiques</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowUser(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>MD</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Dr. M. Dupont</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Titulaire</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {showUser && (
                    <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,.12)', minWidth: 200, zIndex: 100, overflow: 'hidden' }}>
                      {[
                        { label: '👤 Mon profil', action: () => {} },
                        { label: '⚙️ Paramètres', action: () => {} },
                        { label: '📋 Ma pharmacie', action: () => {} },
                        { label: '🔔 Notifications', action: () => {} },
                        { label: '🚪 Déconnexion', action: () => alert('Déconnexion') },
                      ].map(item => (
                        <button key={item.label} onClick={() => { item.action(); setShowUser(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', fontSize: 13.5, fontWeight: 500, color: '#1e293b', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >{item.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main className="page-content fade-in">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
