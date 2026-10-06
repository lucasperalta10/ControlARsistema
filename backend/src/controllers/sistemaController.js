import { query, getDbMode } from '../config/db.js';

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
        version: '1.0.0',
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

export default {
  getEstado
};
