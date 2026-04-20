'use client';
import '../globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Bell, ArrowLeftRight, FileBarChart2, Upload, HelpCircle, Settings, LogOut, ShoppingBag, FlaskConical, Wifi, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { sdb } from '@/lib/supabase-db';

const NAV = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Tableau de bord',    shortLabel: 'Accueil' },
  { href: '/alerts',        icon: Bell,             label: 'Alertes',             shortLabel: 'Alertes' },
  { href: '/returns',       icon: ArrowLeftRight,   label: 'Retours laboratoire', shortLabel: 'Retours' },
  { href: '/reports',       icon: FileBarChart2,    label: 'Rapports ROI',        shortLabel: 'Rapports' },
  { href: '/parapharmacie', icon: ShoppingBag,      label: 'Parapharmacie',       shortLabel: 'Para' },
  { href: '/import',        icon: Upload,           label: 'Import données',      shortLabel: 'Import' },
  { href: '/subscription',  icon: HelpCircle,       label: 'Aide',                shortLabel: 'Aide' },
];

const BOTTOM_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, shortLabel: 'Accueil' },
  { href: '/alerts',    icon: Bell,             shortLabel: 'Alertes' },
  { href: '/returns',   icon: ArrowLeftRight,   shortLabel: 'Retours' },
  { href: '/reports',   icon: FileBarChart2,    shortLabel: 'Rapports' },
  { href: '/import',    icon: Upload,           shortLabel: 'Import' },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord', '/alerts': 'Alertes & Notifications',
  '/returns': 'Retours Laboratoire', '/reports': 'Rapports ROI',
  '/parapharmacie': 'Parapharmacie', '/import': 'Import de données',
  '/subscription': 'Aide', '/settings': 'Paramètres',
};

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, pharmacy, loading, signOut } = useAuth();
  const [criticalCount, setCriticalCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);
  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (!loading && user && pathname === '/login') router.push('/dashboard');
  }, [loading, user, router, pathname]);
  useEffect(() => {
    if (!user) return;
    sdb.products.getAll().then(products => {
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const limit30 = new Date(now.getTime() + 30 * 864e5);
      setCriticalCount(products.filter(p => {
        const exp = new Date(p.date_expiration); exp.setHours(0, 0, 0, 0);
        return exp <= limit30;
      }).length);
    });
  }, [user, pathname]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--brand-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Chargement…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const initials = pharmacy.pharmacien?.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('') || 'PH';
  const titleKey = Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k)) || '/dashboard';
  const pageTitle = PAGE_TITLES[titleKey] || 'PharmaTrack';

  function handleSignOut() { signOut(); router.push('/login'); }

  return (
    <div className="app-shell">
      <div className={`mobile-nav-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Fermer le menu"><X size={22} /></button>

        <div className="sidebar-logo">
          <div className="sidebar-logo-mark"><FlaskConical size={20} color="#fff" strokeWidth={2} /></div>
          <div>
            <div className="sidebar-logo-text">PharmaTrack</div>
            <div className="sidebar-logo-sub">Gestion des périmés</div>
          </div>
        </div>

        <div className="sidebar-pharmacy">
          <div className="sidebar-pharmacy-name">{pharmacy.nom || '—'}</div>
          <div className="sidebar-pharmacy-sub">{pharmacy.ville || '—'}</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          <div className="nav-section-label">Navigation</div>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={`nav-item${active ? ' active' : ''}`}>
                <Icon size={16} className="nav-icon" />
                <span>{label}</span>
                {href === '/alerts' && criticalCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}>
                    {criticalCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="nav-section-label" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>Compte</div>
          <Link href="/settings" className={`nav-item${pathname.startsWith('/settings') ? ' active' : ''}`}>
            <Settings size={16} className="nav-icon" /><span>Paramètres</span>
          </Link>
          <button className="nav-item" style={{ width: 'calc(100% - 16px)' }} onClick={handleSignOut}>
            <LogOut size={16} className="nav-icon" /><span>Déconnexion</span>
          </button>
        </nav>

        <div className="sidebar-bottom"><Wifi size={11} />PharmaTrack v2.0 · Local</div>
      </aside>

      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <button className="mobile-header-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu">
            <Menu size={20} color="var(--text-secondary)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pageTitle}</div>
            <div className="header-subtitle" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pharmacy.nom || 'PharmaTrack'} · {pharmacy.ville || ''} · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {criticalCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--red-50)', border: '1.5px solid #fecaca', padding: '6px 12px', borderRadius: 9, boxShadow: '0 1px 4px rgba(220,38,38,0.12)' }}>
                <span className="pulse-dot" style={{ background: '#ef4444' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red-600)', whiteSpace: 'nowrap' }}>
                  {criticalCount} alerte{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 13px', background: 'var(--surface-2)', borderRadius: 10, border: '1.5px solid var(--border)', userSelect: 'none', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-600), var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{pharmacy.pharmacien || pharmacy.nom || 'Pharmacien'}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>{pharmacy.ville || 'Pharmacie'}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content fade-in">{children}</main>
      </div>

      <nav className="bottom-tab-bar" aria-label="Navigation principale">
        {BOTTOM_NAV.map(({ href, icon: Icon, shortLabel }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`bottom-tab-item${active ? ' active' : ''}`}>
              {href === '/alerts' && criticalCount > 0 && <span className="tab-dot" />}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><AppShell>{children}</AppShell></AuthProvider>;
}
