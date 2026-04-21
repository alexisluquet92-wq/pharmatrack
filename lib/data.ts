'use client';

// ── Interfaces ──
export interface Pharmacy {
  id: string;
  nom?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  pharmacien?: string;
  plan: 'starter' | 'pro' | 'enterprise';
  has_real_data?: boolean;
}

export interface Product {
  id: string;
  user_id?: string;
  nom: string;
  cip_code?: string;
  laboratoire?: string;
  stock: number;
  prix_unitaire: number;
  date_expiration: string;
  condition_retour?: string;
  tag?: 'liquidation' | 'promotion' | null;
  categorie?: string;
}

export interface Return {
  id: string;
  user_id?: string;
  product_id?: string;
  nom_produit: string;
  laboratoire?: string;
  quantite: number;
  motif?: string;
  statut: 'en_attente' | 'valide' | 'refuse';
  date_retour: string;
  montant_estime?: number;
}

export interface Alert {
  id: string;
  user_id?: string;
  product_id: string;
  type: string;
  jours_seuil: number;
  is_active: boolean;
}

export interface Parapharmacie {
  id: string;
  user_id?: string;
  nom: string;
  reference?: string;
  date_expiration: string;
  quantite: number;
  fournisseur?: string;
  prix_unitaire: number;
}

export interface ImportHistory {
  id: string;
  date: string;
  filename: string;
  count: number;
}

const EMPTY_PHARMACY: Pharmacy = {
  id: '', nom: '', adresse: '', code_postal: '',
  ville: '', telephone: '', email: '', pharmacien: '',
  plan: 'starter', has_real_data: false,
};

export default EMPTY_PHARMACY;

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
