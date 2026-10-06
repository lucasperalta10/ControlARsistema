import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../api/client.js';
import { ProductCard } from '../components/products/ProductCard.jsx';
import { StockModal } from '../components/products/StockModal.jsx';
import { PlusCircle, Search, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatQuantity } from '../utils/formatters.js';

export function Inicio({ onNavigateTab, onSelectProduct }) {
  const { usuario } = useAuth();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/productos');
      if (res.success) {
        setProductos(res.productos);
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Métricas
  const totalDisponibles = productos.filter(p => p.estado_stock === 'DISPONIBLE').length;
  const totalReponer = productos.filter(p => p.estado_stock === 'REPONER').length;
  const totalAgotados = productos.filter(p => p.estado_stock === 'AGOTADO').length;

  // Lista de reposición urgente (agotados y reponer)
  const productosReposicion = productos.filter(p => p.estado_stock === 'AGOTADO' || p.estado_stock === 'REPONER');

  // Filtro si el usuario busca algo en la barra del inicio
  const filtrados = busqueda.trim() === ''
    ? productosReposicion
    : productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div>
      {/* Saludo */}
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff' }}>
          Hola, {usuario?.nombre || 'Victoria'} 👋
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Resumen de inventario y estado general
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="metrics-grid">
        <div className="metric-card" onClick={() => onNavigateTab('productos')} style={{ cursor: 'pointer' }}>
          <div className="metric-label">Productos</div>
          <div className="metric-value" style={{ color: 'var(--text-primary)' }}>
            {productos.length}
          </div>
        </div>

        <div className="metric-card reponer" onClick={() => onNavigateTab('reponer')} style={{ cursor: 'pointer' }}>
          <div className="metric-label">Para Reponer</div>
          <div className="metric-value" style={{ color: 'var(--warning)' }}>
            {totalReponer}
          </div>
        </div>

        <div className="metric-card agotado" onClick={() => onNavigateTab('reponer')} style={{ cursor: 'pointer' }}>
          <div className="metric-label">Agotados</div>
          <div className="metric-value" style={{ color: 'var(--danger)' }}>
            {totalAgotados}
          </div>
        </div>
      </div>

      {/* Botón Grande Agregar Producto */}
      <button
        className="btn btn-primary btn-large"
        style={{ marginBottom: '20px' }}
        onClick={() => onNavigateTab('agregar')}
      >
        <PlusCircle size={20} />
        + AGREGAR PRODUCTO
      </button>

      {/* Buscador Rápido */}
      <div className="search-container">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar producto por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Sección Necesitan Reposición */}
      <div style={{ marginTop: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={18} color="var(--warning)" />
            {busqueda.trim() === '' ? 'Necesitan reposición' : 'Resultados de búsqueda'}
          </h2>
          {busqueda.trim() === '' && productosReposicion.length > 0 && (
            <button
              onClick={() => onNavigateTab('reponer')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              Ver todos <ArrowRight size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : filtrados.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
            {busqueda.trim() === '' ? (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
                <div style={{ fontWeight: 700, color: 'var(--success)' }}>¡Todo en orden!</div>
                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  No tenés productos agotados ni por debajo del stock mínimo.
                </div>
              </>
            ) : (
              <div>No encontramos productos que coincidan con "{busqueda}".</div>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {filtrados.map((p) => (
              <ProductCard
                key={p.id}
                producto={p}
                onSelect={(prod) => onSelectProduct(prod)}
              />
            ))}
          </div>
        )}
      </div>

      <StockModal
        producto={selectedStockProduct}
        isOpen={Boolean(selectedStockProduct)}
        onClose={() => setSelectedStockProduct(null)}
        onSuccess={fetchProductos}
      />
    </div>
  );
}

export default Inicio;
