import { Router } from 'express';
import {
  getProductos,
  getProductoById,
  crearProducto,
  actualizarProducto,
  desactivarProducto
} from '../controllers/productoController.js';
import { getMovimientosPorProducto } from '../controllers/stockController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas de productos requieren usuario autenticado
router.use(authMiddleware);

router.get('/', getProductos);
router.get('/:id', getProductoById);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.delete('/:id', desactivarProducto);

// Movimientos de un producto específico (Sección 30: GET /api/productos/:id/movimientos)
router.get('/:id/movimientos', getMovimientosPorProducto);

export default router;
