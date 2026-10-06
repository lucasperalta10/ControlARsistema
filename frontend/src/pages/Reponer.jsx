import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { StockBadge } from '../components/products/StockBadge.jsx';
import { StockModal } from '../components/products/StockModal.jsx';
import { formatQuantity, formatCurrency } from '../utils/formatters.js';
import { AlertTriangle, Plus, CheckCircle2, ArrowRight } from 'lucide-react';

export function Reponer({ onSelectProduct }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);

  const fetchReponer = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/stock/reponer');
      if (res.success) {
        setProductos(res.productos);
      }
    } catch (err) {
      console.error('Error cargando lista de reposición:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReponer();
  }, []);

  const agotados = productos.filter(p => p.stock_actual <= 0);
  const bajoStock = productos.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo);

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle color="var(--warning)" size={24} />
          Para Reponer
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Productos agotados o que alcanzaron el stock mínimo
        </p>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : productos.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>
            ¡Todo el stock está al día!
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            No tenés productos agotados ni por debajo del stock mínimo.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Bloque 1: Agotados */}
          {agotados.length > 0 && (
            <div>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--danger)',
                textTransform: 'uppercase',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} />
                Agotados ({agotados.length})
              </div>

              <div className="products-grid">
                {agotados.map((p) => (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      borderLeft: '4px solid var(--danger)',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div onClick={() => onSelectProduct(p)} style={{ cursor: 'pointer', flex: 1 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {p.categoria_nombre || 'Sin categoría'}
                      </span>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                        {p.nombre}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700, marginTop: '2px' }}>
                        Stock actual: 0 {p.unidad_venta} (Mín: {formatQuantity(p.stock_minimo, p.unidad_venta)})
                      </div>
                    </div>

                    <button
                      className="btn btn-success"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      onClick={() => setSelectedStockProduct(p)}
                    >
                      <Plus size={15} /> Reponer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bloque 2: Bajo Stock */}
          {bajoStock.length > 0 && (
            <div>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--warning)',
                textTransform: 'uppercase',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }} />
                Bajo Stock ({bajoStock.length})
              </div>

              <div className="products-grid">
                {bajoStock.map((p) => (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      borderLeft: '4px solid var(--warning)',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div onClick={() => onSelectProduct(p)} style={{ cursor: 'pointer', flex: 1 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {p.categoria_nombre || 'Sin categoría'}
                      </span>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                        {p.nombre}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 700, marginTop: '2px' }}>
                        Quedan: {formatQuantity(p.stock_actual, p.unidad_venta)} (Mín: {formatQuantity(p.stock_minimo, p.unidad_venta)})
                      </div>
                    </div>

                    <button
                      className="btn btn-success"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      onClick={() => setSelectedStockProduct(p)}
                    >
                      <Plus size={15} /> Reponer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <StockModal
        producto={selectedStockProduct}
        isOpen={Boolean(selectedStockProduct)}
        onClose={() => setSelectedStockProduct(null)}
        onSuccess={fetchReponer}
      />
    </div>
  );
}

export default Reponer;
