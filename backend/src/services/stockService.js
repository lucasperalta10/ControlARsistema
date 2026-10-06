import { query } from '../config/db.js';
import { registrarActividad } from './actividadService.js';

/**
 * Servicio de Gestión Atómica de Stock y Movimientos
 */

export async function registrarMovimiento({ productoId, usuarioId, tipo, cantidad, motivo = '' }) {
  const pId = Number(productoId);
  const uId = Number(usuarioId);
  const cant = Number(cantidad);

  if (isNaN(pId) || pId <= 0) {
    throw new Error('ID de producto inválido.');
  }

  if (isNaN(cant) || cant <= 0) {
    throw new Error('La cantidad debe ser un número mayor a 0.');
  }

  // 1. Obtener producto actual
  const productos = await query('SELECT * FROM productos WHERE id = ? AND activo = 1', [pId]);
  if (!productos || productos.length === 0) {
    throw new Error('Producto no encontrado o inactivo.');
  }

  const producto = productos[0];
  const stockAnterior = Number(producto.stock_actual);
  let stockNuevo = stockAnterior;

  switch (tipo) {
    case 'ENTRADA':
      stockNuevo = stockAnterior + cant;
      break;

    case 'SALIDA':
      if (stockAnterior < cant) {
        throw new Error(`Stock insuficiente. Stock actual: ${stockAnterior} ${producto.unidad_venta}, se intentó retirar: ${cant} ${producto.unidad_venta}. No se permite stock negativo.`);
      }
      stockNuevo = stockAnterior - cant;
      break;

    case 'AJUSTE':
      // En un ajuste, 'cantidad' representa el nuevo stock físico
      stockNuevo = cant;
      if (stockNuevo < 0) {
        throw new Error('El nuevo stock ajustado no puede ser negativo.');
      }
      break;

    default:
      throw new Error(`Tipo de movimiento '${tipo}' no reconocido. Tipos válidos: ENTRADA, SALIDA, AJUSTE.`);
  }

  // Redondear a 3 decimales
  stockNuevo = Math.round(stockNuevo * 1000) / 1000;

  // 2. Actualizar stock del producto
  await query(
    'UPDATE productos SET stock_actual = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
    [stockNuevo, pId]
  );

  // 3. Registrar en movimientos_stock
  const resMov = await query(
    `INSERT INTO movimientos_stock (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [pId, uId, tipo, cant, stockAnterior, stockNuevo, motivo || null]
  );

  // 4. Registrar en actividad de auditoría
  await registrarActividad({
    usuarioId: uId,
    accion: `STOCK_${tipo}`,
    entidad: 'PRODUCTO',
    entidadId: pId,
    descripcion: `${tipo} de ${cant} ${producto.unidad_venta} en '${producto.nombre}'. Stock: ${stockAnterior} -> ${stockNuevo}. Motivo: ${motivo || 'Sin motivo'}`
  });

  return {
    movimientoId: resMov.insertId,
    productoId: pId,
    tipo,
    cantidad: cant,
    stockAnterior,
    stockNuevo,
    unidadVenta: producto.unidad_venta
  };
}

export async function obtenerMovimientosPorProducto(productoId, { limit = 50, offset = 0 } = {}) {
  const sql = `
    SELECT m.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, p.nombre AS producto_nombre, p.unidad_venta
    FROM movimientos_stock m
    JOIN productos p ON m.producto_id = p.id
    JOIN usuarios u ON m.usuario_id = u.id
    WHERE m.producto_id = ?
    ORDER BY m.creado_en DESC
    LIMIT ? OFFSET ?
  `;
  return await query(sql, [Number(productoId), Number(limit), Number(offset)]);
}

export async function obtenerTodosLosMovimientos({ limit = 100, offset = 0 } = {}) {
  const sql = `
    SELECT m.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, p.nombre AS producto_nombre, p.unidad_venta
    FROM movimientos_stock m
    JOIN productos p ON m.producto_id = p.id
    JOIN usuarios u ON m.usuario_id = u.id
    ORDER BY m.creado_en DESC
    LIMIT ? OFFSET ?
  `;
  return await query(sql, [Number(limit), Number(offset)]);
}

export async function obtenerProductosParaReponer() {
  const sql = `
    SELECT p.*, c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.activo = 1 AND (p.stock_actual <= p.stock_minimo OR p.stock_actual = 0)
    ORDER BY p.stock_actual ASC, p.nombre ASC
  `;
  return await query(sql);
}

export default {
  registrarMovimiento,
  obtenerMovimientosPorProducto,
  obtenerTodosLosMovimientos,
  obtenerProductosParaReponer
};
