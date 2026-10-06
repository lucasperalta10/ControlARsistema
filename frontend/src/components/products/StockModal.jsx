import React, { useState } from 'react';
import { apiRequest } from '../../api/client.js';
import { formatQuantity } from '../../utils/formatters.js';
import { X, ArrowDownRight, ArrowUpRight, Sliders, Check } from 'lucide-react';

export function StockModal({ producto, isOpen, onClose, onSuccess }) {
  if (!isOpen || !producto) return null;

  const [tipo, setTipo] = useState('SALIDA'); // 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stockActual = Number(producto.stock_actual);
  const cantNum = Number(cantidad) || 0;

  // Cálculo proyectado del nuevo stock
  let stockProyectado = stockActual;
  if (tipo === 'ENTRADA') stockProyectado = stockActual + cantNum;
  if (tipo === 'SALIDA') stockProyectado = stockActual - cantNum;
  if (tipo === 'AJUSTE') stockProyectado = cantNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (cantNum <= 0 && tipo !== 'AJUSTE') {
      setError('Ingresá una cantidad mayor a 0.');
      return;
    }

    if (tipo === 'AJUSTE' && cantNum < 0) {
      setError('El stock ajustado no puede ser negativo.');
      return;
    }

    if (tipo === 'SALIDA' && stockProyectado < 0) {
      setError(`Stock insuficiente. No podés retirar más de ${formatQuantity(stockActual, producto.unidad_venta)}.`);
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      if (tipo === 'ENTRADA') endpoint = `/stock/${producto.id}/entrada`;
      if (tipo === 'SALIDA') endpoint = `/stock/${producto.id}/salida`;
      if (tipo === 'AJUSTE') endpoint = `/stock/${producto.id}/ajuste`;

      await apiRequest(endpoint, {
        method: 'POST',
        body: {
          cantidad: cantNum,
          motivo: motivo.trim() || undefined
        }
      });

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el movimiento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Movimiento de Stock
            </span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {producto.nombre}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Selector de Tipo de Movimiento */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`btn ${tipo === 'SALIDA' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ padding: '10px 4px', fontSize: '0.85rem' }}
            onClick={() => setTipo('SALIDA')}
          >
            <ArrowDownRight size={16} /> Salida
          </button>
          <button
            type="button"
            className={`btn ${tipo === 'ENTRADA' ? 'btn-success' : 'btn-secondary'}`}
            style={{ padding: '10px 4px', fontSize: '0.85rem' }}
            onClick={() => setTipo('ENTRADA')}
          >
            <ArrowUpRight size={16} /> Entrada
          </button>
          <button
            type="button"
            className={`btn ${tipo === 'AJUSTE' ? 'btn-warning' : 'btn-secondary'}`}
            style={{ padding: '10px 4px', fontSize: '0.85rem' }}
            onClick={() => setTipo('AJUSTE')}
          >
            <Sliders size={16} /> Ajuste
          </button>
        </div>

        {/* Resumen del Stock Actual y Proyectado */}
        <div style={{
          background: 'var(--bg-main)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Stock Actual</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              {formatQuantity(stockActual, producto.unidad_venta)}
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>➔</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Stock Proyectado</div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: stockProyectado < 0 ? 'var(--danger)' : stockProyectado === 0 ? 'var(--danger)' : 'var(--success)'
            }}>
              {formatQuantity(stockProyectado, producto.unidad_venta)}
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '14px',
            fontSize: '0.85rem',
            border: '1px solid var(--danger-border)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {tipo === 'AJUSTE' ? `Nuevo stock físico real (${producto.unidad_venta})` : `Cantidad a ${tipo === 'ENTRADA' ? 'ingresar' : 'retirar'} (${producto.unidad_venta})`}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              autoFocus
              className="form-input"
              style={{ fontSize: '1.2rem', fontWeight: 700 }}
              placeholder="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Motivo (opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder={tipo === 'SALIDA' ? 'Venta cotidiana' : tipo === 'ENTRADA' ? 'Reposición de proveedor' : 'Conteo físico de góndola'}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Guardando movimiento...' : 'Confirmar Movimiento'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StockModal;
