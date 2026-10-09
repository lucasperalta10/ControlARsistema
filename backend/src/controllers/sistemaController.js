import { query, getDbMode } from '../config/db.js';
import { getMargenPredeterminado, setMargenPredeterminado } from '../services/configuracionService.js';

export async function getEstado(req, res, next) {
  try {
    const start = Date.now();
    // Test DB query
    await query('SELECT 1');
    const latency = Date.now() - start;

    const [totalProductos] = await query('SELECT COUNT(*) as count FROM productos WHERE activo = 1');
    const [totalCategorias] = await query('SELECT COUNT(*) as count FROM categorias WHERE activo = 1');
    const [totalUsuarios] = await query('SELECT COUNT(*) as count FROM usuarios WHERE activo = 1');
    const [totalMovimientos] = await query('SELECT COUNT(*) as count FROM movimientos_stock');

    res.json({
      success: true,
      sistema: {
        nombre: 'ControlAR API',
        version: '1.0.5b',
        entorno: process.env.NODE_ENV || 'development',
        uptimeSegundos: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      },
      baseDeDatos: {
        estado: 'CONECTADO',
        modo: getDbMode().toUpperCase(),
        latenciaMs: latency,
        conteos: {
          productosActivos: Number(totalProductos.count || totalProductos['COUNT(*)'] || 0),
          categoriasActivas: Number(totalCategorias.count || totalCategorias['COUNT(*)'] || 0),
          usuariosActivos: Number(totalUsuarios.count || totalUsuarios['COUNT(*)'] || 0),
          totalMovimientosStock: Number(totalMovimientos.count || totalMovimientos['COUNT(*)'] || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener la configuración general del sistema (ej: margen predeterminado)
 */
export async function getConfiguracion(req, res, next) {
  try {
    const margenPredeterminado = await getMargenPredeterminado();
    res.json({
      success: true,
      configuracion: {
        margen_predeterminado: margenPredeterminado
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Actualizar el margen predeterminado para futuras cargas de productos
 */
export async function updateMargenPredeterminado(req, res, next) {
  try {
    const { margen_predeterminado } = req.body;

    if (margen_predeterminado === undefined || margen_predeterminado === null || margen_predeterminado === '') {
      return res.status(400).json({
        success: false,
        message: 'Debés ingresar un porcentaje de margen válido.'
      });
    }

    const nuevoMargen = await setMargenPredeterminado(margen_predeterminado, req.usuario?.id);

    res.json({
      success: true,
      message: `Porcentaje predeterminado actualizado al ${nuevoMargen}%. Solo se aplicará a productos nuevos.`,
      configuracion: {
        margen_predeterminado: nuevoMargen
      }
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getEstado,
  getConfiguracion,
  updateMargenPredeterminado
};

