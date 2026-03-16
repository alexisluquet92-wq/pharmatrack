'use client';
import { X } from 'lucide-react';

export default function Toast({ message, onClose, type = 'success' }: { message: string; onClose: () => void; type?: 'success' | 'error' | 'default' }) {
  return (
    <div className={`toast ${type}`}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.7)', padding: 0, display: 'flex' }}>
        <X size={16} />
      </button>
    </div>
  );
}
