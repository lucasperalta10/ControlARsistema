import React from 'react';
import StockBadge from './StockBadge.jsx';
import { formatCurrency, formatQuantity } from '../../utils/formatters.js';
import { ChevronRight } from 'lucide-react';

export function ProductCard({ producto, onSelect, onQuickStock }) {
  return (
    <div
      className="card"
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '14px 16px'
      }}
      onClick={() => onSelect && onSelect(producto)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            {producto.categoria_nombre || 'Sin categoría'}
          </span>
          <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
            {producto.nombre}
          </h3>
        </div>
        <StockBadge estado={producto.estado_stock} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock:</span>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatQuantity(producto.stock_actual, producto.unidad_venta)}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Góndola:</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
            {formatCurrency(producto.precio_gondola)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
