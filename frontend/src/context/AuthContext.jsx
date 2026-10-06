import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('controlar_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMe = async () => {
      const token = localStorage.getItem('controlar_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiRequest('/auth/me');
        if (res.success && res.usuario) {
          setUsuario(res.usuario);
          localStorage.setItem('controlar_user', JSON.stringify(res.usuario));
        }
      } catch (err) {
        setUsuario(null);
        localStorage.removeItem('controlar_token');
        localStorage.removeItem('controlar_user');
      } finally {
        setLoading(false);
      }
    };

    checkMe();

    const handleExpired = () => {
      setUsuario(null);
    };

    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, []);

  const login = async (dni, pin) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { dni, pin }
    });

    if (res.success && res.token) {
      localStorage.setItem('controlar_token', res.token);
      localStorage.setItem('controlar_user', JSON.stringify(res.usuario));
      setUsuario(res.usuario);
    }
    return res;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignorar error al cerrar sesión
    }
    localStorage.removeItem('controlar_token');
    localStorage.removeItem('controlar_user');
    setUsuario(null);
  };

  const isSuperAdmin = usuario?.rol === 'SUPER_ADMIN';
  const puedeGestionarCategorias = isSuperAdmin || Boolean(usuario?.puede_gestionar_categorias);

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, isSuperAdmin, puedeGestionarCategorias }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
