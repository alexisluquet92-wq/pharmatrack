'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, X, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { sdb } from '@/lib/supabase-db';
import { parseDate } from '@/store';
import type { Product } from '@/lib/data';
import toast, { Toaster } from 'react-hot-toast';

interface ParsedRow {
  nom: string;
  cip_code?: string;
  laboratoire?: string;
  stock: number;
  prix_unitaire: number;
  date_expiration: string;
}

function parseRows(rows: Record<string, string>[]): ParsedRow[] {
  return rows.map(row => {
    const k = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'), String(v || '').trim()])
    );
    const dateRaw = k.date_expiration || k.date_exp || k.expiration || k.exp || k.date_peremption || k.peremption || '';
    const dateStr = parseDate(dateRaw);
    const stock = parseInt(k.stock || k.quantite || k.qty || '0') || 0;
    const prix = parseFloat((k.prix_unitaire || k.prix || k.price || k.pu || '0').replace(',', '.')) || 0;
    const nom = k.nom || k.name || k.designation || k.produit || k.libelle || '';
    const cip = k.cip_code || k.cip || k.code_cip || k.code || '';
    const labo = k.laboratoire || k.labo || k.lab || k.fabricant || '';
    return { nom, cip_code: cip || undefined, laboratoire: labo || undefined, stock, prix_unitaire: prix, date_expiration: dateStr || '' };
  }).filter(r => r.nom && r.date_expiration);
}

export default function ImportPage() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [filename, setFilename] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null);
  const [history, setHistory] = useState<{ id: string; filename: string; count: number; date: string }[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(() => {
    sdb.importHistory.getAll().then(h => { setHistory(h); setHistoryLoaded(true); });
  }, []);

  useState(() => { loadHistory(); });

  function processFile(file: File) {
    setFilename(file.name);
    setImportResult(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (result) => setPreview(parseRows(result.data as Record<string, string>[])),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false, defval: '' });
        setPreview(parseRows(data));
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Format non supporté. Utilisez CSV ou Excel (.xlsx).');
    }
  }

  async function doImport() {
    if (!preview || preview.length === 0) return;
    setImporting(true);
    try {
      const result = await sdb.products.upsert(preview as Partial<Product>[]);
      await sdb.importHistory.insert({ filename, count: result.imported, date: new Date().toISOString() });
      setImportResult(result);
      setPreview(null);
      setFilename('');
      toast.success(`${result.imported} produits importés avec succès`);
      loadHistory();
    } catch (err) {
      toast.error('Erreur lors de l\'import. Vérifiez votre fichier.');
      console.error(err);
    } finally {
      setImporting(false);
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="fade-in">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Import de données</h1>
          <div className="page-subtitle">Importez votre stock depuis votre logiciel métier (LGO)</div>
        </div>
      </div>

      {importResult && (
        <div style={{ background: 'var(--green-50)', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle size={20} color="var(--green-600)" />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--green-600)' }}>Import réussi</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{importResult.imported} produits importés / mis à jour</div>
          </div>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setImportResult(null)}><X size={18} /></button>
        </div>
      )}

      {!preview ? (
        <div
          className={`drop-zone${dragging ? ' dragging' : ''}`}
          style={{ marginBottom: 24 }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={40} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.6 }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>Glissez votre fichier ici</div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 16 }}>ou cliquez pour parcourir</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['.CSV', '.XLSX', '.XLS'].map(f => (
              <span key={f} style={{ padding: '4px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{f}</span>
            ))}
          </div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} />
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <FileText size={20} color="var(--brand-600)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{filename}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{preview.length} lignes valides détectées</div>
            </div>
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => { setPreview(null); setFilename(''); }}>
              <X size={14} />Annuler
            </button>
          </div>

          {preview.some(r => !r.date_expiration) && (
            <div style={{ background: 'var(--orange-50)', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--orange-600)', display: 'flex', gap: 8 }}>
              <AlertTriangle size={16} /><span>Certaines lignes ont une date invalide et seront ignorées.</span>
            </div>
          )}

          <div className="table-scroll" style={{ marginBottom: 20, maxHeight: 320, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Nom</th><th>CIP</th><th>Laboratoire</th><th>Stock</th><th>Prix unit.</th><th>Date exp.</th></tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.nom}</td>
                    <td>{row.cip_code || '—'}</td>
                    <td>{row.laboratoire || '—'}</td>
                    <td>{row.stock}</td>
                    <td>{row.prix_unitaire.toFixed(2)} €</td>
                    <td>{row.date_expiration ? new Date(row.date_expiration).toLocaleDateString('fr-FR') : <span style={{ color: 'var(--red-600)' }}>Invalide</span>}</td>
                  </tr>
                ))}
                {preview.length > 50 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '12px' }}>… et {preview.length - 50} autres lignes</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => { setPreview(null); setFilename(''); }}>Annuler</button>
            <button className="btn btn-primary" onClick={doImport} disabled={importing || preview.length === 0}>
              {importing ? 'Import en cours…' : `Importer ${preview.length} produits`}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title"><FileText size={16} />Historique des imports</div></div>
        {!historyLoaded ? (
          <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>Chargement…</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Aucun import effectué</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Fichier</th><th>Produits importés</th><th>Date</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600 }}>{h.filename}</td>
                    <td>{h.count} produits</td>
                    <td>{new Date(h.date).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
