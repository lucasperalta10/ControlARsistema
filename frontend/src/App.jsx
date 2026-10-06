import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { apiRequest } from './api/client.js';

// Layout
import Header from './components/layout/Header.jsx';
import BottomNavigation from './components/layout/BottomNavigation.jsx';

// Pages
import Login from './pages/Login.jsx';
import Inicio from './pages/Inicio.jsx';
import Productos from './pages/Productos.jsx';
import AgregarProducto from './pages/AgregarProducto.jsx';
import DetalleProducto from './pages/DetalleProducto.jsx';
import Reponer from './pages/Reponer.jsx';
import AcercaDe from './pages/AcercaDe.jsx';
import MiCuenta from './pages/MiCuenta.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

export function App() {
  const { usuario, loading, isSuperAdmin, puedeGestionarCategorias } = useAuth();
  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [reponerCount, setReponerCount] = useState(0);

  // Consultar conteo de productos a reponer periódicamente para el badge
  const updateReponerCount = async () => {
    if (!usuario) return;
    try {
      const res = await apiRequest('/stock/reponer');
      if (res.success) {
        setReponerCount(res.total || res.productos?.length || 0);
      }
    } catch (e) {
      // Ignorar
    }
  };

  useEffect(() => {
    if (usuario) {
      updateReponerCount();
    }
  }, [usuario, activeTab]);

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="app-container">
        <Login />
      </div>
    );
  }

  const handleSelectProduct = (producto) => {
    setSelectedProductId(producto.id);
    setActiveTab('detalle');
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        reponerCount={reponerCount}
        onNavigateAdmin={() => handleTabChange('admin')}
      />

      <main className="main-content">
        {activeTab === 'inicio' && (
          <Inicio
            onNavigateTab={handleTabChange}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {activeTab === 'productos' && (
          <Productos
            onSelectProduct={handleSelectProduct}
            onNavigateAdd={() => handleTabChange('agregar')}
          />
        )}

        {activeTab === 'agregar' && (
          <AgregarProducto
            onProductCreated={(nuevoProd) => {
              updateReponerCount();
              handleSelectProduct(nuevoProd);
            }}
            onCancel={() => handleTabChange('productos')}
          />
        )}

        {activeTab === 'reponer' && (
          <Reponer
            onSelectProduct={handleSelectProduct}
          />
        )}

        {activeTab === 'acerca-de' && <AcercaDe />}

        {activeTab === 'mi-cuenta' && <MiCuenta />}

        {activeTab === 'detalle' && (
          <DetalleProducto
            productoId={selectedProductId}
            onBack={() => handleTabChange('productos')}
            onProductUpdated={updateReponerCount}
            onProductDeleted={() => {
              updateReponerCount();
              handleTabChange('productos');
            }}
          />
        )}

        {activeTab === 'admin' && (isSuperAdmin || puedeGestionarCategorias) && (
          <AdminDashboard onBack={() => handleTabChange('mi-cuenta')} />
        )}
      </main>

      <BottomNavigation
        activeTab={activeTab === 'detalle' || activeTab === 'admin' ? '' : activeTab}
        onTabChange={handleTabChange}
        reponerCount={reponerCount}
      />
    </div>
  );
}

export default App;
