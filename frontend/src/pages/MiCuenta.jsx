import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../api/client.js';
import { User, KeyRound, LogOut, Shield, Check, AlertCircle } from 'lucide-react';

export function MiCuenta() {
  const { usuario, logout } = useAuth();
  const [pinActual, setPinActual] = useState('');
  const [pinNuevo, setPinNuevo] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [error, setError] = useState(null);

  // Ocultar DNI parcialmente (ej: 12345678 -> 12***678)
  const ocultarDni = (dniStr) => {
    if (!dniStr) return '***';
    const s = String(dniStr);
    if (s.length <= 4) return s;
    return `${s.slice(0, 2)}••••${s.slice(-3)}`;
  };

  const handleCambiarPin = async (e) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (!pinActual || !pinNuevo) {
      setError('Debés ingresar tu PIN actual y el nuevo PIN.');
      return;
    }

    if (pinNuevo !== pinConfirm) {
      setError('El nuevo PIN y su confirmación no coinciden.');
      return;
    }

    if (pinNuevo.length < 4 || pinNuevo.length > 8) {
      setError('El nuevo PIN debe tener entre 4 y 8 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/auth/pin', {
        method: 'PUT',
        body: {
          pinActual,
          pinNuevo
        }
      });

      if (res.success) {
        setMensajeExito('¡Tu PIN fue actualizado exitosamente!');
        setPinActual('');
        setPinNuevo('');
        setPinConfirm('');
      }
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
          Mi Cuenta
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Datos de acceso y seguridad personal
        </p>
      </div>

      {/* Tarjeta de Perfil */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 16px' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: '1.3rem'
        }}>
          {usuario?.nombre ? usuario.nombre[0].toUpperCase() : 'U'}
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
            {usuario?.nombre} {usuario?.apellido}
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            DNI: {ocultarDni(usuario?.dni)}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: usuario?.rol === 'SUPER_ADMIN' ? 'var(--primary)' : 'var(--text-muted)',
            marginTop: '4px'
          }}>
            <Shield size={12} /> Rol: {usuario?.rol}
          </div>
        </div>
      </div>

      {/* Formulario de Cambio de PIN */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <KeyRound size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
            Cambiar mi PIN de acceso
          </h3>
        </div>

        {mensajeExito && (
          <div style={{
            background: 'var(--success-bg)',
            color: '#34d399',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '14px',
            fontSize: '0.85rem',
            border: '1px solid var(--success-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Check size={16} /> {mensajeExito}
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '14px',
            fontSize: '0.85rem',
            border: '1px solid var(--danger-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleCambiarPin}>
          <div className="form-group">
            <label className="form-label">PIN actual</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              className="form-input"
              placeholder="••••"
              value={pinActual}
              onChange={(e) => setPinActual(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="form-group">
              <label className="form-label">Nuevo PIN (4 a 8 dígitos)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                className="form-input"
                placeholder="••••"
                value={pinNuevo}
                onChange={(e) => setPinNuevo(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar nuevo PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                className="form-input"
                placeholder="••••"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            disabled={loading}
            style={{ width: '100%', marginTop: '6px' }}
          >
            {loading ? 'Actualizando PIN...' : 'Actualizar mi PIN'}
          </button>
        </form>
      </div>

      {/* Botón de Cerrar Sesión */}
      <button
        onClick={logout}
        className="btn btn-danger btn-large"
        style={{ marginTop: '10px' }}
      >
        <LogOut size={18} />
        Cerrar Sesión
      </button>
    </div>
  );
}

export default MiCuenta;
