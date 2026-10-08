import { query } from '../config/db.js';
import { registrarActividad } from './actividadService.js';

const DEFAULT_MARGEN_INICIAL = 50.0;

/**
 * Obtiene el porcentaje de recargo/margen predeterminado vigente para productos nuevos.
 * Inicialmente 50% para Victoria Productos Artesanales.
 */
export async function getMargenPredeterminado() {
  try {
    const rows = await query("SELECT valor FROM configuracion WHERE clave = 'margen_predeterminado'");
    if (rows && rows.length > 0 && rows[0].valor) {
      const val = Number(rows[0].valor);
      if (!isNaN(val) && val >= 0 && val <= 999.99) {
        return val;
      }
    }
  } catch (error) {
    // Si la tabla no existiera aún en este instante, fallback seguro
  }
  return DEFAULT_MARGEN_INICIAL;
}

/**
 * Actualiza el porcentaje predeterminado para futuras cargas de productos.
 * REGLA ESTRICTA DE NEGOCIO:
 * - NO ejecuta actualizaciones masivas ni modifica productos existentes.
 * - Solo afecta a los productos que se creen a partir de este cambio.
 */
export async function setMargenPredeterminado(nuevoMargen, usuarioId = null) {
  const margen = Number(nuevoMargen);
  if (isNaN(margen) || margen < 0 || margen > 999.99) {
    throw new Error('El porcentaje predeterminado debe ser un número válido mayor o igual a 0%.');
  }

  // Redondear a 2 decimales
  const margenRedondeado = Math.round(margen * 100) / 100;

  // Actualizar o insertar configuración
  const updateRes = await query(
    "UPDATE configuracion SET valor = ?, actualizado_en = CURRENT_TIMESTAMP WHERE clave = 'margen_predeterminado'",
    [String(margenRedondeado)]
  );

  const affected = updateRes?.affectedRows ?? updateRes?.changes ?? 0;
  if (affected === 0) {
    await query(
      "INSERT INTO configuracion (clave, valor, descripcion) VALUES ('margen_predeterminado', ?, 'Porcentaje predeterminado para productos nuevos')",
      [String(margenRedondeado)]
    );
  }

  // Registrar auditoría de la modificación
  if (usuarioId) {
    try {
      await registrarActividad({
        usuarioId,
        accion: 'CONFIGURAR_MARGEN_PREDETERMINADO',
        entidad: 'CONFIGURACION',
        descripcion: `Porcentaje predeterminado para productos nuevos actualizado al ${margenRedondeado}%`
      });
    } catch (e) {
      // Ignorar si falla el registro de actividad
    }
  }

  return margenRedondeado;
}

export default {
  getMargenPredeterminado,
  setMargenPredeterminado
};
