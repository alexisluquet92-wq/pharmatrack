"use client";

export interface StockItem {
  id: string;
  nom: string;
  code_cip: string;
  laboratoire: string;
  categorie: string;
  forme: string;
  quantite: number;
  prix_unitaire: number;
  date_expiration: string; // ISO string YYYY-MM-DD
  daysUntilExpiry: number;
  urgency: "expired" | "critical" | "urgent" | "warning" | "ok";
}

const STORAGE_KEY = "pharmatrack_stock";
const IMPORT_META_KEY = "pharmatrack_import_meta";

export interface ImportMeta {
  filename: string;
  importedAt: string;
  totalItems: number;
  source: "csv" | "xlsx";
}

function computeDays(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  return Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function computeUrgency(days: number): StockItem["urgency"] {
  if (days < 0) return "expired";
  if (days <= 30) return "critical";
  if (days <= 60) return "urgent";
  if (days <= 90) return "warning";
  return "ok";
}

export function saveStock(items: Omit<StockItem, "daysUntilExpiry" | "urgency">[], meta: ImportMeta) {
  const enriched: StockItem[] = items.map((item) => {
    const days = computeDays(item.date_expiration);
    return { ...item, daysUntilExpiry: days, urgency: computeUrgency(days) };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
  localStorage.setItem(IMPORT_META_KEY, JSON.stringify(meta));
  // Dispatch event so other tabs/components react
  window.dispatchEvent(new Event("pharmatrack_data_updated"));
  return enriched;
}

export function loadStock(): StockItem[] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    // Recompute days on each load (days change daily)
    const items: StockItem[] = JSON.parse(raw);
    return items.map((item) => {
      const days = computeDays(item.date_expiration);
      return { ...item, daysUntilExpiry: days, urgency: computeUrgency(days) };
    });
  } catch {
    return null;
  }
}

export function loadImportMeta(): ImportMeta | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(IMPORT_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStock() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(IMPORT_META_KEY);
  window.dispatchEvent(new Event("pharmatrack_data_updated"));
}

export function getStats(items: StockItem[]) {
  const expired = items.filter((i) => i.urgency === "expired");
  const critical = items.filter((i) => i.urgency === "critical");
  const urgent = items.filter((i) => i.urgency === "urgent");
  const warning = items.filter((i) => i.urgency === "warning");
  const ok = items.filter((i) => i.urgency === "ok");

  const totalValue = items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0);
  const atRiskValue = [...expired, ...critical, ...urgent].reduce(
    (s, i) => s + i.quantite * i.prix_unitaire,
    0
  );

  return {
    total: items.length,
    expired: expired.length,
    critical: critical.length,
    urgent: urgent.length,
    warning: warning.length,
    ok: ok.length,
    alertCount: expired.length + critical.length,
    totalValue,
    atRiskValue,
    savingsRate: totalValue > 0 ? ((totalValue - atRiskValue) / totalValue) * 100 : 0,
  };
}

// Parse any date format to YYYY-MM-DD
export function parseDate(raw: string): string | null {
  if (!raw) return null;
  const s = String(raw).trim();

  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;

  // YYYY-MM-DD
  const ymd = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;

  // MM/YYYY (first day of month)
  const my = s.match(/^(\d{1,2})[\/\-\.](\d{4})$/);
  if (my) return `${my[2]}-${my[1].padStart(2, "0")}-01`;

  // Excel serial date number
  const num = Number(s);
  if (!isNaN(num) && num > 40000) {
    const d = new Date((num - 25569) * 86400 * 1000);
    return d.toISOString().split("T")[0];
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];

  return null;
}
