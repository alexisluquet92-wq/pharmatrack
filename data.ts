// Shared mock data and types for PharmaTrack

export type Urgency = 'critical' | 'urgent' | 'warning' | 'ok';
export type ActionType = 'retour' | 'liquidation' | 'promotion' | 'surveillance';

export interface Drug {
  id: string;
  name: string;
  form: string;
  category: string;
  cip: string;
  lab: string;
  stock: number;
  pricePerUnit: number;
  expiryDate: string;
  daysLeft: number;
  urgency: Urgency;
  action: ActionType;
}

export interface ParaProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  ean: string;
  stock: number;
  pricePerUnit: number;
  expiryDate: string;
  daysLeft: number;
  urgency: Urgency;
  action: ActionType;
  margin: number;
}

export interface ReturnDossier {
  id: string;
  ref: string;
  lab: string;
  products: number;
  totalValue: number;
  status: 'draft' | 'sent' | 'pending' | 'validated' | 'paid';
  createdAt: string;
  updatedAt: string;
  creditNote?: string;
}

export const DRUGS: Drug[] = [
  { id:'d1', name:'Amlodipine 5mg', form:'Comprimé', category:'Cardiovasculaire', cip:'3400938721463', lab:'Arrow', stock:30, pricePerUnit:6.90, expiryDate:'19/03/2026', daysLeft:3, urgency:'critical', action:'retour' },
  { id:'d2', name:'Amoxicilline 500mg', form:'Gélule', category:'Antibiotique', cip:'3400936017324', lab:'Biogaran', stock:48, pricePerUnit:3.80, expiryDate:'23/03/2026', daysLeft:7, urgency:'critical', action:'liquidation' },
  { id:'d3', name:'Atorvastatine 20mg', form:'Comprimé', category:'Hypolipémiant', cip:'3400932876519', lab:'Pfizer', stock:72, pricePerUnit:8.40, expiryDate:'26/03/2026', daysLeft:10, urgency:'critical', action:'retour' },
  { id:'d4', name:'Doliprane 1000mg', form:'Comprimé', category:'Antalgique', cip:'3400935958821', lab:'Sanofi', stock:120, pricePerUnit:2.10, expiryDate:'29/03/2026', daysLeft:13, urgency:'critical', action:'liquidation' },
  { id:'d5', name:'Metformine 850mg', form:'Comprimé', category:'Antidiabétique', cip:'3400936112646', lab:'Merck', stock:60, pricePerUnit:4.20, expiryDate:'02/04/2026', daysLeft:17, urgency:'critical', action:'retour' },
  { id:'d6', name:'Augmentin 500mg', form:'Comprimé', category:'Antibiotique', cip:'3400932516381', lab:'GSK', stock:36, pricePerUnit:5.60, expiryDate:'05/04/2026', daysLeft:20, urgency:'critical', action:'retour' },
  { id:'d7', name:'Oméprazole 20mg', form:'Gélule', category:'Gastro', cip:'3400937564008', lab:'Mylan', stock:90, pricePerUnit:3.50, expiryDate:'07/04/2026', daysLeft:22, urgency:'critical', action:'retour' },
  { id:'d8', name:'Sertraline 50mg', form:'Comprimé', category:'Psychotrope', cip:'3400939123457', lab:'Pfizer', stock:40, pricePerUnit:6.30, expiryDate:'13/04/2026', daysLeft:28, urgency:'urgent', action:'retour' },
  { id:'d9', name:'Levothyrox 50µg', form:'Comprimé', category:'Hormones', cip:'3400938272834', lab:'Merck', stock:100, pricePerUnit:3.20, expiryDate:'15/04/2026', daysLeft:30, urgency:'urgent', action:'retour' },
  { id:'d10', name:'Ibuprofène 400mg', form:'Comprimé', category:'Anti-inflammatoire', cip:'3400935678901', lab:'Teva', stock:96, pricePerUnit:2.30, expiryDate:'24/04/2026', daysLeft:39, urgency:'urgent', action:'promotion' },
  { id:'d11', name:'Ventoline 100µg', form:'Inhalateur', category:'Respiratoire', cip:'3400932547123', lab:'GSK', stock:24, pricePerUnit:9.70, expiryDate:'25/04/2026', daysLeft:40, urgency:'urgent', action:'retour' },
  { id:'d12', name:'Daflon 500mg', form:'Comprimé', category:'Vasculo-protecteur', cip:'3400937451236', lab:'Servier', stock:60, pricePerUnit:5.20, expiryDate:'28/04/2026', daysLeft:43, urgency:'urgent', action:'retour' },
  { id:'d13', name:'Loratadine 10mg', form:'Comprimé', category:'Antihistaminique', cip:'3400937890123', lab:'Biogaran', stock:120, pricePerUnit:1.90, expiryDate:'22/05/2026', daysLeft:67, urgency:'warning', action:'promotion' },
  { id:'d14', name:'Prednisone 5mg', form:'Comprimé', category:'Corticoïde', cip:'3400935678902', lab:'Btk', stock:100, pricePerUnit:2.80, expiryDate:'25/05/2026', daysLeft:70, urgency:'warning', action:'promotion' },
  { id:'d15', name:'Clopidogrel 75mg', form:'Comprimé', category:'Cardiovasculaire', cip:'3400938901234', lab:'Zentiva', stock:56, pricePerUnit:7.20, expiryDate:'30/05/2026', daysLeft:75, urgency:'warning', action:'promotion' },
];

export const PARA_PRODUCTS: ParaProduct[] = [
  { id:'p1', name:'Crème hydratante Visage SPF50', brand:'La Roche-Posay', category:'Dermocosmétique', subCategory:'Soins visage', ean:'3433422405596', stock:18, pricePerUnit:24.90, expiryDate:'20/03/2026', daysLeft:4, urgency:'critical', action:'liquidation', margin:42 },
  { id:'p2', name:'Shampooing antipelliculaire', brand:'Ducray', category:'Capillaire', subCategory:'Soins cheveux', ean:'3282770076042', stock:24, pricePerUnit:12.50, expiryDate:'28/03/2026', daysLeft:12, urgency:'critical', action:'promotion', margin:38 },
  { id:'p3', name:'Complément Vitamine D3 2000UI', brand:'Ergy D', category:'Compléments alimentaires', subCategory:'Vitamines', ean:'3401560437982', stock:45, pricePerUnit:18.90, expiryDate:'05/04/2026', daysLeft:20, urgency:'critical', action:'promotion', margin:55 },
  { id:'p4', name:'Gel douche surgras Atoderm', brand:'Bioderma', category:'Dermocosmétique', subCategory:'Corps', ean:'3701129800200', stock:30, pricePerUnit:9.90, expiryDate:'15/04/2026', daysLeft:30, urgency:'urgent', action:'promotion', margin:44 },
  { id:'p5', name:'Magnésium Marin + Vitamine B6', brand:'Nutergia', category:'Compléments alimentaires', subCategory:'Minéraux', ean:'3401545678901', stock:60, pricePerUnit:22.00, expiryDate:'22/04/2026', daysLeft:37, urgency:'urgent', action:'promotion', margin:60 },
  { id:'p6', name:'Huile sèche corporelle', brand:'Mustela', category:'Dermocosmétique', subCategory:'Corps', ean:'3504105021234', stock:12, pricePerUnit:16.50, expiryDate:'25/04/2026', daysLeft:40, urgency:'urgent', action:'surveillance', margin:47 },
  { id:'p7', name:'Protège-lèvres SPF30', brand:'Avène', category:'Dermocosmétique', subCategory:'Soins lèvres', ean:'3282770032109', stock:80, pricePerUnit:5.90, expiryDate:'08/05/2026', daysLeft:53, urgency:'urgent', action:'promotion', margin:50 },
  { id:'p8', name:'Oméga-3 DHA 500mg', brand:'Isoxan', category:'Compléments alimentaires', subCategory:'Acides gras', ean:'3401577890123', stock:35, pricePerUnit:28.50, expiryDate:'15/05/2026', daysLeft:60, urgency:'warning', action:'surveillance', margin:58 },
  { id:'p9', name:'Crème solaire SPF50+ Enfant', brand:'Uriage', category:'Solaires', subCategory:'Enfant', ean:'3661434005678', stock:22, pricePerUnit:19.90, expiryDate:'20/05/2026', daysLeft:65, urgency:'warning', action:'promotion', margin:45 },
  { id:'p10', name:'Probiotiques Lactobacillus', brand:'Pileje', category:'Compléments alimentaires', subCategory:'Probiotiques', ean:'3401590123456', stock:28, pricePerUnit:32.00, expiryDate:'28/05/2026', daysLeft:73, urgency:'warning', action:'surveillance', margin:62 },
  { id:'p11', name:'Dentifrice blancheur', brand:'Elgydium', category:'Hygiène bucco-dentaire', subCategory:'Dentifrice', ean:'3577056010003', stock:45, pricePerUnit:6.20, expiryDate:'15/06/2026', daysLeft:91, urgency:'ok', action:'surveillance', margin:40 },
  { id:'p12', name:'Masque purifiant argile', brand:'Cattier', category:'Dermocosmétique', subCategory:'Soins visage', ean:'3283950236789', stock:15, pricePerUnit:14.90, expiryDate:'22/06/2026', daysLeft:98, urgency:'ok', action:'surveillance', margin:52 },
];

export const RETURNS: ReturnDossier[] = [
  { id:'r1', ref:'RET-2026-089', lab:'Sanofi', products:8, totalValue:1240, status:'validated', createdAt:'02/03/2026', updatedAt:'12/03/2026', creditNote:'AV-2026-1234' },
  { id:'r2', ref:'RET-2026-090', lab:'Arrow', products:12, totalValue:2180, status:'sent', createdAt:'05/03/2026', updatedAt:'10/03/2026' },
  { id:'r3', ref:'RET-2026-091', lab:'Biogaran', products:5, totalValue:890, status:'pending', createdAt:'08/03/2026', updatedAt:'08/03/2026' },
  { id:'r4', ref:'RET-2026-092', lab:'Pfizer', products:3, totalValue:1560, status:'draft', createdAt:'14/03/2026', updatedAt:'16/03/2026' },
  { id:'r5', ref:'RET-2026-088', lab:'Merck', products:15, totalValue:3200, status:'paid', createdAt:'20/02/2026', updatedAt:'05/03/2026', creditNote:'AV-2026-1201' },
];

export const getUrgencyClass = (u: Urgency) => {
  if (u === 'critical') return 'row-critical';
  if (u === 'urgent') return 'row-urgent';
  if (u === 'warning') return 'row-warning';
  return 'row-ok';
};

export const getUrgencyBadge = (u: Urgency) => {
  if (u === 'critical') return 'badge-critical';
  if (u === 'urgent') return 'badge-urgent';
  if (u === 'warning') return 'badge-warning';
  return 'badge-success';
};

export const getActionLabel = (a: ActionType) => {
  if (a === 'retour') return '↩️ Retour labo';
  if (a === 'liquidation') return '🔻 Liquidation';
  if (a === 'promotion') return '🏷️ Promotion';
  return '👁️ Surveillance';
};

export const getActionClass = (a: ActionType) => {
  if (a === 'retour') return 'action-retour';
  if (a === 'liquidation') return 'action-liquidation';
  if (a === 'promotion') return 'action-promotion';
  return 'action-surveillance';
};

export const getStatusLabel = (s: ReturnDossier['status']) => {
  const map: Record<string, { label: string; badge: string }> = {
    draft: { label: 'Brouillon', badge: 'badge-gray' },
    sent: { label: 'Envoyé', badge: 'badge-blue' },
    pending: { label: 'En attente', badge: 'badge-warning' },
    validated: { label: 'Validé', badge: 'badge-success' },
    paid: { label: 'Payé', badge: 'badge-teal' },
  };
  return map[s] || { label: s, badge: 'badge-gray' };
};
