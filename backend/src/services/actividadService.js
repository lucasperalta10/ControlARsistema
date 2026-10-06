import { query } from '../config/db.js';

/**
 * Servicio de Auditoría y Registro de Actividad
 */
export async function registrarActividad({ usuarioId, accion, entidad, entidadId = null, descripcion = '' }) {
  try {
    const sql = `
      INSERT INTO actividad (usuario_id, accion, entidad, entidad_id, descripcion)
      VALUES (?, ?, ?, ?, ?)
    `;
    await query(sql, [usuarioId || null, accion, entidad, entidadId, descripcion]);
  } catch (error) {
    console.error('[ACTIVIDAD] Error al registrar actividad:', error.message);
  }
}

export async function listarActividad({ limit = 50, offset = 0 } = {}) {
  const sql = `
    SELECT a.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.dni AS usuario_dni
    FROM actividad a
    LEFT JOIN usuarios u ON a.usuario_id = u.id
    ORDER BY a.creado_en DESC
    LIMIT ? OFFSET ?
  `;
  return await query(sql, [Number(limit), Number(offset)]);
}

export default {
  registrarActividad,
  listarActividad
};
