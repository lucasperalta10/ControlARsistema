import React from 'react';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export function StockBadge({ estado }) {
  const norm = String(estado || '').toUpperCase();

  if (norm === 'AGOTADO') {
    return (
      <span className="stock-badge agotado">
        <XCircle size={13} /> Agotado
      </span>
    );
  }

  if (norm === 'REPONER') {
    return (
      <span className="stock-badge reponer">
        <AlertCircle size={13} /> Reponer
      </span>
    );
  }

  return (
    <span className="stock-badge disponible">
      <CheckCircle2 size={13} /> Disponible
    </span>
  );
}

export default StockBadge;
