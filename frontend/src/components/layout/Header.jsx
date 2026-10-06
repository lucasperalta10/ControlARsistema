import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Package,
  Home,
  PlusCircle,
  AlertTriangle,
  Info,
  User,
  ShieldCheck,
  LogOut
} from 'lucide-react';

export function Header({ activeTab, onTabChange, reponerCount = 0, onNavigateAdmin }) {
  const { usuario, isSuperAdmin, puedeGestionarCategorias, logout } = useAuth();

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'agregar', label: 'Agregar', icon: PlusCircle },
    { id: 'reponer', label: 'Reponer', icon: AlertTriangle, badge: reponerCount },
    { id: 'acerca-de', label: 'Acerca de', icon: Info },
    { id: 'mi-cuenta', label: 'Mi cuenta', icon: User }
  ];

  return (
    <header className="app-header">
      {/* Marca / Logo */}
      <div
        className="header-brand"
        onClick={() => onTabChange && onTabChange('inicio')}
        style={{ cursor: 'pointer' }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          width: '34px',
          height: '34px',
          borderRadius: '9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
        }}>
          <Package size={20} />
        </div>
        <div>
          <div className="header-brand-title">
            ControlAR
            <span className="header-brand-badge">v1.0.1</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1 }}>
            Victoria Productos Artesanales
          </div>
        </div>
      </div>

      {/* Navegación para Computadora / Tablet (Desktop Navbar) */}
      <nav className="desktop-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange && onTabChange(item.id)}
              className={`desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="desktop-nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Acciones del Usuario en la Derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {(isSuperAdmin || puedeGestionarCategorias) && (
          <button
            onClick={onNavigateAdmin}
            style={{
              background: activeTab === 'admin' ? 'var(--primary)' : 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: activeTab === 'admin' ? '#fff' : 'var(--primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={15} /> {isSuperAdmin ? 'Admin' : 'Categorías'}
          </button>
        )}

        <button
          onClick={logout}
          title="Cerrar sesión"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default Header;
