import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { ProductCard } from '../components/products/ProductCard.jsx';
import { Search, Filter, Plus } from 'lucide-react';

export function Productos({ onSelectProduct, onNavigateAdd }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS', 'DISPONIBLE', 'REPONER', 'AGOTADO'
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          apiRequest('/productos'),
          apiRequest('/categorias')
        ]);

        if (prodRes.success) setProductos(prodRes.productos);
        if (catRes.success) setCategorias(catRes.categorias);
      } catch (err) {
        console.error('Error cargando catálogo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrado compuesto
  const productosFiltrados = productos.filter((p) => {
    // Filtro búsqueda
    if (busqueda.trim() !== '') {
      const match = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                    (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(busqueda.toLowerCase()));
      if (!match) return false;
    }

    // Filtro estado
    if (filtroEstado !== 'TODOS' && p.estado_stock !== filtroEstado) {
      return false;
    }

    // Filtro categoría
    if (categoriaSeleccionada !== '' && String(p.categoria_id) !== String(categoriaSeleccionada)) {
      return false;
    }

    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Productos
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Catálogo completo de mercadería
          </p>
        </div>
        <button
          onClick={onNavigateAdd}
          className="btn btn-primary"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Buscador */}
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

      {/* Chips de Filtro por Estado */}
      <div className="filter-chips">
        <button
          className={`chip ${filtroEstado === 'TODOS' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('TODOS')}
        >
          Todos ({productos.length})
        </button>
        <button
          className={`chip ${filtroEstado === 'DISPONIBLE' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('DISPONIBLE')}
        >
          Disponibles ({productos.filter(p => p.estado_stock === 'DISPONIBLE').length})
        </button>
        <button
          className={`chip ${filtroEstado === 'REPONER' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('REPONER')}
        >
          Reponer ({productos.filter(p => p.estado_stock === 'REPONER').length})
        </button>
        <button
          className={`chip ${filtroEstado === 'AGOTADO' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('AGOTADO')}
        >
          Agotados ({productos.filter(p => p.estado_stock === 'AGOTADO').length})
        </button>
      </div>

      {/* Filtro por Categoría */}
      {categorias.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <select
            className="form-select"
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '10px 12px' }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.total_productos || 0})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Lista de Productos */}
      {loading ? (
        <div className="spinner" />
      ) : productosFiltrados.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📦</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No hay productos que coincidan</div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Probá cambiando los filtros o la búsqueda.
          </div>
        </div>
      ) : (
        <div className="products-grid">
          {productosFiltrados.map((p) => (
            <ProductCard
              key={p.id}
              producto={p}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Productos;
