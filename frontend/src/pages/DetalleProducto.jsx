import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { StockBadge } from '../components/products/StockBadge.jsx';
import { StockModal } from '../components/products/StockModal.jsx';
import { formatCurrency, formatQuantity, formatDate } from '../utils/formatters.js';
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Sliders,
  Edit2,
  Trash2,
  History,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';

export function DetalleProducto({ productoId, onBack, onProductUpdated, onProductDeleted }) {
  const [producto, setProducto] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalTipo, setStockModalTipo] = useState('SALIDA');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [error, setError] = useState(null);

  // Campos para edición
  const [nombreEdit, setNombreEdit] = useState('');
  const [precioCompraEdit, setPrecioCompraEdit] = useState('');
  const [costoRealEdit, setCostoRealEdit] = useState('');
  const [margenEdit, setMargenEdit] = useState('');
  const [stockMinimoEdit, setStockMinimoEdit] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchDetalle = async () => {
    try {
      setLoading(true);
      const [prodRes, movRes] = await Promise.all([
        apiRequest(`/productos/${productoId}`),
        apiRequest(`/productos/${productoId}/movimientos`)
      ]);

      if (prodRes.success) {
        setProducto(prodRes.producto);
        setNombreEdit(prodRes.producto.nombre);
        setPrecioCompraEdit(String(prodRes.producto.precio_compra));
        setCostoRealEdit(String(prodRes.producto.costo_real));
        setMargenEdit(String(prodRes.producto.margen_ganancia));
        setStockMinimoEdit(String(prodRes.producto.stock_minimo));
      }

      if (movRes.success) {
        setMovimientos(movRes.movimientos);
      }
    } catch (err) {
      setError(err.message || 'Error cargando detalle del producto.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productoId) fetchDetalle();
  }, [productoId]);

  const handleOpenModal = (tipo) => {
    setStockModalTipo(tipo);
    setShowStockModal(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setError(null);

    try {
      const res = await apiRequest(`/productos/${productoId}`, {
        method: 'PUT',
        body: {
          nombre: nombreEdit.trim(),
          precio_compra: Number(precioCompraEdit) || 0,
          costo_real: Number(costoRealEdit) || 0,
          margen_ganancia: Number(margenEdit) || 0,
          stock_minimo: Number(stockMinimoEdit) || 0
        }
      });

      if (res.success) {
        setModoEdicion(false);
        fetchDetalle();
        onProductUpdated && onProductUpdated();
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar el producto.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDesactivar = async () => {
    if (!window.confirm(`¿Estás segura/o de que deseás desactivar '${producto.nombre}'? No aparecerá en la lista activa pero su historial se conservará.`)) {
      return;
    }

    try {
      const res = await apiRequest(`/productos/${productoId}`, { method: 'DELETE' });
      if (res.success) {
        onProductDeleted && onProductDeleted();
        onBack();
      }
    } catch (err) {
      alert(err.message || 'No se pudo desactivar el producto.');
    }
  };

  if (loading) {
    return <div className="spinner" style={{ marginTop: '60px' }} />;
  }

  if (!producto) {
    return (
      <div className="card empty-state">
        <p>Producto no encontrado.</p>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '12px' }}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Barra superior de navegación */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ArrowLeft size={22} />
          <span style={{ fontSize: '0.85rem' }}>Volver</span>
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setModoEdicion(!modoEdicion)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Edit2 size={14} /> {modoEdicion ? 'Cancelar' : 'Editar'}
          </button>
          <button
            onClick={handleDesactivar}
            className="btn btn-danger"
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            title="Desactivar producto"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          color: '#f87171',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '0.85rem',
          border: '1px solid var(--danger-border)'
        }}>
          {error}
        </div>
      )}

      <div className="desktop-two-col">
        {/* Columna Izquierda: Ficha Técnica, Acciones y Costos */}
        <div>
          {/* Cabecera del Producto */}
          <div className="card" style={{ padding: '18px 16px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {producto.categoria_nombre || 'Sin categoría'}
                </span>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                  {producto.nombre}
                </h1>
              </div>
              <StockBadge estado={producto.estado_stock} />
            </div>

            {/* Cifra de Stock Principal */}
            <div style={{
              marginTop: '16px',
              padding: '14px',
              background: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock disponible</div>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fff' }}>
                  {formatQuantity(producto.stock_actual, producto.unidad_venta)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Stock mínimo de aviso: {formatQuantity(producto.stock_minimo, producto.unidad_venta)}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Precio de góndola</div>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary)' }}>
                  {formatCurrency(producto.precio_gondola)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Margen: {producto.margen_ganancia}%
                </div>
              </div>
            </div>

            {/* Botones Grandes de Movimiento de Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => handleOpenModal('SALIDA')}
                className="btn btn-danger"
                style={{ padding: '12px 6px', fontSize: '0.85rem' }}
              >
                <ArrowDownRight size={16} /> Salida
              </button>
              <button
                onClick={() => handleOpenModal('ENTRADA')}
                className="btn btn-success"
                style={{ padding: '12px 6px', fontSize: '0.85rem' }}
              >
                <ArrowUpRight size={16} /> Entrada
              </button>
              <button
                onClick={() => handleOpenModal('AJUSTE')}
                className="btn btn-warning"
                style={{ padding: '12px 6px', fontSize: '0.85rem' }}
              >
                <Sliders size={16} /> Ajustar
              </button>
            </div>
          </div>

          {/* Modo Edición de Datos */}
          {modoEdicion && (
            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '14px' }}>
                Editar Datos del Producto
              </h2>
              <form onSubmit={handleGuardarEdicion}>
                <div className="form-group">
                  <label className="form-label">Nombre del producto</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nombreEdit}
                    onChange={(e) => setNombreEdit(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Precio compra neto ($)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={precioCompraEdit}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPrecioCompraEdit(val);
                        const num = Number(val);
                        if (!isNaN(num) && num > 0) {
                          setCostoRealEdit(String(Math.round(num * 1.21 * 100) / 100));
                        } else {
                          setCostoRealEdit(val);
                        }
                      }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sin IVA</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo real (+21% IVA) ($)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={costoRealEdit}
                      onChange={(e) => setCostoRealEdit(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Incluye 21% IVA</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Margen (%)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={margenEdit}
                      onChange={(e) => setMargenEdit(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock mín aviso</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={stockMinimoEdit}
                      onChange={(e) => setStockMinimoEdit(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </form>
            </div>
          )}

          {/* Ficha de Detalles Económicos */}
          <div className="card">
            <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>
              Información de Costos
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Precio compra (Neto):</span>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{formatCurrency(producto.precio_compra)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Costo real (+21% IVA):</span>
                <div style={{ fontWeight: 700, marginTop: '2px', color: '#10b981' }}>{formatCurrency(producto.costo_real)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Margen de ganancia:</span>
                <div style={{ fontWeight: 700, marginTop: '2px', color: 'var(--primary)' }}>{producto.margen_ganancia}%</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Unidad de venta:</span>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{producto.unidad_venta}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Historial de Movimientos de Stock */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <History size={18} color="var(--primary)" />
              <h2 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                Historial de Movimientos
              </h2>
            </div>

            {movimientos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay movimientos registrados para este producto todavía.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {movimientos.map((m) => {
                  const esEntrada = m.tipo === 'ENTRADA';
                  const esSalida = m.tipo === 'SALIDA';

                  return (
                    <div
                      key={m.id}
                      style={{
                        background: 'var(--bg-main)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: esEntrada ? 'var(--success-bg)' : esSalida ? 'var(--danger-bg)' : 'var(--warning-bg)',
                            color: esEntrada ? 'var(--success)' : esSalida ? 'var(--danger)' : 'var(--warning)'
                          }}>
                            {m.tipo}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                            {esEntrada ? '+' : esSalida ? '-' : ''}{formatQuantity(m.cantidad, m.unidad_venta)}
                          </span>
                        </div>

                        {m.motivo && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {m.motivo}
                          </div>
                        )}

                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} /> {formatDate(m.creado_en)} • <User size={11} /> {m.usuario_nombre}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '0.78rem' }}>
                        <div style={{ color: 'var(--text-muted)' }}>Stock resultante:</div>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {formatQuantity(m.stock_nuevo, m.unidad_venta)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <StockModal
        producto={producto}
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        onSuccess={() => {
          fetchDetalle();
          onProductUpdated && onProductUpdated();
        }}
      />
    </div>
  );
}

export default DetalleProducto;
