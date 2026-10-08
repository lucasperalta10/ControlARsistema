import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { calculateMostradorPreview, formatCurrency } from '../utils/formatters.js';
import { Calculator, Check, ArrowLeft, AlertCircle, Sliders } from 'lucide-react';

export function AgregarProducto({ onProductCreated, onCancel }) {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [unidadVenta, setUnidadVenta] = useState('Unidad');
  const [costoReal, setCostoReal] = useState('');
  const [margenGanancia, setMargenGanancia] = useState('50');
  const [margenPredeterminadoSistema, setMargenPredeterminadoSistema] = useState(50);
  const [stockInicial, setStockInicial] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  
  // Modal para modificar el porcentaje predeterminado del negocio
  const [mostrarModalConfigMargen, setMostrarModalConfigMargen] = useState(false);
  const [nuevoMargenConfig, setNuevoMargenConfig] = useState('50');
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [mensajeConfig, setMensajeConfig] = useState(null);

  // Calculadora auxiliar de producto fraccionado (opcional para el usuario)
  const [mostrarCalculadorFraccionado, setMostrarCalculadorFraccionado] = useState(false);
  const [paqueteContenido, setPaqueteContenido] = useState('');
  const [paquetePrecio, setPaquetePrecio] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, confRes] = await Promise.all([
          apiRequest('/categorias'),
          apiRequest('/sistema/configuracion')
        ]);
        if (catRes.success) setCategorias(catRes.categorias);
        if (confRes.success && confRes.configuracion?.margen_predeterminado !== undefined) {
          const mPred = Number(confRes.configuracion.margen_predeterminado);
          setMargenPredeterminadoSistema(mPred);
          setMargenGanancia(String(mPred));
          setNuevoMargenConfig(String(mPred));
        }
      } catch (e) {
        console.error('Error cargando datos iniciales:', e);
      }
    };
    fetchData();
  }, []);

  // Al seleccionar categoría, sugerir margen si la categoría tiene predeterminado
  const handleCategoriaChange = (e) => {
    const catId = e.target.value;
    setCategoriaId(catId);
    if (catId) {
      const cat = categorias.find(c => String(c.id) === String(catId));
      if (cat && cat.margen_predeterminado !== null) {
        setMargenGanancia(String(cat.margen_predeterminado));
      }
    } else {
      setMargenGanancia(String(margenPredeterminadoSistema));
    }
  };

  const handleGuardarNuevoMargenPredeterminado = async (e) => {
    e.preventDefault();
    const val = Number(nuevoMargenConfig);
    if (isNaN(val) || val < 0) {
      alert('El porcentaje debe ser mayor o igual a 0%.');
      return;
    }

    setGuardandoConfig(true);
    setMensajeConfig(null);
    try {
      const res = await apiRequest('/sistema/configuracion/margen-predeterminado', {
        method: 'PUT',
        body: { margen_predeterminado: val }
      });
      if (res.success) {
        setMargenPredeterminadoSistema(res.configuracion.margen_predeterminado);
        setMargenGanancia(String(res.configuracion.margen_predeterminado));
        setMensajeConfig(res.message);
        setTimeout(() => {
          setMostrarModalConfigMargen(false);
          setMensajeConfig(null);
        }, 1500);
      }
    } catch (err) {
      alert(err.message || 'Error al guardar la configuración.');
    } finally {
      setGuardandoConfig(false);
    }
  };

  // Aplicar cálculo de fraccionado (ej. $4000 / 400g = $10/g)
  const aplicarFraccionado = () => {
    const pPrecio = Number(paquetePrecio);
    const pContenido = Number(paqueteContenido);
    if (pPrecio > 0 && pContenido > 0) {
      const costoUnitario = Math.round((pPrecio / pContenido) * 100) / 100;
      setCostoReal(String(costoUnitario));
      setStockInicial(String(pContenido));
      setMostrarCalculadorFraccionado(false);
    }
  };

  // Cálculo en vivo del precio de mostrador proyectado
  const precioMostradorPreview = calculateMostradorPreview(costoReal, margenGanancia);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    const cReal = Number(costoReal);
    const margen = Number(margenGanancia);

    if (isNaN(cReal) || cReal < 0) {
      setError('El precio de compra no puede ser negativo.');
      return;
    }

    if (isNaN(margen) || margen < 0) {
      setError('El porcentaje de ganancia o recargo debe ser mayor o igual a 0%.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/productos', {
        method: 'POST',
        body: {
          nombre: nombre.trim(),
          categoria_id: categoriaId ? Number(categoriaId) : null,
          unidad_venta: unidadVenta,
          precio_compra: cReal,
          costo_real: cReal,
          margen_ganancia: margen,
          stock_inicial: Number(stockInicial) || 0,
          stock_minimo: Number(stockMinimo) || 0
        }
      });

      if (res.success) {
        onProductCreated && onProductCreated(res.producto);
      }
    } catch (err) {
      setError(err.message || 'Error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
            Agregar Producto
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Carga de mercadería y cálculo de precios
          </p>
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
          border: '1px solid var(--danger-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="desktop-two-col">
        {/* Columna Izquierda: Información y Stock */}
        <div>
          {/* Sección Información General */}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
              1. Información del Producto
            </h3>

            <div className="form-group">
              <label className="form-label">Nombre del producto *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Snack Frutos Secos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría (opcional)</label>
              <select
                className="form-select"
                value={categoriaId}
                onChange={handleCategoriaChange}
              >
                <option value="">Seleccionar categoría...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.margen_predeterminado !== null ? `(Margen sugerido: ${c.margen_predeterminado}%)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Unidad de venta *</label>
              <select
                className="form-select"
                value={unidadVenta}
                onChange={(e) => setUnidadVenta(e.target.value)}
                required
              >
                <option value="Unidad">Unidad (ej: jugos, alfajores, bebidas)</option>
                <option value="Gramo">Gramo (ej: snacks fraccionados)</option>
                <option value="Kilogramo">Kilogramo (ej: congelados, queso)</option>
                <option value="Mililitro">Mililitro</option>
                <option value="Litro">Litro</option>
              </select>
            </div>
          </div>

          {/* Asistente Fraccionado */}
          {(unidadVenta === 'Gramo' || unidadVenta === 'Kilogramo') && (
            <div style={{ marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setMostrarCalculadorFraccionado(!mostrarCalculadorFraccionado)}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.85rem', padding: '10px' }}
              >
                <Calculator size={16} />
                {mostrarCalculadorFraccionado ? 'Cerrar calculadora de fraccionado' : '¿Compraste un paquete para fraccionar? Calcular costo unitario'}
              </button>

              {mostrarCalculadorFraccionado && (
                <div className="card" style={{ marginTop: '10px', background: 'var(--bg-main)', border: '1px dashed var(--primary)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Ingresá el costo total del paquete y su contenido para obtener el costo por {unidadVenta.toLowerCase()}:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <label className="form-label">Precio compra paquete ($)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ej: 4000"
                        className="form-input"
                        value={paquetePrecio}
                        onChange={(e) => setPaquetePrecio(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">Contenido total ({unidadVenta === 'Gramo' ? 'g' : 'kg'})</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ej: 400"
                        className="form-input"
                        value={paqueteContenido}
                        onChange={(e) => setPaqueteContenido(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                    onClick={aplicarFraccionado}
                  >
                    Aplicar Costo Unitario
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sección Stock */}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
              2. Control de Stock Inicial
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Cantidad inicial ({unidadVenta})</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={stockInicial}
                  onChange={(e) => setStockInicial(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock mínimo aviso ({unidadVenta})</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Mostrador, Costos y Guardado */}
        <div>
          {/* Tarjeta Destacada de Precio de Mostrador Proyectado */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, #131d33 0%, #1e293b 100%)',
            border: '1.5px solid rgba(59, 130, 246, 0.4)',
            textAlign: 'center',
            padding: '20px 16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Precio de mostrador proyectado
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary)', margin: '6px 0' }}>
              {formatCurrency(precioMostradorPreview)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Fórmula: Compra × (1 + % / 100)
            </div>
          </div>

          {/* Sección Costos y Margen */}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
              3. Costos y Recargo de Ganancia
            </h3>

            <div className="form-group">
              <label className="form-label">Precio de compra (costo con IVA) ($) *</label>
              <input
                type="number"
                step="any"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={costoReal}
                onChange={(e) => setCostoReal(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>Costo final del producto con IVA incluido</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Porcentaje de recargo: <strong style={{ color: 'var(--primary)' }}>{margenGanancia}%</strong>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setNuevoMargenConfig(String(margenPredeterminadoSistema));
                    setMostrarModalConfigMargen(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                  title="Configurar porcentaje predeterminado para futuras cargas"
                >
                  <Sliders size={13} /> Predet: {margenPredeterminadoSistema}%
                </button>
              </div>

              <input
                type="number"
                step="0.5"
                min="0"
                max="999.9"
                className="form-input"
                placeholder="Ej: 50"
                value={margenGanancia}
                onChange={(e) => setMargenGanancia(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {[30, 40, 50, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMargenGanancia(String(m))}
                    style={{
                      flex: 1,
                      padding: '6px 2px',
                      borderRadius: 'var(--radius-sm)',
                      background: margenGanancia === String(m) ? 'var(--primary)' : 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      color: margenGanancia === String(m) ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {m}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
            style={{ width: '100%', marginBottom: '16px' }}
          >
            {loading ? 'Guardando producto...' : 'Guardar Producto'}
          </button>
        </div>
      </form>

      {/* Modal para configurar porcentaje predeterminado para futuras cargas */}
      {mostrarModalConfigMargen && (
        <div className="modal-overlay" onClick={() => setMostrarModalConfigMargen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sliders size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                Porcentaje Predeterminado
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Este porcentaje se utilizará automáticamente en los <strong>productos nuevos</strong> que crees en futuras cargas.
            </p>

            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: '0.78rem',
              color: '#93c5fd',
              marginBottom: '16px'
            }}>
              🛡️ <strong>Regla del negocio:</strong> Los productos existentes no sufrirán ninguna modificación ni se recalcularán sus precios. Cada producto conserva su porcentaje original.
            </div>

            {mensajeConfig && (
              <div style={{
                background: 'var(--success-bg)',
                color: 'var(--success)',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '12px',
                fontSize: '0.85rem'
              }}>
                {mensajeConfig}
              </div>
            )}

            <form onSubmit={handleGuardarNuevoMargenPredeterminado}>
              <div className="form-group">
                <label className="form-label">Nuevo porcentaje predeterminado (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="999.9"
                  className="form-input"
                  value={nuevoMargenConfig}
                  onChange={(e) => setNuevoMargenConfig(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMostrarModalConfigMargen(false)}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardandoConfig}
                  style={{ flex: 1 }}
                >
                  {guardandoConfig ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgregarProducto;

