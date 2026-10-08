import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRequest } from '../../api/client.js';
import { formatDate } from '../../utils/formatters.js';
import {
  Users,
  Layers,
  Activity,
  Server,
  ArrowLeft,
  Plus,
  Edit2,
  KeyRound,
  Trash2,
  AlertCircle,
  Shield,
  Sliders
} from 'lucide-react';

export function AdminDashboard({ onBack }) {
  const { isSuperAdmin, puedeGestionarCategorias } = useAuth();
  const [seccion, setSeccion] = useState(isSuperAdmin ? 'usuarios' : 'categorias');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Estados de datos
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [sistema, setSistema] = useState(null);

  // Modales y formularios Usuarios
  const [modalUsuario, setModalUsuario] = useState(false);
  const [usuarioForm, setUsuarioForm] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    pin: '',
    rol: 'USUARIO',
    puede_gestionar_categorias: false
  });

  const [modalEditarUsuario, setModalEditarUsuario] = useState(null);
  const [editarUsuarioForm, setEditarUsuarioForm] = useState({
    nombre: '',
    apellido: '',
    rol: 'USUARIO',
    puede_gestionar_categorias: false
  });

  const [modalResetPin, setModalResetPin] = useState(null);
  const [nuevoPinAdmin, setNuevoPinAdmin] = useState('');

  // Modales y formularios Categorías
  const [modalCategoria, setModalCategoria] = useState(false);
  const [categoriaForm, setCategoriaForm] = useState({ nombre: '', margen_predeterminado: '' });

  // Modal para eliminar categoría con resolución de productos
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [categoriaDestinoId, setCategoriaDestinoId] = useState('');
  const [loadingEliminar, setLoadingEliminar] = useState(false);

  // Configuración comercial
  const [margenPredeterminadoAdmin, setMargenPredeterminadoAdmin] = useState('50');
  const [guardandoMargenAdmin, setGuardandoMargenAdmin] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (seccion === 'usuarios') {
        const res = await apiRequest('/usuarios');
        if (res.success) setUsuarios(res.usuarios);
      } else if (seccion === 'categorias') {
        const res = await apiRequest('/categorias?todas=true');
        if (res.success) setCategorias(res.categorias);
      } else if (seccion === 'actividad') {
        const res = await apiRequest('/actividad?limit=50');
        if (res.success) setActividades(res.actividad);
      } else if (seccion === 'sistema') {
        const [estadoRes, confRes] = await Promise.all([
          apiRequest('/sistema/estado'),
          apiRequest('/sistema/configuracion')
        ]);
        if (estadoRes.success) setSistema(estadoRes);
        if (confRes.success && confRes.configuracion?.margen_predeterminado !== undefined) {
          setMargenPredeterminadoAdmin(String(confRes.configuracion.margen_predeterminado));
        }
      }
    } catch (err) {
      setError(err.message || 'Error cargando datos de administración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [seccion]);

  // Manejadores Usuarios
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/usuarios', { method: 'POST', body: usuarioForm });
      setMensajeExito('Usuario creado exitosamente.');
      setModalUsuario(false);
      setUsuarioForm({
        dni: '',
        nombre: '',
        apellido: '',
        pin: '',
        rol: 'USUARIO',
        puede_gestionar_categorias: false
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const abrirEditarUsuario = (u) => {
    setModalEditarUsuario(u);
    setEditarUsuarioForm({
      nombre: u.nombre,
      apellido: u.apellido,
      rol: u.rol,
      puede_gestionar_categorias: Boolean(u.puede_gestionar_categorias)
    });
  };

  const handleActualizarUsuario = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/usuarios/${modalEditarUsuario.id}`, {
        method: 'PUT',
        body: editarUsuarioForm
      });
      setMensajeExito('Usuario y permisos actualizados correctamente.');
      setModalEditarUsuario(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleEstadoUsuario = async (u) => {
    try {
      await apiRequest(`/usuarios/${u.id}/estado`, {
        method: 'PATCH',
        body: { activo: u.activo ? false : true }
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/usuarios/${modalResetPin}/reset-pin`, {
        method: 'POST',
        body: { nuevoPin: nuevoPinAdmin }
      });
      setMensajeExito('PIN restablecido correctamente.');
      setModalResetPin(null);
      setNuevoPinAdmin('');
    } catch (err) {
      alert(err.message);
    }
  };

  // Manejadores Categorías
  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/categorias', { method: 'POST', body: categoriaForm });
      setMensajeExito('Categoría creada exitosamente.');
      setModalCategoria(false);
      setCategoriaForm({ nombre: '', margen_predeterminado: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const abrirModalEliminarCategoria = (cat) => {
    setCategoriaAEliminar(cat);
    setCategoriaDestinoId('');
    setError(null);
  };

  const handleConfirmarEliminarConMover = async () => {
    if (!categoriaDestinoId) {
      alert('Por favor, seleccioná una categoría de destino para transferir los productos.');
      return;
    }
    setLoadingEliminar(true);
    try {
      const res = await apiRequest(`/categorias/${categoriaAEliminar.id}`, {
        method: 'DELETE',
        body: { mover_a_categoria_id: Number(categoriaDestinoId) }
      });
      setMensajeExito(res.message || 'Categoría eliminada y productos movidos exitosamente.');
      setCategoriaAEliminar(null);
      setCategoriaDestinoId('');
      loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar la categoría.');
    } finally {
      setLoadingEliminar(false);
    }
  };

  const handleConfirmarEliminarDirecto = async () => {
    setLoadingEliminar(true);
    try {
      const res = await apiRequest(`/categorias/${categoriaAEliminar.id}`, {
        method: 'DELETE'
      });
      setMensajeExito(res.message || 'Categoría eliminada exitosamente.');
      setCategoriaAEliminar(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar la categoría.');
    } finally {
      setLoadingEliminar(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
            {isSuperAdmin ? 'Panel de Administración' : 'Gestión de Categorías'}
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {isSuperAdmin ? 'Configuración, permisos y auditoría' : 'Creación y administración de categorías'}
          </p>
        </div>
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
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{mensajeExito}</span>
          <button onClick={() => setMensajeExito(null)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}>✕</button>
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
          border: '1px solid var(--danger-border)'
        }}>
          {error}
        </div>
      )}

      {/* Tabs para Super Admin */}
      {isSuperAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
          <button
            onClick={() => setSeccion('usuarios')}
            className={`btn ${seccion === 'usuarios' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 4px', fontSize: '0.75rem', flexDirection: 'column', gap: '4px' }}
          >
            <Users size={16} /> Usuarios
          </button>
          <button
            onClick={() => setSeccion('categorias')}
            className={`btn ${seccion === 'categorias' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 4px', fontSize: '0.75rem', flexDirection: 'column', gap: '4px' }}
          >
            <Layers size={16} /> Categorías
          </button>
          <button
            onClick={() => setSeccion('actividad')}
            className={`btn ${seccion === 'actividad' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 4px', fontSize: '0.75rem', flexDirection: 'column', gap: '4px' }}
          >
            <Activity size={16} /> Actividad
          </button>
          <button
            onClick={() => setSeccion('sistema')}
            className={`btn ${seccion === 'sistema' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 4px', fontSize: '0.75rem', flexDirection: 'column', gap: '4px' }}
          >
            <Server size={16} /> Sistema
          </button>
        </div>
      )}

      {/* Contenido según sección */}
      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          {/* SECCIÓN USUARIOS */}
          {seccion === 'usuarios' && isSuperAdmin && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Usuarios del Sistema</h2>
                <button
                  onClick={() => setModalUsuario(true)}
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <Plus size={14} /> Nuevo Usuario
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {usuarios.map((u) => (
                  <div key={u.id} className="card" style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                          {u.nombre} {u.apellido}
                        </h3>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          DNI: {u.dni} • Rol: <strong style={{ color: u.rol === 'SUPER_ADMIN' ? 'var(--primary)' : 'var(--text-primary)' }}>{u.rol}</strong>
                          {u.rol === 'USUARIO' && Boolean(u.puede_gestionar_categorias) && (
                            <span style={{
                              marginLeft: '6px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}>
                              Gestor de categorías
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Último acceso: {u.ultimo_acceso ? formatDate(u.ultimo_acceso) : 'Nunca'}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: u.activo ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: u.activo ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                      <button
                        onClick={() => abrirEditarUsuario(u)}
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.75rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                      <button
                        onClick={() => setModalResetPin(u.id)}
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.75rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <KeyRound size={13} /> Reset PIN
                      </button>
                      <button
                        onClick={() => handleToggleEstadoUsuario(u)}
                        className={`btn ${u.activo ? 'btn-danger' : 'btn-success'}`}
                        style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN CATEGORÍAS */}
          {seccion === 'categorias' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Categorías</h2>
                <button
                  onClick={() => setModalCategoria(true)}
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <Plus size={14} /> Nueva Categoría
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categorias.map((c) => (
                  <div key={c.id} className="card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                        {c.nombre}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Margen sugerido: {c.margen_predeterminado !== null ? `${c.margen_predeterminado}%` : 'Sin asignar'} • {c.total_productos || 0} productos
                      </div>
                    </div>
                    {c.activo === 1 ? (
                      <button
                        onClick={() => abrirModalEliminarCategoria(c)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inactiva</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN AUDITORÍA ACTIVIDAD */}
          {seccion === 'actividad' && isSuperAdmin && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                Registro de Actividad y Auditoría
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {actividades.map((a) => (
                  <div key={a.id} className="card" style={{ padding: '10px 12px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>{a.accion}</strong>
                      <span>{formatDate(a.creado_en)}</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', marginTop: '4px', fontWeight: 500 }}>
                      {a.descripcion}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>
                      Operador: {a.usuario_nombre ? `${a.usuario_nombre} ${a.usuario_apellido}` : 'Sistema'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN ESTADO DEL SISTEMA */}
          {seccion === 'sistema' && isSuperAdmin && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                Sistema y Configuración
              </h2>

              {/* Tarjeta Configuración Comercial */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sliders size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                    Configuración Comercial del Negocio
                  </h3>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Porcentaje de recargo predeterminado vigente para calcular el precio de góndola en productos nuevos.
                </p>

                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontSize: '0.76rem',
                  color: '#93c5fd',
                  marginBottom: '14px'
                }}>
                  🛡️ <strong>Regla del negocio:</strong> Modificar este valor solo impacta en productos nuevos. Los productos existentes no se alteran ni recalculan.
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const val = Number(margenPredeterminadoAdmin);
                  if (isNaN(val) || val < 0 || val >= 100) {
                    setError('El porcentaje de margen debe estar entre 0% y 99.99%.');
                    return;
                  }
                  setGuardandoMargenAdmin(true);
                  setError(null);
                  try {
                    const res = await apiRequest('/sistema/configuracion/margen-predeterminado', {
                      method: 'PUT',
                      body: { margen_predeterminado: val }
                    });
                    if (res.success) {
                      setMensajeExito(res.message);
                      setMargenPredeterminadoAdmin(String(res.configuracion.margen_predeterminado));
                    }
                  } catch (err) {
                    setError(err.message || 'Error al guardar la configuración comercial.');
                  } finally {
                    setGuardandoMargenAdmin(false);
                  }
                }} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label">Porcentaje predeterminado (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="99.9"
                      className="form-input"
                      value={margenPredeterminadoAdmin}
                      onChange={(e) => setMargenPredeterminadoAdmin(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={guardandoMargenAdmin}
                    style={{ padding: '9px 16px', fontSize: '0.82rem' }}
                  >
                    {guardandoMargenAdmin ? 'Guardando...' : 'Guardar'}
                  </button>
                </form>
              </div>

              {sistema && (
                <>
                  <div className="card">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                      Base de Datos
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                      <div>Estado: <strong style={{ color: 'var(--success)' }}>{sistema.baseDeDatos?.estado}</strong></div>
                      <div>Motor: <strong>{sistema.baseDeDatos?.modo}</strong></div>
                      <div>Latencia: <strong>{sistema.baseDeDatos?.latenciaMs} ms</strong></div>
                      <div>Productos: <strong>{sistema.baseDeDatos?.conteos?.productosActivos}</strong></div>
                      <div>Movimientos: <strong>{sistema.baseDeDatos?.conteos?.totalMovimientosStock}</strong></div>
                      <div>Usuarios: <strong>{sistema.baseDeDatos?.conteos?.usuariosActivos}</strong></div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                      Servidor API
                    </h3>
                    <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Versión: <strong>{sistema.sistema?.version}</strong></div>
                      <div>Entorno: <strong>{sistema.sistema?.entorno}</strong></div>
                      <div>Uptime: <strong>{Math.floor((sistema.sistema?.uptimeSegundos || 0) / 60)} minutos</strong></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Nuevo Usuario */}
      {modalUsuario && (
        <div className="modal-overlay" onClick={() => setModalUsuario(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
              Crear Nuevo Usuario
            </h3>
            <form onSubmit={handleCrearUsuario}>
              <div className="form-group">
                <label className="form-label">DNI</label>
                <input
                  type="text"
                  className="form-input"
                  value={usuarioForm.dni}
                  onChange={(e) => setUsuarioForm({ ...usuarioForm, dni: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-input"
                    value={usuarioForm.nombre}
                    onChange={(e) => setUsuarioForm({ ...usuarioForm, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido</label>
                  <input
                    type="text"
                    className="form-input"
                    value={usuarioForm.apellido}
                    onChange={(e) => setUsuarioForm({ ...usuarioForm, apellido: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">PIN inicial (4 a 8 dígitos)</label>
                <input
                  type="password"
                  className="form-input"
                  value={usuarioForm.pin}
                  onChange={(e) => setUsuarioForm({ ...usuarioForm, pin: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rol del Sistema</label>
                <select
                  className="form-select"
                  value={usuarioForm.rol}
                  onChange={(e) => setUsuarioForm({ ...usuarioForm, rol: e.target.value })}
                >
                  <option value="USUARIO">USUARIO (Operador estándar)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Administrador)</option>
                </select>
              </div>

              {usuarioForm.rol === 'USUARIO' && (
                <div style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={usuarioForm.puede_gestionar_categorias}
                      onChange={(e) => setUsuarioForm({ ...usuarioForm, puede_gestionar_categorias: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block' }}>
                        Permiso para crear y eliminar categorías
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Permite a esta cuenta gestionar categorías sin otorgarle control sobre el resto de la administración.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-large">Crear Usuario</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario y Permisos */}
      {modalEditarUsuario && (
        <div className="modal-overlay" onClick={() => setModalEditarUsuario(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
              Editar Usuario (DNI: {modalEditarUsuario.dni})
            </h3>
            <form onSubmit={handleActualizarUsuario}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editarUsuarioForm.nombre}
                    onChange={(e) => setEditarUsuarioForm({ ...editarUsuarioForm, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editarUsuarioForm.apellido}
                    onChange={(e) => setEditarUsuarioForm({ ...editarUsuarioForm, apellido: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rol del Sistema</label>
                <select
                  className="form-select"
                  value={editarUsuarioForm.rol}
                  onChange={(e) => setEditarUsuarioForm({ ...editarUsuarioForm, rol: e.target.value })}
                >
                  <option value="USUARIO">USUARIO (Operador estándar)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Administrador)</option>
                </select>
              </div>

              {editarUsuarioForm.rol === 'SUPER_ADMIN' ? (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px'
                }}>
                  🛡️ Los administradores (SUPER_ADMIN) tienen permisos completos para gestionar categorías automáticamente.
                </div>
              ) : (
                <div style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={editarUsuarioForm.puede_gestionar_categorias}
                      onChange={(e) => setEditarUsuarioForm({ ...editarUsuarioForm, puede_gestionar_categorias: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.86rem', color: '#fff', display: 'block' }}>
                        Permiso para crear y eliminar categorías
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Permite a este usuario administrar las categorías del catálogo sin acceso a auditoría ni usuarios.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalEditarUsuario(null)}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset PIN */}
      {modalResetPin && (
        <div className="modal-overlay" onClick={() => setModalResetPin(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
              Restablecer PIN de Usuario
            </h3>
            <form onSubmit={handleResetPin}>
              <div className="form-group">
                <label className="form-label">Nuevo PIN (mínimo 4 dígitos)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••"
                  value={nuevoPinAdmin}
                  onChange={(e) => setNuevoPinAdmin(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-large">Restablecer PIN</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Categoría */}
      {modalCategoria && (
        <div className="modal-overlay" onClick={() => setModalCategoria(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
              Crear Categoría
            </h3>
            <form onSubmit={handleCrearCategoria}>
              <div className="form-group">
                <label className="form-label">Nombre de categoría</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Panadería"
                  value={categoriaForm.nombre}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Margen predeterminado (%) (opcional)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="Ej: 45"
                  value={categoriaForm.margen_predeterminado}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, margen_predeterminado: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-large">Crear Categoría</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Categoría con Resolución de Productos Asociados */}
      {categoriaAEliminar && (
        <div className="modal-overlay" onClick={() => !loadingEliminar && setCategoriaAEliminar(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertCircle size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                ❌ ¿Eliminar "{categoriaAEliminar.nombre}"?
              </h3>
            </div>

            {categoriaAEliminar.total_productos > 0 ? (
              <>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  marginBottom: '16px'
                }}>
                  <p style={{ color: '#fca5a5', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                    Esta categoría tiene {categoriaAEliminar.total_productos} {categoriaAEliminar.total_productos === 1 ? 'producto asociado' : 'productos asociados'}.
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '6px', marginBottom: 0 }}>
                    Para poder eliminarla, debés mover todos sus productos a otra categoría existente.
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Mover productos a la categoría:
                  </label>
                  <select
                    className="form-select"
                    value={categoriaDestinoId}
                    onChange={(e) => setCategoriaDestinoId(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccionar categoría de destino --</option>
                    {categorias
                      .filter((c) => c.id !== categoriaAEliminar.id && c.activo === 1)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.total_productos || 0} productos)
                        </option>
                      ))}
                  </select>
                  {categorias.filter((c) => c.id !== categoriaAEliminar.id && c.activo === 1).length === 0 && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '6px' }}>
                      No hay otras categorías activas disponibles. Creá otra categoría primero para transferir los productos.
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setCategoriaAEliminar(null);
                      setCategoriaDestinoId('');
                    }}
                    disabled={loadingEliminar}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={!categoriaDestinoId || loadingEliminar}
                    onClick={handleConfirmarEliminarConMover}
                  >
                    {loadingEliminar ? 'Moviendo...' : 'Mover productos y Eliminar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '18px' }}>
                  Esta categoría no tiene productos asociados. ¿Confirmás que deseás eliminarla?
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCategoriaAEliminar(null)}
                    disabled={loadingEliminar}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={loadingEliminar}
                    onClick={handleConfirmarEliminarDirecto}
                  >
                    {loadingEliminar ? 'Eliminando...' : 'Eliminar categoría'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
