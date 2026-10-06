import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, Lock, UserCheck, AlertCircle } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!dni || !pin) {
      setError('Por favor, completá tu DNI y tu PIN.');
      return;
    }

    setLoading(true);
    try {
      await login(dni, pin);
    } catch (err) {
      setError(err.message || 'DNI o PIN incorrecto. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      background: 'radial-gradient(circle at top, #1e293b 0%, #0b0f19 70%)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          borderRadius: '18px',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
        }}>
          <Package size={34} color="#fff" />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          ControlAR
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Victoria Productos Artesanales
        </p>
      </div>

      <div className="card desktop-login-card" style={{ padding: '28px 24px', boxShadow: 'var(--shadow-lg)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>
          Iniciar Sesión
        </h2>

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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Número de DNI</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="form-input"
              placeholder="Ej: 12345678"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">PIN de Acceso</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              className="form-input"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            {loading ? 'Ingresando...' : 'Entrar a ControlAR'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Acceso exclusivo para el personal del negocio.<br />
          Para soporte o alta de usuario, comunicate con el administrador.
        </div>
      </div>
    </div>
  );
}

export default Login;
