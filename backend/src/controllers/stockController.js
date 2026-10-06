import {
  registrarMovimiento,
  obtenerMovimientosPorProducto,
  obtenerTodosLosMovimientos,
  obtenerProductosParaReponer
} from '../services/stockService.js';

export async function registrarEntrada(req, res, next) {
  try {
    const { productoId } = req.params;
    const { cantidad, motivo } = req.body;

    const resultado = await registrarMovimiento({
      productoId,
      usuarioId: req.user.id,
      tipo: 'ENTRADA',
      cantidad,
      motivo: motivo || 'Entrada de mercadería'
    });

    res.json({
      success: true,
      message: `Se registraron +${resultado.cantidad} ${resultado.unidadVenta} exitosamente.`,
      movimiento: resultado
    });
  } catch (error) {
    next(error);
  }
}

export async function registrarSalida(req, res, next) {
  try {
    const { productoId } = req.params;
    const { cantidad, motivo } = req.body;

    const resultado = await registrarMovimiento({
      productoId,
      usuarioId: req.user.id,
      tipo: 'SALIDA',
      cantidad,
      motivo: motivo || 'Salida / Venta'
    });

    res.json({
      success: true,
      message: `Se registraron -${resultado.cantidad} ${resultado.unidadVenta} exitosamente.`,
      movimiento: resultado
    });
  } catch (error) {
    next(error);
  }
}

export async function registrarAjuste(req, res, next) {
  try {
    const { productoId } = req.params;
    const { cantidad, motivo } = req.body; // Aquí cantidad es el nuevo stock físico

    const resultado = await registrarMovimiento({
      productoId,
      usuarioId: req.user.id,
      tipo: 'AJUSTE',
      cantidad,
      motivo: motivo || 'Ajuste de stock físico'
    });

    res.json({
      success: true,
      message: `Stock ajustado a ${resultado.stockNuevo} ${resultado.unidadVenta} exitosamente.`,
      movimiento: resultado
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductosReponer(req, res, next) {
  try {
    const productos = await obtenerProductosParaReponer();
    const formateados = productos.map(p => ({
      ...p,
      precio_compra: Number(p.precio_compra),
      costo_real: Number(p.costo_real),
      margen_ganancia: Number(p.margen_ganancia),
      precio_gondola: Number(p.precio_gondola),
      stock_actual: Number(p.stock_actual),
      stock_minimo: Number(p.stock_minimo),
      estado_stock: Number(p.stock_actual) <= 0 ? 'AGOTADO' : 'REPONER'
    }));

    res.json({
      success: true,
      total: formateados.length,
      productos: formateados
    });
  } catch (error) {
    next(error);
  }
}

export async function getMovimientosPorProducto(req, res, next) {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const movimientos = await obtenerMovimientosPorProducto(id, { limit, offset });
    res.json({
      success: true,
      total: movimientos.length,
      movimientos
    });
  } catch (error) {
    next(error);
  }
}

export async function getTodosLosMovimientos(req, res, next) {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const movimientos = await obtenerTodosLosMovimientos({ limit, offset });

    res.json({
      success: true,
      total: movimientos.length,
      movimientos
    });
  } catch (error) {
    next(error);
  }
}

export default {
  registrarEntrada,
  registrarSalida,
  registrarAjuste,
  getProductosReponer,
  getMovimientosPorProducto,
  getTodosLosMovimientos
};
