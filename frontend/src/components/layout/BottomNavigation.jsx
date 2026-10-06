import React from 'react';
import { Home, Package, PlusCircle, AlertTriangle, Info, User } from 'lucide-react';

export function BottomNavigation({ activeTab, onTabChange, reponerCount = 0 }) {
  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'agregar', label: 'Agregar', icon: PlusCircle },
    { id: 'reponer', label: 'Reponer', icon: AlertTriangle, badge: reponerCount },
    { id: 'acerca-de', label: 'Acerca de', icon: Info },
    { id: 'mi-cuenta', label: 'Mi cuenta', icon: User }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} className="nav-icon" />
              {tab.badge > 0 && <span className="nav-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNavigation;
