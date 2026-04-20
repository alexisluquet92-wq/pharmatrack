'use client';

// ── Storage keys (matching Vercel production) ──
const KEY_USER            = 'pt_user';
const KEY_SESSION         = 'pt_session';
const KEY_PHARMACY        = 'pt_pharmacy';
const KEY_PRODUCTS        = 'pt_products';
const KEY_RETURNS         = 'pt_returns';
const KEY_RETURN_ITEMS    = 'pt_return_items';
const KEY_REPORTS         = 'pt_reports';
const KEY_ALERTS_CONFIG   = 'pt_alerts_config';
const KEY_IMPORT_HISTORY  = 'pt_import_history';

function read<T>(key: string): T | null {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function write<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { console.error('localStorage write failed:', key); }
}
function uuid(): string { return crypto.randomUUID(); }
function nowIso(): string { return new Date().toISOString(); }

// ── Interfaces ──
export interface Pharmacy {
  id: string; nom: string; finess: string; adresse: string;
  code_postal: string; ville: string; telephone: string; email: string;
  pharmacien: string; plan: 'starter' | 'pro' | 'enterprise'; has_real_data: boolean;
}
export interface Product {
  id: string; nom: string; cip_code?: string; laboratoire?: string;
  stock: number; prix_unitaire: number; date_expiration: string;
  condition_retour?: boolean; tag?: 'liquidation' | 'promotion' | null;
  remise_pct?: number | null; prix_remise?: number | null;
  created_at: string; updated_at: string;
}
export interface Return {
  id: string; laboratoire: string; status: 'brouillon' | 'envoye' | 'valide';
  total_valeur: number; date_creation: string;
  date_envoi: string | null; date_validation: string | null; reference_retour: string | null;
}
export interface ReturnItem {
  id: string; return_id: string; product_id: string; nom: string;
  cip_code?: string; quantite: number; prix_unitaire: number; valeur: number;
}
export interface AlertsConfig {
  seuil_critique: number; seuil_urgent: number; seuil_attention: number;
  email_notifications: boolean; email_address: string;
}
export interface ImportHistory {
  id: string; date: string; filename: string; count: number;
}

const EMPTY_PHARMACY: Pharmacy = {
  id: '', nom: '', finess: '', adresse: '', code_postal: '',
  ville: '', telephone: '', email: '', pharmacien: '',
  plan: 'starter', has_real_data: false,
};
const DEFAULT_ALERTS: AlertsConfig = {
  seuil_critique: 30, seuil_urgent: 60, seuil_attention: 90,
  email_notifications: false, email_address: '',
};

// ── Data layer ──
const db = {
  session: {
    get: () => read<{ isLoggedIn: boolean; loginTime: string }>(KEY_SESSION),
    login() { write(KEY_SESSION, { isLoggedIn: true, loginTime: nowIso() }); },
    logout() { localStorage.removeItem(KEY_SESSION); },
    isLoggedIn: () => read<{ isLoggedIn: boolean }>(KEY_SESSION)?.isLoggedIn === true,
  },

  user: {
    get: () => read<{ email: string; password: string }>(KEY_USER) ?? { email: 'admin@pharmatrack.fr', password: 'pharmatrack2026' },
    set(u: { email: string; password: string }) { write(KEY_USER, u); },
    verify(email: string, password: string) {
      const u = db.user.get();
      return u.email === email && u.password === password;
    },
    updatePassword(password: string) { write(KEY_USER, { ...db.user.get(), password }); },
  },

  pharmacy: {
    get: () => read<Pharmacy>(KEY_PHARMACY) ?? { ...EMPTY_PHARMACY },
    set(p: Pharmacy) { write(KEY_PHARMACY, p); },
    update(partial: Partial<Pharmacy>) {
      const current = read<Pharmacy>(KEY_PHARMACY) ?? { ...EMPTY_PHARMACY, id: uuid() };
      write(KEY_PHARMACY, { ...current, ...partial });
    },
    create(data: Partial<Pharmacy>) {
      const p = { id: uuid(), plan: 'starter' as const, has_real_data: false, ...data } as Pharmacy;
      write(KEY_PHARMACY, p); return p;
    },
  },

  products: {
    getAll: () => read<Product[]>(KEY_PRODUCTS) ?? [],
    upsert(items: Partial<Product>[]) {
      const existing = db.products.getAll();
      const map = new Map<string, Product>();
      existing.forEach(p => {
        const key = p.cip_code ? `cip:${p.cip_code}` : `nom:${p.nom}`;
        map.set(key, p);
      });
      items.forEach(item => {
        const key = item.cip_code ? `cip:${item.cip_code}` : `nom:${item.nom}`;
        const cur = map.get(key);
        if (cur) map.set(key, { ...cur, ...item, updated_at: nowIso() });
        else map.set(key, { id: uuid(), created_at: nowIso(), updated_at: nowIso(), ...item } as Product);
      });
      write(KEY_PRODUCTS, Array.from(map.values()));
      return { imported: items.length };
    },
    insert(item: Partial<Product>) {
      const p = { id: uuid(), created_at: nowIso(), updated_at: nowIso(), ...item } as Product;
      write(KEY_PRODUCTS, [...db.products.getAll(), p]); return p;
    },
    update(id: string, partial: Partial<Product>) {
      write(KEY_PRODUCTS, db.products.getAll().map(p => p.id === id ? { ...p, ...partial, updated_at: nowIso() } : p));
    },
    delete(id: string) { write(KEY_PRODUCTS, db.products.getAll().filter(p => p.id !== id)); },
  },

  returns: {
    getAll: () => read<Return[]>(KEY_RETURNS) ?? [],
    insert(data: Partial<Return>) {
      const r = { id: uuid(), date_creation: nowIso(), date_envoi: null, date_validation: null, reference_retour: null, ...data } as Return;
      write(KEY_RETURNS, [...db.returns.getAll(), r]); return r;
    },
    update(id: string, partial: Partial<Return>) {
      write(KEY_RETURNS, db.returns.getAll().map(r => r.id === id ? { ...r, ...partial } : r));
    },
    delete(id: string) { write(KEY_RETURNS, db.returns.getAll().filter(r => r.id !== id)); },
  },

  returnItems: {
    getAll: () => read<ReturnItem[]>(KEY_RETURN_ITEMS) ?? [],
    insert(item: Partial<ReturnItem>) {
      const i = { id: uuid(), ...item } as ReturnItem;
      write(KEY_RETURN_ITEMS, [...db.returnItems.getAll(), i]); return i;
    },
    delete(id: string) { write(KEY_RETURN_ITEMS, db.returnItems.getAll().filter(i => i.id !== id)); },
  },

  alertsConfig: {
    get: () => read<AlertsConfig>(KEY_ALERTS_CONFIG) ?? { ...DEFAULT_ALERTS },
    update(partial: Partial<AlertsConfig>) {
      write(KEY_ALERTS_CONFIG, { ...db.alertsConfig.get(), ...partial });
    },
  },

  importHistory: {
    getAll: () => read<ImportHistory[]>(KEY_IMPORT_HISTORY) ?? [],
    insert(data: Omit<ImportHistory, 'id'>) {
      const item = { id: uuid(), ...data };
      write(KEY_IMPORT_HISTORY, [item, ...db.importHistory.getAll()].slice(0, 50));
      return item;
    },
  },

  reports: {
    getAll: () => read<{ id: string; created_at: string; [k: string]: unknown }[]>(KEY_REPORTS) ?? [],
    insert(data: Record<string, unknown>) {
      const r = { id: uuid(), created_at: nowIso(), ...data };
      write(KEY_REPORTS, [r, ...db.reports.getAll()]); return r;
    },
  },
};

export default db;

// CIP helpers
export function isPharmaceutical(cipCode?: string): boolean { return !!cipCode && cipCode.startsWith('3400'); }
export function isParapharmaceutical(cipCode?: string): boolean { return !isPharmaceutical(cipCode); }

// Urgency helpers
export function computeUrgency(dateExpStr: string): 'expired' | 'critical' | 'warning' | 'ok' {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const exp = new Date(dateExpStr); exp.setHours(0, 0, 0, 0);
  const j = Math.ceil((exp.getTime() - now.getTime()) / 864e5);
  if (j <= 0) return 'expired';
  if (j <= 30) return 'critical';
  if (j <= 90) return 'warning';
  return 'ok';
}
export function daysUntil(dateExpStr: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const exp = new Date(dateExpStr); exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - now.getTime()) / 864e5);
}
